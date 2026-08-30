// Fallback used only if a trip's JSON has no theme yet.
const DEFAULT_THEME = {
  bg: '#f1efe9',
  ink: '#16232c',
  dim: '#5d6a72',
  line: 'rgba(22,35,44,.16)',
  panel: '#fbfaf7',
  deep: '#12222a',
  onDeep: '#eceae3',
  accent: '#1f6f78',
  mapLand: '#e2ded1',
  mapLine: 'rgba(22,35,44,.22)',
};

// Maps a trip's theme object (from its JSON) to CSS custom properties,
// scoped by applying as an inline style on the trip's root element.
export function themeVars(theme) {
  const t = { ...DEFAULT_THEME, ...theme };
  return {
    '--bg': t.bg,
    '--ink': t.ink,
    '--dim': t.dim,
    '--line': t.line,
    '--panel': t.panel,
    '--deep': t.deep,
    '--on-deep': t.onDeep,
    '--accent': t.accent,
    '--map-land': t.mapLand,
    '--map-line': t.mapLine,
  };
}
