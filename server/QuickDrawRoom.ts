import { Client, Room } from 'colyseus';
import { QuickDrawState } from './QuickDrawState';
import type { GameManager } from './GameManager';

interface JoinOptions {
  playerId?: string;
}

export class QuickDrawRoom extends Room<QuickDrawState> {
  static manager: GameManager | null = null;

  private playerBySession = new Map<string, string>();

  static setManager(manager: GameManager) {
    QuickDrawRoom.manager = manager;
  }

  onCreate(options: { roomCode?: string }) {
    this.maxClients = 2;
    this.setState(new QuickDrawState());
    this.state.roomId = this.roomId;
    if (options?.roomCode) {
      this.state.code = options.roomCode;
    }
    this.setMetadata({ code: this.state.code });
    if (QuickDrawRoom.manager) {
      QuickDrawRoom.manager.registerRoomInstance(this, this.state.code);
    }
  }

  async onAuth(_client: Client, options: JoinOptions) {
    const playerId = options.playerId;
    if (!playerId || !QuickDrawRoom.manager) {
      return false;
    }

    try {
      const room = QuickDrawRoom.manager.getRoom(this.roomId);
      return room.players.some((player) => player.id === playerId);
    } catch (error) {
      return false;
    }
  }

  onJoin(client: Client, options: JoinOptions) {
    const playerId = options.playerId;
    if (!playerId) {
      throw new Error('playerId is required to join room');
    }

    this.playerBySession.set(client.sessionId, playerId);
    this.state.roomId = this.roomId;

    if (QuickDrawRoom.manager) {
      QuickDrawRoom.manager.markPlayerConnected(this.roomId, playerId);
    }
  }

  async onLeave(client: Client) {
    const playerId = this.playerBySession.get(client.sessionId);
    this.playerBySession.delete(client.sessionId);

    if (!playerId || !QuickDrawRoom.manager) {
      return;
    }

    let room;
    try {
      room = QuickDrawRoom.manager.getRoom(this.roomId);
    } catch (error) {
      return;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.connected) {
      return;
    }

    await QuickDrawRoom.manager.markPlayerDisconnected(this.roomId, playerId);
  }

  async onDispose() {
    if (QuickDrawRoom.manager) {
      QuickDrawRoom.manager.unregisterRoomInstance(this.roomId, this.state.code);
    }
  }
}
