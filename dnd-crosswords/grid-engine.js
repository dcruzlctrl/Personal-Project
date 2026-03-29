// ═══════════════════════════════════════════════════
// GRID ENGINE — builds the crossword layout from a word list
// ═══════════════════════════════════════════════════

// Returns a Map of "row,col" -> letter for a word placed at (row,col) in direction dir
function wordCells(word, row, col, dir) {
  const m = new Map();
  for (let i = 0; i < word.length; i++) {
    const r = dir === 'H' ? row     : row + i;
    const c = dir === 'H' ? col + i : col;
    m.set(`${r},${c}`, word[i]);
  }
  return m;
}

// Returns true if a word can be placed at (row,col,dir) without conflicts
// intersectKey is the one shared cell that IS allowed to already exist
function canPlace(cells, word, row, col, dir, intersectKey) {
  const wc = wordCells(word, row, col, dir);

  for (const [key, letter] of wc) {
    const [r, c] = key.split(',').map(Number);

    // Conflict: cell already occupied by a different letter
    if (cells.has(key) && cells.get(key) !== letter) return false;

    // For every NEW cell that isn't the shared intersection point,
    // check it won't touch a parallel neighbour (would merge two words illegally)
    if (key !== intersectKey && !cells.has(key)) {
      const sides = dir === 'H'
        ? [`${r-1},${c}`, `${r+1},${c}`]
        : [`${r},${c-1}`, `${r},${c+1}`];
      for (const nb of sides) {
        if (cells.has(nb) && !wc.has(nb) && nb !== intersectKey) return false;
      }
    }
  }

  // No cell may immediately precede or follow the word inline
  const preR = dir === 'H' ? row            : row - 1;
  const preC = dir === 'H' ? col - 1        : col;
  const posR = dir === 'H' ? row            : row + word.length;
  const posC = dir === 'H' ? col + word.length : col;
  if (cells.has(`${preR},${preC}`)) return false;
  if (cells.has(`${posR},${posC}`)) return false;

  return true;
}

// Try to place a word by intersecting it with any already-placed word.
// Tries both H and V directions against every anchor.
// Returns true if placed successfully.
function tryPlace(word, placements, cells) {
  for (const p of placements) {
    for (const dir of ['H', 'V']) {
      if (dir === p.dir) continue; // must cross at 90 degrees

      for (let li = 0; li < word.length; li++) {
        for (let pi = 0; pi < p.word.length; pi++) {
          if (p.word[pi] !== word[li]) continue;

          const intR = p.dir === 'H' ? p.row      : p.row + pi;
          const intC = p.dir === 'H' ? p.col + pi : p.col;
          const intersectKey = `${intR},${intC}`;

          const row = dir === 'H' ? intR      : intR - li;
          const col = dir === 'H' ? intC - li : intC;

          if (canPlace(cells, word, row, col, dir, intersectKey)) {
            placements.push({ word, row, col, dir });
            for (let i = 0; i < word.length; i++) {
              const r = dir === 'H' ? row     : row + i;
              const c = dir === 'H' ? col + i : col;
              cells.set(`${r},${c}`, word[i]);
            }
            return true;
          }
        }
      }
    }
  }
  return false;
}

