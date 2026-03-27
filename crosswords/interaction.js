// User interaction and game logic

function getWordAt(x, y, dir) {
  return S.placedWords.find(w => {
    if (w.dir !== dir) return false;
    if (dir === 'across') return y === w.y && x >= w.x && x < w.x + w.word.length;
    return x === w.x && y >= w.y && y < w.y + w.word.length;
  }) || null;
}

function onCellClick(x, y) {
  S.checkMap.clear();

  if (S.sel?.x === x && S.sel?.y === y) {
    // Toggle direction
    const nd = S.selDir === 'across' ? 'down' : 'across';
    const w = getWordAt(x, y, nd);
    if (w) {
      S.selDir = nd;
      S.selWord = w;
    }
  } else {
    S.sel = { x, y };
    let w = getWordAt(x, y, S.selDir);
    if (!w) {
      S.selDir = S.selDir === 'across' ? 'down' : 'across';
      w = getWordAt(x, y, S.selDir);
    }
    S.selWord = w;
  }

  refreshCells();
  refreshClues();
}

function selectWord(dir, number) {
  const w = S.placedWords.find(p => p.dir === dir && p.number === number);
  if (!w) return;

  S.sel = { x: w.x, y: w.y };
  S.selDir = dir;
  S.selWord = w;
  S.checkMap.clear();

  refreshCells();
  refreshClues();
}

function advance() {
  if (!S.sel || !S.selWord) return;

  const w = S.selWord;
  const dx = w.dir === 'across' ? 1 : 0;
  const dy = w.dir === 'down' ? 1 : 0;
  const nx = S.sel.x + dx;
  const ny = S.sel.y + dy;

  if (inSelWordXY(nx, ny, w)) S.sel = { x: nx, y: ny };
}

function retreat() {
  if (!S.sel || !S.selWord) return;

  const w = S.selWord;
  const dx = w.dir === 'across' ? 1 : 0;
  const dy = w.dir === 'down' ? 1 : 0;
  const nx = S.sel.x - dx;
  const ny = S.sel.y - dy;

  if (inSelWordXY(nx, ny, w)) S.sel = { x: nx, y: ny };
}

function inSelWordXY(x, y, w) {
  if (w.dir === 'across') return y === w.y && x >= w.x && x < w.x + w.word.length;
  return x === w.x && y >= w.y && y < w.y + w.word.length;
}

function checkAnswers() {
  S.checkMap.clear();
  let allFilled = true;
  let allCorrect = true;

  for (const [key, correct] of S.gridMap) {
    const user = S.userMap.get(key);

    if (!user) {
      allFilled = false;
      continue;
    }

    const ok = user === correct;
    S.checkMap.set(key, ok ? 'correct' : 'incorrect');
    if (!ok) allCorrect = false;
  }

  refreshCells();

  if (allFilled && allCorrect) {
    setTimeout(() => alert('🎉 Perfect! Puzzle solved!'), 80);
  }
}

function revealWord() {
  if (!S.selWord) return;

  const w = S.selWord;
  const dx = w.dir === 'across' ? 1 : 0;
  const dy = w.dir === 'down' ? 1 : 0;

  for (let i = 0; i < w.word.length; i++) {
    S.userMap.set(`${w.x + i * dx},${w.y + i * dy}`, w.word[i]);
  }

  S.checkMap.clear();
  refreshCells();
}

// Keyboard handling
document.addEventListener('keydown', e => {
  if (!S.sel) return;

  const { x, y } = S.sel;

  if (e.key === 'Backspace') {
    e.preventDefault();
    S.checkMap.clear();
    const key = `${x},${y}`;

    if (S.userMap.has(key)) {
      S.userMap.delete(key);
    } else {
      retreat();
      S.userMap.delete(`${S.sel.x},${S.sel.y}`);
    }

    refreshCells();
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    const all = [...S.placedWords].sort((a, b) =>
      a.number !== b.number
        ? a.number - b.number
        : a.dir > b.dir ? 1 : -1
    );
    const idx = all.findIndex(w => w === S.selWord);
    const nw = all[(idx + (e.shiftKey ? all.length - 1 : 1)) % all.length];
    selectWord(nw.dir, nw.number);
    return;
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (S.selDir !== 'across') {
      const w = getWordAt(x, y, 'across');
      if (w) { S.selDir = 'across'; S.selWord = w; }
    } else if (S.gridMap.has(`${x + 1},${y}`)) {
      S.sel = { x: x + 1, y };
      S.selWord = getWordAt(x + 1, y, 'across') || S.selWord;
    }
    refreshCells();
    refreshClues();
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (S.selDir !== 'across') {
      const w = getWordAt(x, y, 'across');
      if (w) { S.selDir = 'across'; S.selWord = w; }
    } else if (S.gridMap.has(`${x - 1},${y}`)) {
      S.sel = { x: x - 1, y };
      S.selWord = getWordAt(x - 1, y, 'across') || S.selWord;
    }
    refreshCells();
    refreshClues();
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (S.selDir !== 'down') {
      const w = getWordAt(x, y, 'down');
      if (w) { S.selDir = 'down'; S.selWord = w; }
    } else if (S.gridMap.has(`${x},${y + 1}`)) {
      S.sel = { x, y: y + 1 };
      S.selWord = getWordAt(x, y + 1, 'down') || S.selWord;
    }
    refreshCells();
    refreshClues();
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (S.selDir !== 'down') {
      const w = getWordAt(x, y, 'down');
      if (w) { S.selDir = 'down'; S.selWord = w; }
    } else if (S.gridMap.has(`${x},${y - 1}`)) {
      S.sel = { x, y: y - 1 };
      S.selWord = getWordAt(x, y - 1, 'down') || S.selWord;
    }
    refreshCells();
    refreshClues();
    return;
  }

  // Letter input
  if (/^[a-zA-Z]$/.test(e.key)) {
    e.preventDefault();
    S.checkMap.clear();
    S.userMap.set(`${x},${y}`, e.key.toUpperCase());
    advance();
    refreshCells();
    return;
  }
});

// Tab switching
document.getElementById('tab-across').addEventListener('click', () => switchTab('across'));
document.getElementById('tab-down').addEventListener('click', () => switchTab('down'));
