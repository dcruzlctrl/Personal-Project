// ═══════════════════════════════════════════════════
// GAME STATE — variables shared across all modules
// ═══════════════════════════════════════════════════
let DB           = [];       // all puzzles loaded from dnd-jam-db.json
let puzzle       = null;     // current puzzle object
let layout       = null;     // { cells, placements, rows, cols } from buildGrid()
let found        = new Set(); // words the player has found so far
let revealedCells= new Set(); // "row,col" keys whose letters are shown

let swiping      = false;
let swipedIdxs   = [];       // indices into nodePositions of selected letters
let nodePositions= [];       // [{x, y, letter, idx}] — letter circle node data

let hintCount    = 0;
let puzzleIdx    = 0;
let selectedWord = null;     // word currently highlighted on the grid
let tapMode      = false;    // false = swipe mode, true = tap-per-letter mode

// ═══════════════════════════════════════════════════
// START PUZZLE — resets state and renders all game components
// ═══════════════════════════════════════════════════
function startPuzzle(idx) {
  puzzleIdx     = idx;
  puzzle        = DB[idx];
  layout        = buildGrid(puzzle.words);
  found         = new Set();
  revealedCells = new Set();
  hintCount     = 0;
  swipedIdxs    = [];
  swiping       = false;
  selectedWord  = null;
  tapMode       = false;

  document.getElementById('header-theme').textContent = puzzle.display_theme;
  document.getElementById('mode-swipe').classList.add('active');
  document.getElementById('mode-tap').classList.remove('active');

  renderProgressDots();
  renderGrid();
  renderHintLine();
  renderLetterCircle();
  renderWordPreview();

  showScreen('game-screen');
}

// ═══════════════════════════════════════════════════
// GRID RENDER — draws the crossword tile grid
// ═══════════════════════════════════════════════════
function renderGrid() {
  const el = document.getElementById('crossword-grid');
  const { rows, cols, cells } = layout;

  const maxH      = 276; // 300px wrapper minus 24px padding
  const maxW      = window.innerWidth - 24;
  const available = Math.min(maxW, maxH);
  const tileSize  = Math.max(28, Math.floor(available / Math.max(rows, cols)));

  el.style.gridTemplateColumns = `repeat(${cols}, ${tileSize}px)`;
  el.style.gridTemplateRows    = `repeat(${rows}, ${tileSize}px)`;
  el.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key    = `${r},${c}`;
      const letter = cells.get(key);
      const div    = document.createElement('div');
      div.className    = 'grid-tile';
      div.dataset.key  = key;

      if (!letter) {
        div.classList.add('dead');
      } else if (revealedCells.has(key)) {
        div.classList.add('filled');
        div.textContent = letter;
      } else {
        div.classList.add('empty');
        div.addEventListener('click', () => onGridTileClick(key));
        div.addEventListener('touchend', e => { e.preventDefault(); onGridTileClick(key); }, { passive: false });
      }
      el.appendChild(div);
    }
  }
}

// Flashes tiles green when a word is found, then reveals the letters
function flashWordOnGrid(word) {
  const p = layout.placements.find(pl => pl.word === word);
  if (!p) return;
  const tiles = [];
  for (let i = 0; i < word.length; i++) {
    const r   = p.dir === 'H' ? p.row     : p.row + i;
    const c   = p.dir === 'H' ? p.col + i : p.col;
    const key = `${r},${c}`;
    revealedCells.add(key);
    const tile = document.querySelector(`[data-key="${key}"]`);
    if (tile) tiles.push(tile);
  }

  document.querySelectorAll('.grid-tile').forEach(t => t.classList.remove('highlighted'));
  if (selectedWord === word) selectedWord = null;

  tiles.forEach(t => { t.classList.add('flash'); t.textContent = ''; });
  setTimeout(() => {
    tiles.forEach(t => {
      t.classList.remove('flash', 'empty', 'highlighted');
      t.classList.add('filled');
      t.textContent = layout.cells.get(t.dataset.key);
    });
    renderHintLine();
  }, 400);
}

