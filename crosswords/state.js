// Global app state
const S = {
  // Puzzle data
  placedWords: [],
  gridMap: new Map(),    // Correct answers: "x,y" -> letter
  numberMap: new Map(),  // Cell numbering: "x,y" -> number
  userMap: new Map(),    // User input: "x,y" -> letter
  checkMap: new Map(),   // Check results: "x,y" -> 'correct'|'incorrect'

  // Grid dimensions
  gridW: 0,
  gridH: 0,

  // Selection state
  sel: null,             // Current cell {x, y}
  selDir: 'across',      // Current direction
  selWord: null,         // Current word object

  // Puzzle metadata
  theme: '',
  activeTab: 'across',
};
