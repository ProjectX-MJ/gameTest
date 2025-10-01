export interface Word {
  id: number;
  text: string;
  difficulty: 1 | 2 | 3;
  hint: string;
  category?: string;
}

export interface Player {
  id: string;
  name: string;
  role: 'drawer' | 'guesser';
}

export interface Guess {
  id: string;
  playerId: string;
  text: string;
  correct: boolean;
  timestamp: number;
}

export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  timestamp: number;
}

export interface GameSettings {
  roundDuration: number; // seconds
  maxRounds: number;
  wordsPerRound: number;
  difficulty: 1 | 2 | 3 | 'mixed';
}