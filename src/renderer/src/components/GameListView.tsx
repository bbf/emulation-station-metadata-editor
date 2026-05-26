// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useEffect } from 'react'
import { useGameStore, selectFilteredGames } from '../stores/gameStore'
import FilterBar from './FilterBar'
import ColumnSelector from './ColumnSelector'
import GameTable from './GameTable'
import ImagePreview from './ImagePreview'
import SaveBar from './SaveBar'
import '../styles/components/GameListView.css'

export default function GameListView(): React.JSX.Element {
  const totalGames = useGameStore((s) => s.games.length)
  const filteredCount = useGameStore((s) => selectFilteredGames(s).length)
  const selectedGameId = useGameStore((s) => s.selectedGameId)
  const pendingCount = useGameStore((s) => s.pendingCount)
  const saveChanges = useGameStore((s) => s.saveChanges)

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (pendingCount > 0) {
          saveChanges()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveChanges, pendingCount])

  return (
    <div className="game-list-view">
      <div className="game-list-toolbar">
        <FilterBar />
        <div className="toolbar-right">
          <span className="game-count">
            {filteredCount === totalGames
              ? `${totalGames} games`
              : `${filteredCount} / ${totalGames} games`}
          </span>
          <ColumnSelector />
        </div>
      </div>

      <div className="game-list-content">
        <div className={`game-list-main ${selectedGameId ? 'with-preview' : ''}`}>
          <GameTable />
        </div>
        {selectedGameId && (
          <div className="game-list-sidebar">
            <ImagePreview />
          </div>
        )}
      </div>

      <SaveBar />
    </div>
  )
}
