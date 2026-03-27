// Crossword layout engine
class CrosswordEngine {
  constructor() {
    this.grid = new Map();
    this.placed = [];
  }

  getCell(x, y) {
    return this.grid.has(`${x},${y}`) ? this.grid.get(`${x},${y}`) : null;
  }

  setCell(x, y, letter) {
    this.grid.set(`${x},${y}`, letter);
  }

  canPlace(word, sx, sy, dir, requireIntersect = true) {
    const dx = dir === 'across' ? 1 : 0;
    const dy = dir === 'down' ? 1 : 0;
    const px = 1 - dx, py = 1 - dy; // perpendicular direction

    // Cell before and after must be empty
    if (this.getCell(sx - dx, sy - dy) !== null) return false;
    if (this.getCell(sx + word.length * dx, sy + word.length * dy) !== null) return false;

    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const x = sx + i * dx, y = sy + i * dy;
      const existing = this.getCell(x, y);

      if (existing !== null) {
        // Must match existing letter
        if (existing !== word[i]) return false;
        intersections++;
      } else {
        // Adjacent cells must be clear
        if (this.getCell(x + px, y + py) !== null) return false;
        if (this.getCell(x - px, y - py) !== null) return false;
      }
    }

    if (requireIntersect && intersections === 0) return false;
    return true;
  }

  doPlace(wordObj, sx, sy, dir) {
    const dx = dir === 'across' ? 1 : 0;
    const dy = dir === 'down' ? 1 : 0;

    for (let i = 0; i < wordObj.word.length; i++) {
      this.setCell(sx + i * dx, sy + i * dy, wordObj.word[i]);
    }

    this.placed.push({ ...wordObj, x: sx, y: sy, dir });
  }

  build(words) {
    // Clean and sort words by length (longest first)
    const clean = words
      .map(w => ({
        ...w,
        word: (w.word || '').toUpperCase().replace(/[^A-Z]/g, '')
      }))
      .filter(w => w.word.length >= 3)
      .sort((a, b) => b.word.length - a.word.length);

    if (!clean.length) return [];

    // Place first word horizontally at origin
    this.doPlace(clean[0], 0, 0, 'across');

    // Place remaining words
    for (let i = 1; i < clean.length; i++) {
      const wObj = clean[i];
      const word = wObj.word;
      let placed = false;

      // Try to intersect with existing words
      for (const pw of [...this.placed]) {
        if (placed) break;

        const newDir = pw.dir === 'across' ? 'down' : 'across';
        const pdx = pw.dir === 'across' ? 1 : 0;
        const pdy = pw.dir === 'down' ? 1 : 0;

        // Try each letter position
        for (let pi = 0; pi < pw.word.length && !placed; pi++) {
          for (let wi = 0; wi < word.length && !placed; wi++) {
            if (pw.word[pi] === word[wi]) {
              let sx, sy;
              if (newDir === 'down') {
                sx = pw.x + pi * pdx;
                sy = pw.y + pi * pdy - wi;
              } else {
                sx = pw.x + pi * pdx - wi;
                sy = pw.y + pi * pdy;
              }

              if (this.canPlace(word, sx, sy, newDir)) {
                this.doPlace(wObj, sx, sy, newDir);
                placed = true;
              }
            }
          }
        }
      }
    }

    return this.finalize();
  }

  finalize() {
    if (!this.placed.length) return [];

    // Normalize grid to (1,1) origin
    let minX = Infinity, minY = Infinity;
    for (const p of this.placed) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
    }

    this.placed = this.placed.map(p => ({
      ...p,
      x: p.x - minX + 1,
      y: p.y - minY + 1
    }));

    // Rebuild grid with normalized positions
    this.grid.clear();
    for (const p of this.placed) {
      const dx = p.dir === 'across' ? 1 : 0;
      const dy = p.dir === 'down' ? 1 : 0;
      for (let i = 0; i < p.word.length; i++) {
        this.setCell(p.x + i * dx, p.y + i * dy, p.word[i]);
      }
    }

    // Calculate grid dimensions
    let maxX = 0, maxY = 0;
    for (const [k] of this.grid) {
      const [x, y] = k.split(',').map(Number);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    this.width = maxX + 2;
    this.height = maxY + 2;

    // Assign clue numbers
    const starts = [];
    for (const [k] of this.grid) {
      const [x, y] = k.split(',').map(Number);
      const sa = this.placed.some(p => p.dir === 'across' && p.x === x && p.y === y);
      const sd = this.placed.some(p => p.dir === 'down' && p.x === x && p.y === y);
      if (sa || sd) starts.push({ x, y });
    }

    starts.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

    const numMap = new Map();
    starts.forEach((s, i) => numMap.set(`${s.x},${s.y}`, i + 1));

    this.placed = this.placed.map(p => ({
      ...p,
      number: numMap.get(`${p.x},${p.y}`)
    }));

    this.numberMap = numMap;
    return this.placed;
  }
}
