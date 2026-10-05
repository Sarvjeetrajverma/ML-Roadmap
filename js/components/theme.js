// --- 3-LEVEL THEME SLIDER LOGIC --- //
const themeSlider = document.getElementById('theme-slider');
const btnDec = document.getElementById('btn-decrease');
const btnInc = document.getElementById('btn-increase');
const themeLabelNav = document.getElementById('theme-label-nav');
const htmlEl = document.documentElement;

const themes = [ { id: 'dark', name: 'Dark' }, { id: 'light', name: 'Light' }, { id: 'read', name: 'Read' } ];

let savedThemeId = localStorage.getItem('theme') || 'dark';
let currentLevel = themes.findIndex(t => t.id === savedThemeId);
if (currentLevel === -1) currentLevel = 0;

function applyThemeLevel(level) {
  if (level < 0) level = 0; if (level > 2) level = 2;
  themeSlider.value = level; const activeTheme = themes[level];
  if (activeTheme.id === 'dark') htmlEl.removeAttribute('data-theme'); else htmlEl.setAttribute('data-theme', activeTheme.id);
  themeLabelNav.textContent = activeTheme.name; localStorage.setItem('theme', activeTheme.id);
}

themeSlider.addEventListener('input', (e) => applyThemeLevel(parseInt(e.target.value)));
btnDec.addEventListener('click', () => applyThemeLevel(parseInt(themeSlider.value) - 1));
btnInc.addEventListener('click', () => applyThemeLevel(parseInt(themeSlider.value) + 1));
applyThemeLevel(currentLevel);
export { applyThemeLevel };