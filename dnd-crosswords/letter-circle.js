// ═══════════════════════════════════════════════════
// LETTER CIRCLE — SVG circle of letter nodes with swipe/tap input
// ═══════════════════════════════════════════════════

// Calculates evenly-spaced (x,y) positions around a circle
function circlePositions(n, cx, cy, r) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

// Builds the SVG letter nodes and wires up all touch/mouse events
function renderLetterCircle() {
  const svg   = document.getElementById('letter-svg');
  const area  = document.querySelector('.letter-circle-area');
  const areaH = area.clientHeight || 260;
  const areaW = area.clientWidth  || window.innerWidth;
  const W     = Math.min(areaW, areaH, 300);
  const cx = W / 2, cy = W / 2;

  svg.setAttribute('width',  W);
  svg.setAttribute('height', W);
  svg.setAttribute('viewBox', `0 0 ${W} ${W}`);

  const letters = [...puzzle.letter_pool];

  // Shuffle display order so letters appear in random positions each game
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  const n   = letters.length;
  const r   = Math.min(W * 0.36, n <= 8 ? 90 : n <= 12 ? 100 : 108);
  const pos = circlePositions(n, cx, cy, r);

  // nodePositions is a global used by swipe logic in game.js
  nodePositions = pos.map((p, i) => ({ ...p, letter: letters[i], idx: i }));

  svg.innerHTML = '';

  // Lines layer (drawn first so letter nodes sit on top)
  const linesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  linesG.id = 'swipe-lines';
  svg.appendChild(linesG);

  // Cursor tracking line (the live line following your finger/mouse)
  const trackLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  trackLine.id = 'track-line';
  trackLine.classList.add('swipe-line');
  trackLine.style.display = 'none';
  svg.appendChild(trackLine);

  // Create one SVG group per letter node
  nodePositions.forEach(({ x, y, letter, idx }) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('letter-node');
    g.dataset.idx = idx;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', 22);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x); text.setAttribute('y', y);
    text.textContent = letter;

    g.appendChild(circle); g.appendChild(text);
    svg.appendChild(g);
  });

  attachSwipeListeners();
}

// Find which letter node is closest to a screen coordinate (within hit radius)
function getNodeAtPoint(clientX, clientY) {
  const svg  = document.getElementById('letter-svg');
  const rect = svg.getBoundingClientRect();
  const W    = parseFloat(svg.getAttribute('width')) || 280;
  const scaleX = W / rect.width;
  const scaleY = W / rect.height;
  const svgX = (clientX - rect.left) * scaleX;
  const svgY = (clientY - rect.top)  * scaleY;

  let closest = null, minDist = 28; // 28px hit radius in SVG coordinates
  nodePositions.forEach(node => {
    const d = Math.hypot(svgX - node.x, svgY - node.y);
    if (d < minDist) { minDist = d; closest = node; }
  });
  return closest;
}

// Redraws the connecting lines between selected nodes
function updateSwipeLines() {
  const linesG = document.getElementById('swipe-lines');
  linesG.innerHTML = '';
  for (let i = 0; i < swipedIdxs.length - 1; i++) {
    const a = nodePositions[swipedIdxs[i]];
    const b = nodePositions[swipedIdxs[i + 1]];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.classList.add('swipe-line');
    linesG.appendChild(line);
  }
}

// Visually marks which nodes are currently selected (active = highlighted)
function updateNodeStyles() {
  document.querySelectorAll('.letter-node').forEach(g => {
    const idx = parseInt(g.dataset.idx);
    g.classList.toggle('active', swipedIdxs.includes(idx));
  });
}

// Attaches all touch and mouse event handlers to the SVG
function attachSwipeListeners() {
  const svg = document.getElementById('letter-svg');

  // TAP MODE: each node tap adds/removes one letter
  const onTapNode = (clientX, clientY) => {
    const node = getNodeAtPoint(clientX, clientY);
    if (!node) return;

    const lastIdx = swipedIdxs[swipedIdxs.length - 1];

    // Tapping the last selected node acts as backspace
    if (lastIdx === node.idx) {
      swipedIdxs.pop();
    } else if (!swipedIdxs.includes(node.idx)) {
      swipedIdxs.push(node.idx);
      vibrate(8);
    }

    updateNodeStyles();
    updateSwipeLines();
    renderWordPreview();

    // Auto-submit when the built word matches any remaining puzzle word
    const word   = swipedIdxs.map(i => nodePositions[i].letter).join('');
    const maxLen = Math.max(...puzzle.words.filter(w => !found.has(w)).map(w => w.length), 0);
    if (word.length >= maxLen || puzzle.words.filter(w => !found.has(w)).includes(word)) {
      setTimeout(() => submitWord(), 120);
    }
  };

  // SWIPE MODE: drag across nodes to build a word
  const onStart = (clientX, clientY) => {
    if (tapMode) { onTapNode(clientX, clientY); return; }
    const node = getNodeAtPoint(clientX, clientY);
    if (!node) return;
    swiping    = true;
    swipedIdxs = [node.idx];
    updateNodeStyles();
    updateSwipeLines();
    renderWordPreview();
    vibrate(10);
  };

  const onMove = (clientX, clientY) => {
    if (tapMode || !swiping) return;
    const node = getNodeAtPoint(clientX, clientY);

    // Draw tracking line from last node to current cursor position
    const trackLine = document.getElementById('track-line');
    if (swipedIdxs.length > 0) {
      const last  = nodePositions[swipedIdxs[swipedIdxs.length - 1]];
      const rect  = svg.getBoundingClientRect();
      const W2    = parseFloat(svg.getAttribute('width')) || 280;
      const svgX  = (clientX - rect.left) * (W2 / rect.width);
      const svgY  = (clientY - rect.top)  * (W2 / rect.height);
      trackLine.style.display = '';
      trackLine.setAttribute('x1', last.x); trackLine.setAttribute('y1', last.y);
      trackLine.setAttribute('x2', svgX);   trackLine.setAttribute('y2', svgY);
    }

    if (!node) return;
    if (swipedIdxs[swipedIdxs.length - 1] === node.idx) return;

    // Swiping back over the previous node = undo last letter
    if (swipedIdxs.length >= 2 && swipedIdxs[swipedIdxs.length - 2] === node.idx) {
      swipedIdxs.pop();
    } else if (!swipedIdxs.includes(node.idx)) {
      swipedIdxs.push(node.idx);
      vibrate(8);
    }

    updateNodeStyles();
    updateSwipeLines();
    renderWordPreview();
  };

  const onEnd = () => {
    if (tapMode) return;
    if (!swiping) return;
    swiping = false;
    document.getElementById('track-line').style.display = 'none';
    submitWord();
  };

  // Touch events
  svg.addEventListener('touchstart', e => {
    e.preventDefault();
    onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  svg.addEventListener('touchmove', e => {
    e.preventDefault();
    onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  svg.addEventListener('touchend', e => { e.preventDefault(); onEnd(); }, { passive: false });

  // Mouse events
  svg.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
  window.addEventListener('mousemove', e => { if (swiping && !tapMode) onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { if (swiping && !tapMode) onEnd(); });
}
