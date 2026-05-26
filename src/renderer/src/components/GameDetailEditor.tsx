// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import type { Game } from '../types'
import '../styles/components/GameDetailEditor.css'

interface Props {
  gameId: string
  onClose: () => void
}

export default function GameDetailEditor({ gameId, onClose }: Props): React.JSX.Element | null {
  const { games, updateGame } = useGameStore()
  const game = games.find((g) => g.id === gameId)
  const [form, setForm] = useState<Partial<Game>>({})

  useEffect(() => {
    if (game) {
      setForm({
        name: game.name || '',
        desc: game.desc || '',
        developer: game.developer || '',
        publisher: game.publisher || '',
        genre: game.genre || '',
        players: game.players || '',
        rating: game.rating || '',
        releasedate: game.releasedate || '',
        favorite: game.favorite || false,
        hidden: game.hidden || false,
        kidgame: game.kidgame || false
      })
    }
  }, [game])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!game) return null

  const handleTextChange = (field: string, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBoolChange = (field: string, value: boolean): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleApply = (): void => {
    updateGame(gameId, form)
    onClose()
  }

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-panel" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h2>Edit Game</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="editor-readonly">
          <div className="editor-field">
            <label>Path</label>
            <span>{game.path}</span>
          </div>
          {game.emulator && (
            <div className="editor-field">
              <label>Emulator</label>
              <span>{game.emulator}</span>
            </div>
          )}
          <div className="editor-field">
            <label>System</label>
            <span>{game.system}</span>
          </div>
          {game.playcount !== undefined && (
            <div className="editor-field">
              <label>Play Count</label>
              <span>{game.playcount}</span>
            </div>
          )}
          {game.lastplayed && (
            <div className="editor-field">
              <label>Last Played</label>
              <span>{game.lastplayed}</span>
            </div>
          )}
        </div>

        <div className="editor-editable">
          <div className="editor-field">
            <label>Name</label>
            <input
              type="text"
              value={(form.name as string) || ''}
              onChange={(e) => handleTextChange('name', e.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Description</label>
            <textarea
              value={(form.desc as string) || ''}
              onChange={(e) => handleTextChange('desc', e.target.value)}
              rows={3}
            />
          </div>
          <div className="editor-field">
            <label>Genre</label>
            <input
              type="text"
              value={(form.genre as string) || ''}
              onChange={(e) => handleTextChange('genre', e.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Developer</label>
            <input
              type="text"
              value={(form.developer as string) || ''}
              onChange={(e) => handleTextChange('developer', e.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Publisher</label>
            <input
              type="text"
              value={(form.publisher as string) || ''}
              onChange={(e) => handleTextChange('publisher', e.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Players</label>
            <input
              type="text"
              value={(form.players as string) || ''}
              onChange={(e) => handleTextChange('players', e.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Rating (0-1)</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={(form.rating as string) || ''}
              onChange={(e) => handleTextChange('rating', e.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Release Date</label>
            <input
              type="text"
              placeholder="YYYYMMDDTHHMMSS"
              value={(form.releasedate as string) || ''}
              onChange={(e) => handleTextChange('releasedate', e.target.value)}
            />
          </div>

          <div className="editor-checkboxes">
            <label className="editor-checkbox">
              <input
                type="checkbox"
                checked={!!form.kidgame}
                onChange={(e) => handleBoolChange('kidgame', e.target.checked)}
              />
              Kidgame
            </label>
            <label className="editor-checkbox">
              <input
                type="checkbox"
                checked={!!form.favorite}
                onChange={(e) => handleBoolChange('favorite', e.target.checked)}
              />
              Favorite
            </label>
            <label className="editor-checkbox">
              <input
                type="checkbox"
                checked={!!form.hidden}
                onChange={(e) => handleBoolChange('hidden', e.target.checked)}
              />
              Hidden
            </label>
          </div>
        </div>

        <div className="editor-actions">
          <button className="btn btn-primary" onClick={handleApply}>
            Apply Changes
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
