// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState, useEffect } from 'react'
import { useGameStore } from './stores/gameStore'
import PathSelector from './components/PathSelector'
import GameListView from './components/GameListView'
import type { LoadProgress } from './types'

function App(): React.JSX.Element {
  const hasGames = useGameStore((s) => s.games.length > 0)
  const loading = useGameStore((s) => s.loading)
  const [progress, setProgress] = useState<LoadProgress | null>(null)

  useEffect(() => {
    const unsub = window.api.onLoadProgress((data) => {
      setProgress(data)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!loading) setProgress(null)
  }, [loading])

  if (!hasGames && !loading) {
    return <PathSelector />
  }

  if (loading && !hasGames) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <h2>Loading gamelists...</h2>
          {progress ? (
            <div className="loading-progress">
              <p className="loading-phase">{progress.phase}</p>
              <div className="loading-bar-track">
                <div
                  className="loading-bar-fill"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
              <p className="loading-count">
                {progress.current} / {progress.total}
              </p>
            </div>
          ) : (
            <p>Connecting...</p>
          )}
        </div>
      </div>
    )
  }

  return <GameListView />
}

export default App
