// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState, useEffect } from 'react'
import { useGameStore, formatReleaseDate, toRawReleaseDate } from '../stores/gameStore'
import { useCachedImage } from '../hooks/useImageLoader'
import StarRating from './StarRating'
import GenreDropdown from './GenreDropdown'
import type { Game } from '../types'
import '../styles/components/ImagePreview.css'

export default function ImagePreview(): React.JSX.Element | null {
  const game = useGameStore((s) =>
    s.selectedGameId ? s.games.find((g) => g.id === s.selectedGameId) : null
  )
  const updateGame = useGameStore((s) => s.updateGame)
  const resetGame = useGameStore((s) => s.resetGame)
  const hasPendingChange = useGameStore(
    (s) => (s.selectedGameId ? s.pendingChanges.has(s.selectedGameId) : false)
  )
  const dataUrl = useCachedImage(game?.resolvedImagePath)

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
        releasedate: formatReleaseDate(game.releasedate),
        favorite: game.favorite || false,
        hidden: game.hidden || false,
        kidgame: game.kidgame || false
      })
    }
  }, [game])

  if (!game) return null

  const handleTextChange = (field: string, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'releasedate') {
      updateGame(game.id, { [field]: toRawReleaseDate(value) })
    } else {
      updateGame(game.id, { [field]: value })
    }
  }

  const handleBoolChange = (field: string, value: boolean): void => {
    setForm((prev) => ({ ...prev, [field]: value }))
    updateGame(game.id, { [field]: value })
  }

  const handleRatingChange = (value: number): void => {
    const str = value.toFixed(1)
    setForm((prev) => ({ ...prev, rating: str }))
    updateGame(game.id, { rating: str })
  }

  const handleReset = (): void => {
    resetGame(game.id)
  }

  return (
    <div className="side-panel">
      <div className="side-panel-top">
        <div className="side-panel-genre">{game.genre || 'No genre'}</div>
        <div className="side-panel-image">
          {dataUrl && <img src={dataUrl} alt={game.name || game.path} />}
          {!dataUrl && <div className="image-placeholder">No image</div>}
        </div>
      </div>

      <div className="side-panel-form">
        <div className="sp-field">
          <label>Name</label>
          <input
            type="text"
            value={(form.name as string) || ''}
            onChange={(e) => handleTextChange('name', e.target.value)}
          />
        </div>

        <div className="sp-row">
          <div className="sp-field sp-half">
            <label>Developer</label>
            <input
              type="text"
              value={(form.developer as string) || ''}
              onChange={(e) => handleTextChange('developer', e.target.value)}
            />
          </div>
          <div className="sp-field sp-half">
            <label>Publisher</label>
            <input
              type="text"
              value={(form.publisher as string) || ''}
              onChange={(e) => handleTextChange('publisher', e.target.value)}
            />
          </div>
        </div>

        <div className="sp-row">
          <div className="sp-field sp-half">
            <label>Genre</label>
            <GenreDropdown
              value={(form.genre as string) || ''}
              onChange={(v) => handleTextChange('genre', v)}
            />
          </div>
          <div className="sp-field sp-half">
            <label>Players</label>
            <input
              type="text"
              value={(form.players as string) || ''}
              onChange={(e) => handleTextChange('players', e.target.value)}
            />
          </div>
        </div>

        <div className="sp-row">
          <div className="sp-field sp-half">
            <label>Rating</label>
            <StarRating
              value={parseFloat((form.rating as string) || '0') || 0}
              onChange={handleRatingChange}
            />
          </div>
          <div className="sp-field sp-half">
            <label>Release Date</label>
            <input
              type="date"
              value={(form.releasedate as string) || ''}
              onChange={(e) => handleTextChange('releasedate', e.target.value)}
            />
          </div>
        </div>

        <div className="sp-checkboxes">
          <label className="sp-checkbox">
            <input
              type="checkbox"
              checked={!!form.kidgame}
              onChange={(e) => handleBoolChange('kidgame', e.target.checked)}
            />
            Kidgame
          </label>
          <label className="sp-checkbox">
            <input
              type="checkbox"
              checked={!!form.favorite}
              onChange={(e) => handleBoolChange('favorite', e.target.checked)}
            />
            Favorite
          </label>
          <label className="sp-checkbox">
            <input
              type="checkbox"
              checked={!!form.hidden}
              onChange={(e) => handleBoolChange('hidden', e.target.checked)}
            />
            Hidden
          </label>
        </div>

        <div className="sp-field sp-field-desc">
          <label>Description</label>
          <textarea
            className="sp-desc"
            value={(form.desc as string) || ''}
            onChange={(e) => handleTextChange('desc', e.target.value)}
          />
        </div>

        <div className="sp-readonly">
          <span>System: {game.system}</span>
          <span>Path: {game.path}</span>
          {game.emulator && <span>Emulator: {game.emulator}</span>}
          {game.playcount !== undefined && <span>Play count: {game.playcount}</span>}
          {game.lastplayed && <span>Last played: {formatReleaseDate(game.lastplayed)}</span>}
        </div>

        {hasPendingChange && (
          <button className="btn btn-secondary btn-small sp-reset-btn" onClick={handleReset}>
            Reset to original
          </button>
        )}
      </div>
    </div>
  )
}
