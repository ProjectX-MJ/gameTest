import type { DrawingStroke, Guess } from '../src/types/game';

export type PlayerRole = 'drawer' | 'guesser';

export interface PlayerState {
  id: string;
  name: string;
  role: PlayerRole;
  connected: boolean;
  ready: boolean;
}

export interface WordState {
  text: string;
  hint: string;
  difficulty: number;
}

export interface RoomSettings {
  roundDuration: number;
  maxRounds: number;
  difficulty: string;
}

export interface RoomState {
  id: string;
  code: string;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
  settings: RoomSettings;
  players: PlayerState[];
  currentRound: number;
  score: number;
  currentWord?: WordState;
  roundStartTime?: number;
  gameStartTime?: number;
  strokes: DrawingStroke[];
  guesses: Guess[];
  usedWords: string[];
}

export interface ApiResult<T> {
  success: boolean;
  room?: RoomState;
  data?: T;
  playerId?: string;
  role?: PlayerRole;
  error?: string;
}
