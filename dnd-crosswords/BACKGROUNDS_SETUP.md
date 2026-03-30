# Theme Background Images Setup

## What's Changed

### Files Modified
1. **style.css** — Added background image support to `.grid-wrapper`:
   - `background-size: cover` — scales image to fill container
   - `background-position: center` — centers the image
   - `::before` pseudo-element — applies semi-transparent dark overlay (`rgba(0,0,0,0.45)`) to maintain grid/text visibility
   - Grid elements get `z-index: 1` to appear above the background

2. **game.js** — Added background loading and application:
   - New global `BACKGROUNDS` object stores theme→URL mapping
   - `loadBackgrounds()` — fetches `theme-backgrounds.json` on startup
   - `applyThemeBackground(theme)` — applies the image URL to grid wrapper when puzzle starts

### Files Created
- **theme-backgrounds.json** — Maps all 31 D&D themes to free Unsplash image URLs
  - All images are 1200×800px (web-optimized)
  - All are free for commercial use with no attribution required
  - Uses Unsplash's dynamic image resize API for consistency

## How It Works

1. On app load, `loadBackgrounds()` fetches the JSON mapping
2. When a puzzle starts via `startPuzzle()`, the theme name is passed to `applyThemeBackground()`
3. The corresponding image URL is applied as `background-image` on `.grid-wrapper`
4. The dark overlay (`::before`) ensures the grid and letters remain readable
5. `background-attachment: fixed` creates a subtle parallax effect on mobile (optional, can be removed)

## Image Selection Strategy

Each theme was matched to thematically appropriate free stock images:
- **Combat themes** (Actions, Combat Basics, Conditions) → dynamic/energetic imagery
- **Fantasy themes** (Dragon Colors, Demon Lords, Planar Realms) → dark/mystical
- **Classes/Equipment** (Armor Types, Weapons, Classes) → medieval/historical
- **Magic themes** (Spells, Famous Spells, School of Magic) → mystical/ethereal
- **Sports themes** (MLB, NBA, UFC) → action/sports imagery
- **Modern themes** (Python, Hip Hop) → contemporary visual style

## Customization

To adjust the overlay darkness, modify this line in `style.css`:
```css
.grid-wrapper::before {
  background: rgba(0, 0, 0, 0.45);  /* Change last number: 0-1 (0=transparent, 1=black) */
}
```

To use a different image for a theme, update the URL in `theme-backgrounds.json`:
```json
"Your Theme": "https://new-image-url-here.com/image.jpg?w=1200&h=800&fit=crop"
```

## Testing

Open the app and verify:
- Each puzzle shows a different background
- Grid tiles and letters are clearly readable (no contrast issues)
- Images load smoothly without lag
- Text/UI elements in header/footer remain unaffected

## Image Attribution

All images sourced from [Unsplash](https://unsplash.com) — free, high-quality photography for any purpose.
