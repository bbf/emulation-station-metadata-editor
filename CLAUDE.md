# ES Metadata Editor

## What is this?

An Electron + React + TypeScript desktop app for editing EmulationStation `gamelist.xml` files. Bulk-toggle `<kidgame>`, `<favorite>`, and `<hidden>` flags across all games from all systems in a single unified list. Full metadata editing via side panel.

## Architecture

- **Main process** (`src/main/`): File I/O, XML parsing, image resolution, IPC handlers, progress reporting
- **Preload** (`src/preload/`): Context bridge exposing typed API to renderer
- **Renderer** (`src/renderer/`): React app with TanStack Table + Virtual, Zustand state, image cache with priority queue

## Key conventions

- XML parsing uses `fast-xml-parser` with `preserveOrder: true`
- All file I/O is async (network share performance)
- Image paths resolved during `loadAllGames` with 30-concurrent workers — renderer only does lazy data URL loading via concurrency-limited cache (5 concurrent)
- Visible images are prioritized in the load queue when scrolling
- Save creates `.bak` backups and uses atomic writes (`.tmp` → rename)
- Theme follows OS `prefers-color-scheme`
- All Zustand selectors use individual field selectors — never `useGameStore()` without a selector
- Column visibility persisted to `localStorage`, last path remembered
- Genres and genre counts recompute dynamically when games are edited

## Commands

```bash
npm run dev          # Start in development mode (hot reload)
npm run build        # Typecheck and build for production
npm run build:exe    # Build standalone Windows executable (dist/win-unpacked/)
npm run build:win    # Build Windows installer (NSIS)
npm run test:e2e     # Run all Playwright E2E tests
npm run typecheck    # TypeScript type checking only
```

## Test data

`test-data/` contains 25 games across 3 systems (mame/snes/atari2600) with placeholder images for offline E2E testing. Tests in `e2e/local.spec.ts` use this data. `e2e/app.spec.ts` tests against the live `\\rcade\share\roms` network share.

## License

Copyright (c) 2026 Bruno Figueiredo. Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — see [LICENSE.md](LICENSE.md).
