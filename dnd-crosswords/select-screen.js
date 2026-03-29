// ═══════════════════════════════════════════════════
// SELECT SCREEN — renders the puzzle list grouped by difficulty
// ═══════════════════════════════════════════════════

function renderSelectScreen() {
  const list  = document.getElementById('puzzle-list');
  const saved = JSON.parse(localStorage.getItem('dnd_completed') || '[]');

  // Group puzzles by difficulty
  const byDiff = { easy: [], medium: [], hard: [] };
  DB.forEach((p, i) => { if (byDiff[p.difficulty]) byDiff[p.difficulty].push({ ...p, _idx: i }); });

  const diffLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  let html = '';

  for (const diff of ['easy', 'medium', 'hard']) {
    if (!byDiff[diff].length) continue;
    html += `<div class="difficulty-section">
      <div class="difficulty-label">${diffLabels[diff]}</div>
      <div class="puzzle-cards">`;
    byDiff[diff].forEach(p => {
      const done = saved.includes(p.id);
      html += `<div class="puzzle-card ${done ? 'completed' : ''}" data-idx="${p._idx}">
        <div class="card-left">
          <div class="card-theme">${p.display_theme}</div>
          <div class="card-meta">${p.word_count} words • ${p.letter_pool.length} letters</div>
        </div>
        <span class="diff-badge ${diff}">${diffLabels[diff]}</span>
      </div>`;
    });
    html += `</div></div>`;
  }

  list.innerHTML = html;
  list.querySelectorAll('.puzzle-card').forEach(card => {
    card.addEventListener('click', () => startPuzzle(parseInt(card.dataset.idx)));
  });
}
