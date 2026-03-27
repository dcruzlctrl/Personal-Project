// Main app initialization and flow

async function generate() {
  const theme = document.getElementById('theme-input').value.trim();
  if (!theme) {
    showError('Please enter a theme first.');
    return;
  }

  hideError();
  document.getElementById('generate-btn').disabled = true;
  showScreen('loading-screen');
  buildLoadingGrid();

  try {
    // Fetch words from API
    const words = await fetchWords(theme);

    // Build crossword layout
    const engine = new CrosswordEngine();
    const placed = engine.build(words);

    if (placed.length < 3) throw new Error('Too few words placed');

    // Update state
    S.placedWords = placed;
    S.gridMap = new Map(engine.grid);
    S.numberMap = engine.numberMap;
    S.userMap = new Map();
    S.checkMap = new Map();
    S.gridW = engine.width;
    S.gridH = engine.height;
    S.sel = null;
    S.selWord = null;
    S.selDir = 'across';
    S.theme = theme;

    // Render puzzle
    calcCellSize();
    document.getElementById('theme-badge').textContent = theme.toUpperCase();
    renderGrid();
    renderClues();
    switchTab('across');
    showScreen('puzzle-screen');

    // Auto-select first across word
    const first =
      placed.filter(w => w.dir === 'across').sort((a, b) => a.number - b.number)[0] ||
      placed.sort((a, b) => a.number - b.number)[0];

    if (first) selectWord(first.dir, first.number);
  } catch (err) {
    console.error(err);
    showScreen('home-screen');
    showError('Generation failed – please try again.');
  }

  document.getElementById('generate-btn').disabled = false;
}

// Event setup
document.getElementById('generate-btn').addEventListener('click', generate);
document.getElementById('theme-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') generate();
});

document.getElementById('check-btn').addEventListener('click', checkAnswers);
document.getElementById('reveal-btn').addEventListener('click', revealWord);
document.getElementById('new-btn').addEventListener('click', () => {
  showScreen('home-screen');
  document.getElementById('theme-input').focus();
});

window.addEventListener('resize', () => {
  if (S.placedWords.length) calcCellSize();
});

// Initialize
buildDecoGrid();
