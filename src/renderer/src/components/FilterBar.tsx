// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useState, useRef, useEffect } from 'react'
import { useGameStore, type TriFilter } from '../stores/gameStore'
import '../styles/components/FilterBar.css'

function CheckboxDropdown({
  items,
  counts,
  filterValue,
  setFilter,
  allLabel
}: {
  items: string[]
  counts?: Map<string, number>
  filterValue: string
  setFilter: (v: string) => void
  allLabel: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = filterValue ? filterValue.split('||').filter(Boolean) : []

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (item: string): void => {
    let next: string[]
    if (selected.includes(item)) {
      next = selected.filter((s) => s !== item)
    } else {
      next = [...selected, item]
    }
    setFilter(next.join('||'))
  }

  const clearAll = (): void => {
    setFilter('')
    setOpen(false)
  }

  const label =
    selected.length === 0
      ? allLabel
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-dropdown-btn ${selected.length > 0 ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        {label} <span className="filter-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="filter-dropdown-menu">
          {selected.length > 0 && (
            <button className="filter-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
          {items.map((item) => (
            <label key={item} className="filter-dropdown-option">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => toggle(item)}
              />
              <span className="filter-option-label">{item}</span>
              {counts && (
                <span className="filter-option-count">{counts.get(item) || 0}</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function FilterBar(): React.JSX.Element {
  const searchText = useGameStore((s) => s.searchText)
  const setSearchText = useGameStore((s) => s.setSearchText)
  const systems = useGameStore((s) => s.systems)
  const systemCounts = useGameStore((s) => s.systemCounts)
  const systemFilter = useGameStore((s) => s.systemFilter)
  const setSystemFilter = useGameStore((s) => s.setSystemFilter)
  const genres = useGameStore((s) => s.genres)
  const genreCounts = useGameStore((s) => s.genreCounts)
  const genreFilter = useGameStore((s) => s.genreFilter)
  const setGenreFilter = useGameStore((s) => s.setGenreFilter)
  const kidgameFilter = useGameStore((s) => s.kidgameFilter)
  const setKidgameFilter = useGameStore((s) => s.setKidgameFilter)
  const favoriteFilter = useGameStore((s) => s.favoriteFilter)
  const setFavoriteFilter = useGameStore((s) => s.setFavoriteFilter)
  const hiddenFilter = useGameStore((s) => s.hiddenFilter)
  const setHiddenFilter = useGameStore((s) => s.setHiddenFilter)

  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-search"
        placeholder="Search games..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <CheckboxDropdown
        items={systems}
        counts={systemCounts}
        filterValue={systemFilter}
        setFilter={setSystemFilter}
        allLabel="All Systems"
      />

      <CheckboxDropdown
        items={genres}
        counts={genreCounts}
        filterValue={genreFilter}
        setFilter={setGenreFilter}
        allLabel="All Genres"
      />

      <select
        className="filter-select filter-select-narrow"
        value={kidgameFilter}
        onChange={(e) => setKidgameFilter(e.target.value as TriFilter)}
      >
        <option value="all">Kid: All</option>
        <option value="yes">Kid: Yes</option>
        <option value="no">Kid: No</option>
      </select>

      <select
        className="filter-select filter-select-narrow"
        value={favoriteFilter}
        onChange={(e) => setFavoriteFilter(e.target.value as TriFilter)}
      >
        <option value="all">Fav: All</option>
        <option value="yes">Fav: Yes</option>
        <option value="no">Fav: No</option>
      </select>

      <select
        className="filter-select filter-select-narrow"
        value={hiddenFilter}
        onChange={(e) => setHiddenFilter(e.target.value as TriFilter)}
      >
        <option value="all">Hidden: All</option>
        <option value="yes">Hidden: Yes</option>
        <option value="no">Hidden: No</option>
      </select>
    </div>
  )
}
