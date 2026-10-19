import { DARK_QUERY, THEME_STORAGE_KEY } from './theme';

export const themeScript = `(function () {
  try {
    var mode = localStorage.getItem('${THEME_STORAGE_KEY}');
    var dark = mode === 'DARK' ||
      (mode !== 'LIGHT' && window.matchMedia('${DARK_QUERY}').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;
