// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import '../styles/components/ColumnSelector.css'

const ALL_COLUMNS = [
  { id: 'system', label: 'System' },
  { id: 'thumbnail', label: 'Thumbnail' },
  { id: 'name', label: 'Name' },
  { id: 'genre', label: 'Genre' },
  { id: 'rating', label: 'Rating' },
  { id: 'players', label: 'Players' },
  { id: 'kidgame', label: 'Kidgame' },
  { id: 'favorite', label: 'Favorite' },
  { id: 'hidden', label: 'Hidden' },
  { id: 'developer', label: 'Developer' },
  { id: 'publisher', label: 'Publisher' },
  { id: 'releasedate', label: 'Release Date' },
  { id: 'playcount', label: 'Play Count' },
  { id: 'lastplayed', label: 'Last Played' }
]

export default function ColumnSelector(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const visibleColumns = useGameStore((s) => s.visibleColumns)
  const toggleColumn = useGameStore((s) => s.toggleColumn)

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="column-selector" ref={ref}>
      <button className="btn btn-secondary btn-small" onClick={() => setOpen(!open)}>
        Columns
      </button>
      {open && (
        <div className="column-dropdown">
          {ALL_COLUMNS.map((col) => (
            <label key={col.id} className="column-option">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.id)}
                onChange={() => toggleColumn(col.id)}
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
