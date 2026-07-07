// Validated sequential cyan ramp for the IV surface (single hue, monotone
// lightness, light-end contrast >= 2:1 against the dark scene background,
// checked with the dataviz skill's validate_palette.js --ordinal).
export const SURFACE_COLORSCALE: [number, string][] = [
  [0, "#1e5164"],
  [0.2, "#00829e"],
  [0.4, "#00abc2"],
  [0.6, "#00d3df"],
  [0.8, "#5ee8ee"],
  [1, "#d0f8fa"],
];

export const SCENE_BG = "#0a0f1d";
export const GRID_COLOR = "#1e2d4a";
export const AXIS_COLOR = "#475569";
