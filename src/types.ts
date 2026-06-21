/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'WHACK_HIM' | 'WHACK_HER' | 'ALTERNATING';

export type GameState = 'START' | 'RULES' | 'PLAYING' | 'GAMEOVER';

export interface MoleState {
  id: number;          // 0-8 for a 3x3 grid
  active: boolean;     // Whether a mole is currently popped up
  type: 'HIM' | 'HER'; // Who is showing up in this hole
  spawnTime: number;   // Timestamp when it popped up
  duration: number;    // How long it stays visible (ms)
  isWhacked: boolean;  // Has it been clicked?
  photoIndex: number;  // Index of the photo used from the set
}

export interface GameStats {
  score: number;
  hits: number;
  misses: number;
  penalties: number;
}

export interface SavedPhotos {
  hisPhotos: string[]; // Base64 data URLs
  herPhotos: string[]; // Base64 data URLs
}

export interface HighScoreRecord {
  mode: GameMode;
  score: number;
  date: string;
}
