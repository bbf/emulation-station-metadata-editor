// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import '../styles/components/PathSelector.css'

const LAST_PATH_KEY = 'es-metadata-editor-last-path'

export default function PathSelector(): React.JSX.Element {
  const [inputPath, setInputPath] = useState(() => localStorage.getItem(LAST_PATH_KEY) || '')
  const setRomsPath = useGameStore((s) => s.setRomsPath)
  const loadGames = useGameStore((s) => s.loadGames)
  const loading = useGameStore((s) => s.loading)
  const error = useGameStore((s) => s.error)

  const handleBrowse = async (): Promise<void> => {
    const selected = await window.api.selectFolder()
    if (selected) {
      setInputPath(selected)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    const trimmed = inputPath.trim()
    if (!trimmed) return
    localStorage.setItem(LAST_PATH_KEY, trimmed)
    setRomsPath(trimmed)
    await loadGames()
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="path-selector">
      <div className="path-selector-card">
        <h1>ES Metadata Editor</h1>
        <p className="subtitle">Enter the path to your ROMs folder</p>

        <div className="path-input-row">
          <input
            type="text"
            className="path-input"
            placeholder="e.g. \\rcade\share\roms or C:\roms"
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button className="btn btn-secondary" onClick={handleBrowse} disabled={loading}>
            Browse...
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !inputPath.trim()}
        >
          {loading ? 'Loading...' : 'Load Gamelists'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  )
}