// Main entry point — takes an array of words, returns layout object
function buildGrid(words) {
  const placements = [];
  const cells = new Map(); // "r,c" -> letter

  const place = (word, row, col, dir) => {
    placements.push({ word, row, col, dir });
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'H' ? row     : row + i;
      const c = dir === 'H' ? col + i : col;
      cells.set(`${r},${c}`, word[i]);
    }
  };

  // Place longest word first horizontally at origin
  const sorted = [...words].sort((a, b) => b.length - a.length);
  place(sorted[0], 0, 0, 'H');

  // Queue of words still needing placement
  let queue = sorted.slice(1);

  // Multiple passes: words that can't connect yet may connect after others are placed
  let lastSize = -1;
  while (queue.length > 0 && queue.length !== lastSize) {
    lastSize = queue.length;
    const remaining = [];
    for (const word of queue) {
      if (!tryPlace(word, placements, cells)) remaining.push(word);
    }
    queue = remaining;
  }

  // Any words still unplaced after all passes: attach them to the grid
  // by finding a letter match anywhere in the existing cells
  for (const word of queue) {
    let attached = false;
    for (const [key, letter] of cells) {
      if (attached) break;
      const [kr, kc] = key.split(',').map(Number);
      for (let li = 0; li < word.length && !attached; li++) {
        if (word[li] !== letter) continue;
        for (const dir of ['H', 'V']) {
          const row = dir === 'H' ? kr      : kr - li;
          const col = dir === 'H' ? kc - li : kc;
          if (canPlace(cells, word, row, col, dir, key)) {
            place(word, row, col, dir);
            attached = true;
            break;
          }
        }
      }
    }
    // Last resort: float below (should rarely happen with good word sets)
    if (!attached) {
      const allR  = [...cells.keys()].map(k => parseInt(k.split(',')[0]));
      place(word, Math.max(...allR, 0) + 2, 0, 'H');
    }
  }

  // ── Normalize coords to non-negative before enforcement ──────────────────
  // (words placed above row 0 produce negative keys that break cell deletion)
  {
    const allR = [...cells.keys()].map(k => parseInt(k.split(',')[0]));
    const allC = [...cells.keys()].map(k => parseInt(k.split(',')[1]));
    const minR = Math.min(...allR);
    const minC = Math.min(...allC);
    if (minR !== 0 || minC !== 0) {
      const entries = [...cells.entries()];
      cells.clear();
      for (const [k, v] of entries) {
        const [r, c] = k.split(',').map(Number);
        cells.set(`${r - minR},${c - minC}`, v);
      }
      for (const p of placements) {
        p.row -= minR;
        p.col -= minC;
      }
    }
  }
  // ── Connectivity enforcement ──────────────────────────────────────────────
  // Find all disconnected islands. For each island that isn't the main one,
  // pull its words out and re-place them with relaxed adjacency rules until
  // they attach to the main body. Repeats until only 1 island remains or
  // no more progress can be made.
  function getIslands(cells) {
    const allKeys = [...cells.keys()];
    const visited = new Set();
    const islands = [];
    for (const start of allKeys) {
      if (visited.has(start)) continue;
      const island = new Set();
      const stack = [start];
      while (stack.length) {
        const k = stack.pop();
        if (visited.has(k)) continue;
        visited.add(k); island.add(k);
        const [r, c] = k.split(',').map(Number);
        for (const nb of [`${r-1},${c}`,`${r+1},${c}`,`${r},${c-1}`,`${r},${c+1}`]) {
          if (cells.has(nb) && !visited.has(nb)) stack.push(nb);
        }
      }
      islands.push(island);
    }
    return islands;
  }

  // Try to place word using only letter-match (no direction restriction),
  // ignoring the parallel-neighbour rule so isolated words can attach.
  function forceAttach(word, cells, placements) {
    // Snapshot of main-island cells so we search only those
    const snapshot = new Map(cells);
    for (const [key, letter] of snapshot) {
      const [kr, kc] = key.split(',').map(Number);
      for (let li = 0; li < word.length; li++) {
        if (word[li] !== letter) continue;
        for (const dir of ['H', 'V']) {
          const row = dir === 'H' ? kr      : kr - li;
          const col = dir === 'H' ? kc - li : kc;
          const wc  = wordCells(word, row, col, dir);
          // Only require: no letter conflicts with existing cells
          let ok = true;
          for (const [k2, l2] of wc) {
            if (snapshot.has(k2) && snapshot.get(k2) !== l2) { ok = false; break; }
          }
          if (!ok) continue;
          // Must share exactly the one intersection cell (key) — word must cross here
          if (!wc.has(key)) continue;
          // Commit
          for (const [k2, l2] of wc) cells.set(k2, l2);
          const idx = placements.findIndex(p => p.word === word);
          if (idx !== -1) placements[idx] = { word, row, col, dir };
          console.log(`[grid-engine] forceAttach: placed "${word}" ${dir} at ${row},${col} via cell ${key}`);
          return true;
        }
      }
    }
    return false;
  }

  let maxPasses = words.length * 2;
  while (maxPasses-- > 0) {
    const islands = getIslands(cells);
    if (islands.length <= 1) break;
    // Main island = largest by cell count
    const mainIsland = islands.reduce((a, b) => a.size >= b.size ? a : b);
    let progress = false;
    for (const island of islands) {
      if (island === mainIsland) continue;
      // Find words that belong entirely to this isolated island
      const islandWords = placements.filter(p => {
        for (let i = 0; i < p.word.length; i++) {
          const r = p.dir === 'H' ? p.row     : p.row + i;
          const c = p.dir === 'H' ? p.col + i : p.col;
          if (!island.has(`${r},${c}`)) return false;
        }
        return true;
      });
      for (const p of islandWords) {
        // Remove this word's cells so forceAttach only sees the main island
        for (let i = 0; i < p.word.length; i++) {
          const r = p.dir === 'H' ? p.row     : p.row + i;
          const c = p.dir === 'H' ? p.col + i : p.col;
          cells.delete(`${r},${c}`);
        }
        if (forceAttach(p.word, cells, placements)) {
          progress = true;
          break; // re-evaluate islands from scratch after each attachment
        } else {
          // Restore if attachment failed
          for (let i = 0; i < p.word.length; i++) {
            const r = p.dir === 'H' ? p.row     : p.row + i;
            const c = p.dir === 'H' ? p.col + i : p.col;
            cells.set(`${r},${c}`, p.word[i]);
          }
        }
      }
      if (progress) break; // restart outer loop with fresh island detection
    }
    if (!progress) {
      const remaining = getIslands(cells);
      if (remaining.length > 1) console.warn('[grid-engine] stuck — islands:', remaining.length, 'words:', JSON.stringify(words));
      break;
    }
  }
  // ── End connectivity enforcement ──────────────────────────────────────────

  // Normalize so top-left cell is always 0,0
  const allR = [...cells.keys()].map(k => parseInt(k.split(',')[0]));
  const allC = [...cells.keys()].map(k => parseInt(k.split(',')[1]));
  const minR = Math.min(...allR);
  const minC = Math.min(...allC);
  const maxR = Math.max(...allR);
  const maxC = Math.max(...allC);

  const normCells = new Map();
  for (const [k, v] of cells) {
    const [r, c] = k.split(',').map(Number);
    normCells.set(`${r - minR},${c - minC}`, v);
  }

  const normPlacements = placements.map(p => ({
    ...p, row: p.row - minR, col: p.col - minC
  }));

  return {
    cells:      normCells,
    placements: normPlacements,
    rows:       maxR - minR + 1,
    cols:       maxC - minC + 1
  };
}
