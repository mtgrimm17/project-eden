// Audio cue table. Owned by the audio team.
//
//   name:     what gameplay code asks for   -> audio.play('pickup')
//   key:      the asset key loaded in PreloadScene (leave null until the file exists)
//   volume:   0..1
//   fallback: pitch (Hz) of the placeholder blip used until `key` is loaded

export const CUES = {
  pickup:     { key: null, volume: 0.8, fallback: 880 },
  hit:        { key: null, volume: 1.0, fallback: 180 },
  'ui-select':{ key: null, volume: 0.6, fallback: 600 },
};
