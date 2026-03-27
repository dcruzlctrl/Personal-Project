// UI rendering and DOM manipulation

function renderGrid() {
  const el = document.getElementById('crossword-grid');
  el.style.gridTemplateColumns = `repeat(${S.gridW}, var(--cell-size))`;
  el.style.gridTemplateRows = `repeat(${S.gridH}, var(--cell-size))`;
  el.innerHTML = '';

  for (let y = 0; y < S.gridH; y++) {
    for (let x = 0; x < S.gridW; x++) {
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.x = x;
      div.dataset.y = y;

      const letter = S.gridMap.get(`${x},${y}`);
      if (!letter) {
        div.classList.add('black');
      } else {
        // Add clue number if this is a word start
        const num = S.numberMap.get(`${x},${y}`);
        if (num) {
          const n = document.createElement('div');
          n.className = 'cell-num';
          n.textContent = num;
          div.appendChild(n);
        }

        // Add letter display
        const l = document.createElement('div');
        l.className = 'cell-letter';
        l.textContent = S.userMap.get(`${x},${y}`) || '';
        div.appendChild(l);

        div.addEventListener('click', () => onCellClick(x, y));
      }

      el.appendChild(div);
    }
  }
}

function renderClues() {
  const across = S.placedWords
    .filter(w => w.dir === 'across')
    .sort((a, b) => a.number - b.number);
  const down = S.placedWords
    .filter(w => w.dir === 'down')
    .sort((a, b) => a.number - b.number);

  const mkClue = (list) => list.map(w => `
    <div class="clue-item" id="ci-${w.dir}-${w.number}">
      <span class="clue-num">${w.number}</span>
      <span class="clue-text">${escapeHtml(w.clue)}</span>
    </div>`).join('');

  document.getElementById('across-list').innerHTML = mkClue(across);
  document.getElementById('down-list').innerHTML = mkClue(down);

  // Add click handlers
  document.querySelectorAll('.clue-item').forEach(el => {
    el.addEventListener('click', () => {
      const dir = el.id.split('-')[1];
      const num = parseInt(el.id.split('-')[2]);
      selectWord(dir, num);
    });
  });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function refreshCells() {
  document.querySelectorAll('.cell:not(.black)').forEach(cell => {
    const x = +cell.dataset.x;
    const y = +cell.dataset.y;
    const key = `${x},${y}`;

    // Update letter
    const l = cell.querySelector('.cell-letter');
    if (l) l.textContent = S.userMap.get(key) || '';

    // Update visual states
    cell.classList.remove('selected', 'word-hl', 'correct', 'incorrect');
    const chk = S.checkMap.get(key);

    if (chk === 'correct') cell.classList.add('correct');
    else if (chk === 'incorrect') cell.classList.add('incorrect');
    else if (S.sel?.x === x && S.sel?.y === y) cell.classList.add('selected');
    else if (inSelWord(x, y)) cell.classList.add('word-hl');
  });
}

function inSelWord(x, y) {
  if (!S.selWord) return false;
  const w = S.selWord;

  if (w.dir === 'across') {
    return y === w.y && x >= w.x && x < w.x + w.word.length;
  }
  return x === w.x && y >= w.y && y < w.y + w.word.length;
}

function refreshClues() {
  // Clear active clues
  document.querySelectorAll('.clue-item').forEach(el => el.classList.remove('active'));

  if (!S.selWord) return;

  // Highlight active clue
  const el = document.getElementById(`ci-${S.selWord.dir}-${S.selWord.number}`);
  if (el) {
    el.classList.add('active');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Update clue bar
  const bar = document.getElementById('clue-bar');
  const dirLabel = S.selWord.dir === 'across' ? 'Across' : 'Down';
  bar.innerHTML = `
    <span class="clue-bar-num">${S.selWord.number} ${dirLabel}.</span>
    <span class="clue-bar-text">${escapeHtml(S.selWord.clue)}</span>
  `;

  // Auto-switch tab on mobile
  if (window.innerWidth <= 600 && S.selWord.dir !== S.activeTab) {
    switchTab(S.selWord.dir);
  }
}

function switchTab(tab) {
  S.activeTab = tab;
  document.getElementById('tab-across').classList.toggle('active', tab === 'across');
  document.getElementById('tab-down').classList.toggle('active', tab === 'down');
  document.getElementById('across-list').classList.toggle('hidden', tab !== 'across');
  document.getElementById('down-list').classList.toggle('hidden', tab !== 'down');
}

function showScreen(id) {
  ['home-screen', 'loading-screen', 'puzzle-screen'].forEach(s => {
    document.getElementById(s).classList.toggle('hidden', s !== id);
  });
}

function buildLoadingGrid() {
  const pattern = [1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0];
  const el = document.getElementById('loading-grid');

  el.innerHTML = pattern.map((v, i) => `
    <div class="loading-cell${v === 0 ? ' dark' : ''}" style="animation-delay:${((i * 0.18) % 1.6).toFixed(2)}s"></div>
  `).join('');
}

function buildDecoGrid() {
  const pattern = [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1];
  const el = document.getElementById('deco-grid');

  el.innerHTML = pattern.map(v =>
    `<div class="deco-cell${v === 0 ? ' empty' : ''}"></div>`
  ).join('');
}

function calcCellSize() {
  const isMobile = window.innerWidth <= 600;
  const availW = isMobile
    ? window.innerWidth - 16
    : (window.innerWidth * 0.55) - 32;
  const availH = isMobile
    ? (window.innerHeight - 180) * 0.52
    : window.innerHeight - 130;

  const byW = Math.floor(availW / S.gridW);
  const byH = Math.floor(availH / S.gridH);
  const size = Math.max(22, Math.min(44, byW, byH));

  document.documentElement.style.setProperty('--cell-size', `${size}px`);
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error-msg').classList.add('hidden');
}
