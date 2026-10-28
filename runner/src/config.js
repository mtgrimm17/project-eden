// Runner prototype config. VERSION is shared with the root game (src/config.js).
export { VERSION } from '../../src/config.js';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TILE = 30;
export const DEBUG = false;
export const DPR = Math.min(3, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
