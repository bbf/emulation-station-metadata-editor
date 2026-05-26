// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import '../styles/components/GenreDropdown.css'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function GenreDropdown({ value, onChange }: Props): React.JSX.Element {
  const genres = useGameStore((s) => s.genres)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
    if (!open) setSearch('')
  }, [open])

  const toggle = (genre: string): void => {
    let next: string[]
    if (selected.includes(genre)) {
      next = selected.filter((g) => g !== genre)
    } else {
      next = [...selected, genre]
    }
    onChange(next.join(', '))
  }

  const filtered = search
    ? genres.filter((g) => g.toLowerCase().includes(search.toLowerCase()))
    : genres

  return (
    <div className="genre-dropdown" ref={ref}>
      <div className="genre-display" onClick={() => setOpen(!open)}>
        <span className="genre-display-text">{value || 'Select genre...'}</span>
        <span className="genre-arrow">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="genre-menu">
          <input
            ref={searchRef}
            type="text"
            className="genre-search"
            placeholder="Search genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="genre-list">
            {filtered.map((g) => (
              <div
                key={g}
                className="genre-option"
                onClick={() => toggle(g)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(g)}
                  onChange={() => toggle(g)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>{g}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="genre-empty">No genres match</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
