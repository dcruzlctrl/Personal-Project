# AI Crossword Puzzle Generator

An AI-powered crossword puzzle builder using Claude API.

## Features

- **Theme-based generation**: Input any theme and Claude generates custom crosswords
- **Full crossword experience**: Check answers, reveal words, play/restart
- **Responsive design**: Works on desktop and mobile
- **Keyboard shortcuts**: Arrow keys, Tab, letter input, Backspace
- **Interactive clue selection**: Click clues or navigate with arrow keys

## Getting Started

1. **Set your API key** in `api.js` or as an environment variable
2. **Open `index.html`** in a browser
3. **Enter a theme** (e.g., "Space", "NYC", "90s Movies")
4. Click **Generate Puzzle**

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate / switch directions |
| Tab | Next word |
| Shift+Tab | Previous word |
| Letter | Enter letter |
| Backspace | Delete letter |

## File Structure

```
crosswords/
├── index.html          # HTML shell (~50 lines)
├── styles.css          # All styling (~250 lines)
├── state.js            # App state (~30 lines)
├── engine.js           # Crossword layout engine (~180 lines)
├── api.js              # Claude API integration (~40 lines)
├── ui.js               # Rendering functions (~200 lines)
├── interaction.js      # Event handlers & game logic (~160 lines)
└── app.js              # Main initialization (~50 lines)
```

## Architecture

**Separation of Concerns:**

- **state.js**: Single source of truth for puzzle data, selection, and user input
- **engine.js**: Pure crossword layout algorithm (no DOM or API)
- **api.js**: Claude integration, word generation
- **ui.js**: Rendering grid, clues, and visual updates
- **interaction.js**: Keyboard handling, cell clicks, game logic
- **app.js**: Main flow, orchestration, initialization

**Max 250 lines per file** for maintainability.

## API Configuration

The app uses Claude Sonnet 4 model. To use it:

1. Get an API key from [Anthropic Console](https://console.anthropic.com)
2. Update the API key in `api.js` or set it via environment

## Development

Each file has a clear responsibility:

- Add new game mechanics → `interaction.js`
- Tweak styling → `styles.css`
- Modify API behavior → `api.js`
- Change puzzle layout rules → `engine.js`
- Add UI elements → `ui.js` + `index.html`

No globals except `S` (state) and utility functions.

## Mobile

The app is fully responsive with optimized touch interactions and mobile-first styling. Clue tabs auto-switch on mobile when selecting words.