// ═══════════════════════════════════════════════════
// PROGRESS DOTS — one dot per word, turns green when found
// ═══════════════════════════════════════════════════
function renderProgressDots() {
  const el = document.getElementById('progress-dots');
  el.innerHTML = puzzle.words.map(w =>
    `<div class="progress-dot ${found.has(w) ? 'found' : ''}"></div>`
  ).join('');
}

// ═══════════════════════════════════════════════════
// GRID TILE CLICK — selects/cycles the word under a tapped tile
// ═══════════════════════════════════════════════════
function onGridTileClick(key) {
  // Find all unsolved words that include this tile
  const matches = layout.placements.filter(p => {
    if (found.has(p.word)) return false;
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === 'H' ? p.row     : p.row + i;
      const c = p.dir === 'H' ? p.col + i : p.col;
      if (`${r},${c}` === key) return true;
    }
    return false;
  });
  if (!matches.length) return;

  // If the tile is at an intersection, cycle through the crossing words on each tap
  const words = matches.map(m => m.word);
  if (selectedWord && words.includes(selectedWord)) {
    const idx  = words.indexOf(selectedWord);
    const next = words[(idx + 1) % words.length];
    selectedWord = next === selectedWord ? null : next;
  } else {
    selectedWord = words[0];
  }

  renderHintLine();
  highlightWord(selectedWord);
}

// ═══════════════════════════════════════════════════
// HINT LINE — shows the flavor-text hint for the selected word
// ═══════════════════════════════════════════════════
function renderHintLine() {
  const el = document.getElementById('hint-text');
  if (!selectedWord) {
    el.innerHTML = 'Tap the grid to get a hint';
    return;
  }
  const hints = puzzle.hints || {};
  const hint  = hints[selectedWord];
  if (hint) {
    el.innerHTML = hint;
  } else {
    // Fallback when hints haven't been generated yet
    const p   = layout.placements.find(pl => pl.word === selectedWord);
    const dir = p ? (p.dir === 'H' ? 'across' : 'down') : '';
    el.innerHTML = `<span>${selectedWord.length}</span> letters &nbsp;·&nbsp; ${dir}`;
  }
}

// ═══════════════════════════════════════════════════
// GRID HIGHLIGHT — outlines all tiles belonging to the selected word
// ═══════════════════════════════════════════════════
function highlightWord(word) {
  document.querySelectorAll('.grid-tile').forEach(t => t.classList.remove('highlighted'));
  if (!word) return;
  const p = layout.placements.find(pl => pl.word === word);
  if (!p) return;
  for (let i = 0; i < word.length; i++) {
    const r   = p.dir === 'H' ? p.row     : p.row + i;
    const c   = p.dir === 'H' ? p.col + i : p.col;
    const key = `${r},${c}`;
    const tile = document.querySelector(`[data-key="${key}"]`);
    if (tile && !revealedCells.has(key)) tile.classList.add('highlighted');
  }
}

// ═══════════════════════════════════════════════════
// SWIPE PREVIEW — shows letters building up during a swipe
// ═══════════════════════════════════════════════════
function renderWordPreview(shake = false) {
  const el   = document.getElementById('swipe-preview');
  const word = swipedIdxs.map(i => nodePositions[i].letter).join('');
  if (!word) { el.innerHTML = ''; return; }
  el.innerHTML = word.split('').map(l =>
    `<div class="preview-letter ${shake ? 'shake' : ''}">${l}</div>`
  ).join('');
}

// ═══════════════════════════════════════════════════
// WORD SUBMISSION — checks the built word against remaining puzzle words
// ═══════════════════════════════════════════════════
function submitWord() {
  const word = swipedIdxs.map(i => nodePositions[i].letter).join('');
  if (word.length < 2) { resetSwipe(); return; }

  const remaining = puzzle.words.filter(w => !found.has(w));
  const match     = remaining.find(w => w === word);

  if (match) {
    found.add(match);
    flashWordOnGrid(match);
    playSuccess();
    vibrate([20, 30, 60]);
    renderProgressDots();
    resetSwipe();
    if (found.size === puzzle.words.length) setTimeout(showComplete, 600);
  } else {
    renderWordPreview(true); // shake animation
    playError();
    vibrate(80);
    setTimeout(() => resetSwipe(), tapMode ? 500 : 400);
  }
}

