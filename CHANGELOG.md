# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-05-25

### Added
- Initial release
- Unified game list from all EmulationStation systems in a single virtual-scrolled table
- Bulk toggle for `kidgame`, `favorite`, and `hidden` flags
- Full metadata editing side panel (name, description, genre, rating, dates, paths)
- Star rating editor with click and drag support (0.0–1.0)
- Multi-select genre picker with all genres from your collection
- 128px thumbnails in every row, full image in the side panel
- Network share (UNC/CIFS) and local path support
- Smart image resolution for relative paths, `(usb0)/` subdirectories, and `/rcade/` absolute paths
- Atomic saves with `.bak` backups before first write per file
- Rich filtering: system, genre, tri-state Kid/Fav/Hidden, free-text search
- Column visibility persisted across sessions
- OS light/dark theme support
- `Ctrl+S` keyboard shortcut to save
