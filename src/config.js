// Global game configuration. Keep this file small and boring.
// Gameplay numbers live in src/data/balance.json, not here.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Set to true to show physics bodies and the debug HUD.
export const DEBUG = false;

// Bumped once per ship. Must match the ?v= params in index.html.
export const VERSION = '0.0.7';

// Render at device pixel ratio so text is crisp on retina screens. All game code keeps using
// GAME_WIDTH x GAME_HEIGHT logical coordinates; main.js zooms every camera by DPR.
export const DPR = Math.min(3, Math.max(1, (typeof window !== 'undefined' && window.devicePixelRatio) || 1));
