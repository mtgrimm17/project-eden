// Audio cue table. Owned by the audio team.
//
//   name:     what gameplay code asks for   -> audio.play('good')
//   key:      the asset key loaded in PreloadScene (leave null until the file exists)
//   volume:   0..1
//   fallback: pitch (Hz) of the placeholder blip used until `key` is loaded

export const CUES = {
  'ui-select': { key: null, volume: 0.6, fallback: 600 },
  good:        { key: null, volume: 0.8, fallback: 880 },
  meh:         { key: null, volume: 0.8, fallback: 330 },
  sleep:       { key: null, volume: 0.7, fallback: 220 },
  death:       { key: null, volume: 1.0, fallback: 110 },
};