// Clears the current swipe/tap selection
function resetSwipe() {
  swipedIdxs = [];
  document.getElementById('track-line').style.display = 'none';
  document.getElementById('swipe-lines').innerHTML = '';
  updateNodeStyles();
  renderWordPreview();
}

// ═══════════════════════════════════════════════════
// COMPLETE — shows the end-of-puzzle overlay
// ═══════════════════════════════════════════════════
function showComplete() {
  playComplete();
  vibrate([30, 50, 100]);

  const saved = JSON.parse(localStorage.getItem('dnd_completed') || '[]');
  if (!saved.includes(puzzle.id)) {
    saved.push(puzzle.id);
    localStorage.setItem('dnd_completed', JSON.stringify(saved));
  }

  document.getElementById('complete-sub').textContent =
    hintCount === 0 ? 'Perfect — no hints used!' : `${hintCount} hint${hintCount > 1 ? 's' : ''} used`;
  document.getElementById('complete-words').innerHTML =
    [...puzzle.words].map(w => `<div class="complete-word">${w}</div>`).join('');
  document.getElementById('complete-overlay').classList.add('show');
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// DEV: auto-solve all remaining words instantly
function solveAll() {
  const remaining = puzzle.words.filter(w => !found.has(w));
  let delay = 0;
  for (const word of remaining) {
    setTimeout(() => {
      found.add(word);
      flashWordOnGrid(word);
      renderProgressDots();
      if (found.size === puzzle.words.length) setTimeout(showComplete, 600);
    }, delay);
    delay += 450;
  }
}
document.getElementById('solve-btn').addEventListener('click', solveAll);

document.getElementById('back-btn').addEventListener('click', () => {
  showScreen('select-screen');
  renderSelectScreen();
});

document.getElementById('next-btn').addEventListener('click', () => {
  document.getElementById('complete-overlay').classList.remove('show');
  startPuzzle((puzzleIdx + 1) % DB.length);
});

document.getElementById('mode-swipe').addEventListener('click', () => {
  tapMode = false;
  resetSwipe();
  document.getElementById('mode-swipe').classList.add('active');
  document.getElementById('mode-tap').classList.remove('active');
});

document.getElementById('mode-tap').addEventListener('click', () => {
  tapMode = true;
  resetSwipe();
  document.getElementById('mode-tap').classList.add('active');
  document.getElementById('mode-swipe').classList.remove('active');
});

// ═══════════════════════════════════════════════════
// INIT — fetch puzzle database then show select screen
// ═══════════════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('dnd-jam-db.json');
    DB = await res.json();
    // Filter out any puzzles with truncated words (safety net)
    DB = DB.filter(p => p.words.every(w => w.length >= 3));
  } catch (e) {
    // Fallback sample data so the game works without a server
    DB = [
      {
        id: "sample_classes_medium_1",
        theme: "D&D Classes",
        display_theme: "Classes",
        difficulty: "medium",
        words: ["ROGUE", "DRUID", "RANGER", "CLERIC"],
        letter_pool: ["R","O","G","U","E","D","I","A","N","C","L"],
        word_count: 4,
        generated: new Date().toISOString(),
        model: "sample"
      },
      {
        id: "sample_races_easy_1",
        theme: "D&D Races",
        display_theme: "Races",
        difficulty: "easy",
        words: ["ELF", "GNOME", "TROLL", "HUMAN"],
        letter_pool: ["E","L","F","G","N","O","M","T","R","H","U","A"],
        word_count: 4,
        generated: new Date().toISOString(),
        model: "sample"
      }
    ];
  }
  renderSelectScreen();
}

init();
