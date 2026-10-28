// Flat, Mini-Metro-ish palette. Use these names; never hard-code hex in scenes.
// Numbers are for Phaser fills, strings are for text styles.

export const C = {
  bg: 0xf3efe6,       bgS: '#f3efe6',
  floor: 0xe9e3d6,
  wall: 0xd6cfbf,
  ink: 0x1d1d1f,      inkS: '#1d1d1f',
  mute: 0x8a8578,     muteS: '#8a8578',
  red: 0xe3262c,      redS: '#e3262c',
  blue: 0x2b70c9,     blueS: '#2b70c9',
  yellow: 0xf3c13a,   yellowS: '#f3c13a',
  green: 0x3aa655,    greenS: '#3aa655',
  white: 0xffffff,    whiteS: '#ffffff',
};

export const RESOURCE_COLORS = {
  stamina: { fill: C.yellow, str: C.yellowS, glyph: '⚡' },
  hunger: { fill: C.red, str: C.redS, glyph: '♥' },
  sanity: { fill: C.blue, str: C.blueS, glyph: '◉' },
};

export const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
