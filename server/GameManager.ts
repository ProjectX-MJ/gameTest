import { matchMaker } from 'colyseus';
import { WORDS } from './words';
import type { QuickDrawRoom } from './QuickDrawRoom';
import type { RoomState, PlayerState, RoomSettings } from './types';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function checkGuess(guess: string, targetWord: string): boolean {
  return guess.toLowerCase().trim() === targetWord.toLowerCase().trim();
}

function getRandomWord(difficulty: string, usedWords: string[] = []) {
  let filteredWords = WORDS;

  if (difficulty !== 'mixed') {
    const diffNum = parseInt(difficulty, 10);
    filteredWords = WORDS.filter((word) => word.difficulty === diffNum);
  }

  const availableWords = filteredWords.filter((word) => !usedWords.includes(word.text.toLowerCase()));

  if (availableWords.length === 0) {
    return filteredWords[Math.floor(Math.random() * filteredWords.length)];
  }

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

export class GameManager {
  private rooms = new Map<string, RoomState>();

  private codeToRoomId = new Map<string, string>();

  private roomInstances = new Map<string, QuickDrawRoom>();

  async createRoom(settings: Partial<RoomSettings>) {
    const roomCode = this.generateUniqueRoomCode();
    const roomInstance = await matchMaker.createRoom('quickdraw', { roomCode });
    const roomId = roomInstance.roomId;

    const primaryPlayer: PlayerState = {
      id: `player_${Date.now()}`,
      name: 'Player1',
      role: 'drawer',
      connected: true,
      ready: false,
    };

    const room: RoomState = {
      id: roomId,
      code: roomCode,
      createdAt: Date.now(),
      status: 'waiting',
      settings: {
        roundDuration: settings?.roundDuration ?? 90,
        maxRounds: settings?.maxRounds ?? 1,
        difficulty: settings?.difficulty ?? 'mixed',
      },
      players: [primaryPlayer],
      currentRound: 1,
      score: 0,
      strokes: [],
      guesses: [],
      usedWords: [],
    };

    this.rooms.set(roomId, room);
    this.codeToRoomId.set(roomCode, roomId);

    return {
      room,
      playerId: primaryPlayer.id,
    };
  }

  async joinRoom(roomCode: string) {
    const upperCode = roomCode.toUpperCase();
    const roomId = this.codeToRoomId.get(upperCode);
    if (!roomId) {
      throw new Error('Room not found');
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room data not found');
    }

    const connectedPlayers = room.players.filter((player) => player.connected);
    if (connectedPlayers.length >= 2) {
      throw new Error('Room is full');
    }

    const now = Date.now();
    const reusedPlayer = room.players.find((player) => !player.connected);
    let joiningPlayer: PlayerState;

    if (reusedPlayer) {
      reusedPlayer.name = 'Player2';
      reusedPlayer.connected = true;
      reusedPlayer.id = `player_${now}`;
      reusedPlayer.ready = false;
      joiningPlayer = reusedPlayer;
    } else {
      joiningPlayer = {
        id: `player_${now}`,
        name: 'Player2',
        role: 'guesser',
        connected: true,
        ready: false,
      };
      room.players.push(joiningPlayer);
    }

    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'player:joined', {
      players: room.players,
      playerName: joiningPlayer.name,
    });

    return {
      room,
      playerId: joiningPlayer.id,
      role: joiningPlayer.role,
    };
  }

  async toggleReady(roomId: string, playerId: string, ready: boolean) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already started');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    player.ready = ready;
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'player:ready', {
      playerId,
      ready,
      players: room.players,
    });

    const allReady = room.players.length >= 2 && room.players.every((p) => p.ready);

    return { allReady };
  }

  async startGame(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.status !== 'waiting') {
      throw new Error('Game already started or finished');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error('Player not found in room');
    }

    const allReady = room.players.length >= 2 && room.players.every((p) => p.ready);
    if (!allReady) {
      throw new Error('All players must be ready before starting');
    }

    room.status = 'playing';
    room.gameStartTime = Date.now();

    const firstWord = getRandomWord(room.settings.difficulty, room.usedWords);
    room.currentWord = firstWord;
    room.usedWords.push(firstWord.text.toLowerCase());
    room.roundStartTime = Date.now();

    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'game:started', {
      room: this.getPublicRoomState(room),
    });

    await Promise.all(room.players.map(async (p) => {
      if (!room.currentWord) {
        return;
      }
      if (p.role === 'drawer') {
        await this.broadcast(roomId, 'word:revealed', {
          playerId: p.id,
          word: room.currentWord.text,
          hint: room.currentWord.hint,
        });
      } else {
        await this.broadcast(roomId, 'word:hint', {
          playerId: p.id,
          wordLength: room.currentWord.text.length,
          hint: room.currentWord.hint,
        });
      }
    }));

    return this.getPublicRoomState(room);
  }

  async addStroke(roomId: string, playerId: string, stroke: any) {
    const room = this.requireRoom(roomId);
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.role !== 'drawer') {
      throw new Error('Only drawer can add strokes');
    }

    room.strokes.push(stroke);
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'stroke:added', { stroke });
  }

  async addGuess(roomId: string, playerId: string, guessText: string) {
    const room = this.requireRoom(roomId);
    if (!room.currentWord) {
      throw new Error('Room or word not found');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.role !== 'guesser') {
      throw new Error('Only guesser can make guesses');
    }

    const isCorrect = checkGuess(guessText, room.currentWord.text);
    const newGuess = {
      id: `guess_${Date.now()}`,
      playerId,
      text: guessText,
      correct: isCorrect,
      timestamp: Date.now(),
    };

    room.guesses.push(newGuess);
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'guess:result', {
      guess: newGuess,
      correct: isCorrect,
      score: room.score,
    });

    if (isCorrect) {
      room.score += 1;
      const newWord = getRandomWord(room.settings.difficulty);
      room.currentWord = newWord;
      room.strokes = [];
      this.rooms.set(roomId, room);

      await this.broadcast(roomId, 'canvas:clear', {});

      await Promise.all(room.players.map(async (p) => {
        if (!room.currentWord) {
          return;
        }
        if (p.role === 'drawer') {
          await this.broadcast(roomId, 'word:revealed', {
            playerId: p.id,
            word: room.currentWord.text,
            hint: room.currentWord.hint,
          });
        } else {
          await this.broadcast(roomId, 'word:hint', {
            playerId: p.id,
            wordLength: room.currentWord.text.length,
            hint: room.currentWord.hint,
          });
        }
      }));
    }

    return { correct: isCorrect, score: room.score };
  }

  async clearCanvas(roomId: string, playerId: string) {
    const room = this.requireRoom(roomId);
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.role !== 'drawer') {
      throw new Error('Only drawer can clear canvas');
    }

    room.strokes = [];
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'canvas:clear', {});
  }

  async skipWord(roomId: string, playerId: string) {
    const room = this.requireRoom(roomId);
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.role !== 'drawer') {
      throw new Error('Only drawer can skip word');
    }

    const newWord = getRandomWord(room.settings.difficulty, room.usedWords);
    room.currentWord = newWord;
    room.usedWords.push(newWord.text.toLowerCase());
    room.strokes = [];
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'canvas:clear', {});

    await Promise.all(room.players.map(async (p) => {
      if (!room.currentWord) {
        return;
      }
      if (p.role === 'drawer') {
        await this.broadcast(roomId, 'word:revealed', {
          playerId: p.id,
          word: room.currentWord.text,
          hint: room.currentWord.hint,
        });
      } else {
        await this.broadcast(roomId, 'word:hint', {
          playerId: p.id,
          wordLength: room.currentWord.text.length,
          hint: room.currentWord.hint,
        });
      }
    }));

    return { newWord: room.currentWord.text };
  }

  async nextRound(roomId: string) {
    const room = this.requireRoom(roomId);

    if (room.currentRound >= room.settings.maxRounds) {
      room.status = 'finished';
      this.rooms.set(roomId, room);
      await this.broadcast(roomId, 'game:ended', {
        finalScore: room.score,
        totalRounds: room.settings.maxRounds,
      });
      return { gameEnded: true, finalScore: room.score };
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    room.players.forEach((player) => {
      player.role = player.role === 'drawer' ? 'guesser' : 'drawer';
      player.ready = false;
    });

    room.currentRound += 1;
    room.strokes = [];
    room.guesses = [];
    room.roundStartTime = Date.now();

    const newWord = getRandomWord(room.settings.difficulty, room.usedWords);
    room.currentWord = newWord;
    room.usedWords.push(newWord.text.toLowerCase());
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'round:started', {
      round: room.currentRound,
      players: room.players,
    });

    await Promise.all(room.players.map(async (player) => {
      if (!room.currentWord) {
        return;
      }
      if (player.role === 'drawer') {
        await this.broadcast(roomId, 'word:revealed', {
          playerId: player.id,
          word: room.currentWord.text,
          hint: room.currentWord.hint,
        });
      } else {
        await this.broadcast(roomId, 'word:hint', {
          playerId: player.id,
          wordLength: room.currentWord.text.length,
          hint: room.currentWord.hint,
        });
      }
    }));

    return { round: room.currentRound, players: room.players };
  }

  async endGame(roomId: string) {
    const room = this.requireRoom(roomId);

    room.status = 'finished';
    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'game:ended', {
      finalScore: room.score,
      totalRounds: 1,
    });

    return { finalScore: room.score };
  }

  async leaveRoom(roomId: string, playerId: string) {
    const room = this.requireRoom(roomId);

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.connected = false;
      player.ready = false;
    }

    if (room.status === 'playing') {
      room.status = 'waiting';
      room.currentWord = undefined;
      room.strokes = [];
      room.guesses = [];
      room.currentRound = 1;
      room.score = 0;
      room.usedWords = [];
      room.roundStartTime = undefined;
      room.gameStartTime = undefined;
      room.players.forEach((p) => {
        if (p.connected) {
          p.ready = false;
        }
      });
      this.rooms.set(roomId, room);

      await this.broadcast(roomId, 'game:ended', {
        reason: 'player_disconnected',
        message: 'Game ended because a player disconnected',
        room: this.getPublicRoomState(room),
      });
    } else {
      this.rooms.set(roomId, room);
      await this.broadcast(roomId, 'player:disconnected', {
        playerId,
        players: room.players,
      });
    }
  }

  getRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  registerRoomInstance(room: QuickDrawRoom, code: string) {
    this.roomInstances.set(room.roomId, room);
    this.codeToRoomId.set(code, room.roomId);
  }

  unregisterRoomInstance(roomId: string, code: string) {
    this.roomInstances.delete(roomId);
    this.codeToRoomId.delete(code);
  }

  markPlayerConnected(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.connected = true;
    this.rooms.set(roomId, room);
  }

  async markPlayerDisconnected(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.connected = false;
    player.ready = false;

    this.rooms.set(roomId, room);

    await this.broadcast(roomId, 'player:disconnected', {
      playerId,
      players: room.players,
    });
  }

  private async broadcast(roomId: string, event: string, payload: any) {
    const instance = this.roomInstances.get(roomId);
    if (!instance) {
      console.warn(`Room instance ${roomId} not available for event ${event}`);
      return;
    }
    try {
      instance.broadcast(event, payload);
    } catch (error) {
      console.error(`Broadcast error for room ${roomId}, event ${event}:`, error);
    }
  }

  private getPublicRoomState(room: RoomState) {
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      players: room.players,
      settings: room.settings,
      currentRound: room.currentRound,
      score: room.score,
    };
  }

  private requireRoom(roomId: string): RoomState {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    return room;
  }

  private generateUniqueRoomCode(): string {
    let code: string;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts += 1;
    } while (this.codeToRoomId.has(code) && attempts < 10);

    if (this.codeToRoomId.has(code)) {
      throw new Error('Failed to generate unique room code');
    }

    return code;
  }
}
