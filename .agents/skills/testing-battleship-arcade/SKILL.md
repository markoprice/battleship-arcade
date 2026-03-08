# Testing Battleship Arcade

## Overview
Battleship Arcade is a client-side React + TypeScript + Vite game with no backend. All testing is done locally via the dev server and browser.

## Local Setup
```bash
cd /home/ubuntu/repos/battleship-arcade
npm install
npm run build  # verify no TypeScript errors
npx vite --host 0.0.0.0 --port 5173  # start dev server
```
The dev server may use port 5174 if 5173 is occupied. Check the terminal output for the actual URL.

## Game Flow (Screen Sequence)
1. **Home** (`localhost:5174`) - Click PRESS START button
2. **Select Commander** - Click any Sales character (left side) to trigger roulette opponent selection on Product side (right side). After roulette finishes (~2-3s), auto-advances to matchup preview after ~1.2s.
3. **Commander Selected (Matchup Preview)** - Auto-advances to Place Fleet after ~4 seconds. No interaction needed.
4. **Place Your Fleet** - Ships auto-select starting with Carrier. Click grid cells to place each ship (they auto-advance). After all 5 ships placed, click START. A "READY FOR BATTLE?" popup appears with YES/NO.
5. **Gameplay** - Click cells on the right (opponent) grid to fire. Turns alternate with AI.
6. **Win/Lose** - End screens with PLAY AGAIN button.

## Ship Placement Tips
- Default orientation is horizontal. Press R or click ROTATE to toggle.
- Ships are placed at the clicked cell extending right (horizontal) or down (vertical).
- Clicking 5 different rows at column A/B area in horizontal mode will place all ships quickly without overlap.
- Grid coordinates start around x=360, y=80 for cell A1. Each cell is ~35px wide and ~37px tall.

## Key UI Elements to Verify
- **Select Commander**: SALES (blue) and PRODUCT (green) vertically stacked labels on left/right sides. No VS text in center. HUMAN PLAYER / AI OPPONENT labels beneath tile panels.
- **Roulette**: Product characters cycle with yellow highlight glow, slowing down before landing on final selection.
- **READY FOR BATTLE popup**: Gold pulsing text with dark overlay. YES (gold border) and NO (purple-grey border) buttons.
- **Gameplay**: Turn indicator at top ("YOUR TURN - FIRE!" / "OPPONENT FIRING..."). Active board scales larger. Player cards magnify on active turn.
- **X button**: Muted purple-grey in top-right on all screens except Home and Matchup Preview. Opens "Abandon Game?" confirmation.

## Common Testing Patterns
- **Full flow test**: Navigate Home -> Select -> Matchup -> Place Fleet -> READY FOR BATTLE -> Gameplay -> Win/Lose
- **Deselect test**: On Select Commander, click X on zoomed Sales card to deselect (also clears Product). Click X on Product card to re-run roulette.
- **Popup dismiss test**: On Place Fleet, click START then NO to dismiss popup, then START again then YES to proceed.
- **Abandon game test**: Click X button in top-right, confirm "Abandon Game?" modal appears with Yes/No.

## Build & Deploy
```bash
npm run build  # TypeScript check + production build
# Deploy dist/ folder as static frontend
```

## No Secrets Needed
This is a fully client-side game with no backend, authentication, or API keys required.
