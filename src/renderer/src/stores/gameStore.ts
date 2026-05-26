// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { create } from 'zustand'
import type { Game, GameChange, SaveResult } from '../types'

export type TriFilter = 'all' | 'yes' | 'no'

export function formatReleaseDate(raw: string | undefined): string {
  if (!raw) return ''
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return raw
  return `${m[1]}-${m[2]}-${m[3]}`
}

export function toRawReleaseDate(display: string): string {
  const m = display.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return display
  return `${m[1]}${m[2]}${m[3]}T000000`
}

const ALL_COLUMN_IDS = [
  'system',
  'thumbnail',
  'name',
  'genre',
  'rating',
  'players',
  'kidgame',
  'favorite',
  'hidden',
  'developer',
  'publisher',
  'releasedate',
  'playcount',
  'lastplayed'
]

const COLUMNS_STORAGE_KEY = 'es-metadata-editor-columns'

function loadSavedColumns(): string[] {
  try {
    const raw = localStorage.getItem(COLUMNS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return [...ALL_COLUMN_IDS]
}

function saveColumns(cols: string[]): void {
  localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(cols))
}

interface GameStore {
  romsPath: string
  games: Game[]
  originalGames: Map<string, Game>
  systems: string[]
  systemCounts: Map<string, number>
  genres: string[]
  genreCounts: Map<string, number>
  loading: boolean
  error: string | null

  searchText: string
  systemFilter: string
  genreFilter: string
  kidgameFilter: TriFilter
  favoriteFilter: TriFilter
  hiddenFilter: TriFilter
  selectedGameId: string | null

  pendingChanges: Map<string, GameChange>
  pendingCount: number

  visibleColumns: string[]

  setRomsPath: (path: string) => void
  loadGames: () => Promise<void>
  setSearchText: (text: string) => void
  setSystemFilter: (system: string) => void
  setGenreFilter: (genre: string) => void
  setKidgameFilter: (filter: TriFilter) => void
  setFavoriteFilter: (filter: TriFilter) => void
  setHiddenFilter: (filter: TriFilter) => void
  setSelectedGameId: (id: string | null) => void
  toggleColumn: (col: string) => void

  updateGame: (gameId: string, changes: Partial<Game>) => void
  resetGame: (gameId: string) => void
  saveChanges: () => Promise<SaveResult>
  discardChanges: () => void
}

function computeGenres(games: Game[]): { genres: string[]; genreCounts: Map<string, number> } {
  const counts = new Map<string, number>()
  for (const g of games) {
    if (g.genre) counts.set(g.genre, (counts.get(g.genre) || 0) + 1)
  }
  return { genres: [...counts.keys()].sort(), genreCounts: counts }
}

export const useGameStore = create<GameStore>((set, get) => ({
  romsPath: '',
  games: [],
  originalGames: new Map(),
  systems: [],
  systemCounts: new Map(),
  genres: [],
  genreCounts: new Map(),
  loading: false,
  error: null,
  searchText: '',
  systemFilter: '',
  genreFilter: '',
  kidgameFilter: 'all',
  favoriteFilter: 'all',
  hiddenFilter: 'all',
  selectedGameId: null,
  pendingChanges: new Map(),
  pendingCount: 0,
  visibleColumns: loadSavedColumns(),

  setRomsPath: (path) => set({ romsPath: path }),

  loadGames: async () => {
    const { romsPath } = get()
    if (!romsPath) return
    set({ loading: true, error: null })
    try {
      const result = await window.api.loadAllGames(romsPath)
      const systemGameCount = new Map<string, number>()
      const originals = new Map<string, Game>()
      for (const g of result.games) {
        systemGameCount.set(g.system, (systemGameCount.get(g.system) || 0) + 1)
        originals.set(g.id, { ...g })
      }
      const systems = result.systems.filter((s) => (systemGameCount.get(s) || 0) > 0)
      const { genres, genreCounts } = computeGenres(result.games)
      set({
        games: result.games,
        originalGames: originals,
        systems,
        systemCounts: systemGameCount,
        genres,
        genreCounts,
        loading: false
      })
    } catch (err) {
      set({ error: String(err), loading: false })
    }
  },

  setSearchText: (text) => set({ searchText: text }),
  setSystemFilter: (system) => set({ systemFilter: system }),
  setGenreFilter: (genre) => set({ genreFilter: genre }),
  setKidgameFilter: (filter) => set({ kidgameFilter: filter }),
  setFavoriteFilter: (filter) => set({ favoriteFilter: filter }),
  setHiddenFilter: (filter) => set({ hiddenFilter: filter }),
  setSelectedGameId: (id) => set({ selectedGameId: id }),

  toggleColumn: (col) => {
    const cols = get().visibleColumns
    let next: string[]
    if (cols.includes(col)) {
      next = cols.filter((c) => c !== col)
    } else {
      next = [...cols, col]
    }
    saveColumns(next)
    set({ visibleColumns: next })
  },

  updateGame: (gameId, changes) => {
    const { games, pendingChanges } = get()
    const gameIdx = games.findIndex((g) => g.id === gameId)
    if (gameIdx < 0) return

    const game = games[gameIdx]
    const updatedGame = { ...game, ...changes }
    const newGames = [...games]
    newGames[gameIdx] = updatedGame

    const newChanges = new Map(pendingChanges)
    const existing = newChanges.get(gameId)
    if (existing) {
      newChanges.set(gameId, {
        ...existing,
        changes: { ...existing.changes, ...changes }
      })
    } else {
      newChanges.set(gameId, {
        gameId,
        gamelistPath: game.gamelistPath,
        gamePath: game.path,
        changes
      })
    }

    const extra: Partial<GameStore> = {}
    if ('genre' in changes) {
      const computed = computeGenres(newGames)
      extra.genres = computed.genres
      extra.genreCounts = computed.genreCounts
    }
    set({ games: newGames, pendingChanges: newChanges, pendingCount: newChanges.size, ...extra })
  },

  resetGame: (gameId) => {
    const { games, originalGames, pendingChanges } = get()
    const original = originalGames.get(gameId)
    if (!original) return
    const gameIdx = games.findIndex((g) => g.id === gameId)
    if (gameIdx < 0) return

    const newGames = [...games]
    newGames[gameIdx] = { ...original }
    const newChanges = new Map(pendingChanges)
    newChanges.delete(gameId)
    const { genres: g, genreCounts: gc } = computeGenres(newGames)
    set({ games: newGames, pendingChanges: newChanges, pendingCount: newChanges.size, genres: g, genreCounts: gc })
  },

  saveChanges: async () => {
    const { pendingChanges } = get()
    const changes = [...pendingChanges.values()]
    const result = await window.api.saveModifiedGamelists(changes)
    if (result.success) {
      const { games } = get()
      const originals = new Map<string, Game>()
      for (const g of games) originals.set(g.id, { ...g })
      set({ pendingChanges: new Map(), pendingCount: 0, originalGames: originals })
    }
    return result
  },

  discardChanges: () => {
    const { originalGames } = get()
    const restored = [...originalGames.values()].map((g) => ({ ...g }))
    const { genres: g, genreCounts: gc } = computeGenres(restored)
    set({ games: restored, pendingChanges: new Map(), pendingCount: 0, genres: g, genreCounts: gc })
  }
}))

let cachedFilterGamesRef: Game[] = []
let cachedFilterKey = ''
let cachedFilterResult: Game[] = []

export function selectFilteredGames(state: GameStore): Game[] {
  const key = `${state.searchText}|${state.systemFilter}|${state.genreFilter}|${state.kidgameFilter}|${state.favoriteFilter}|${state.hiddenFilter}`
  if (key === cachedFilterKey && state.games === cachedFilterGamesRef) {
    return cachedFilterResult
  }

  const { games, searchText, systemFilter, genreFilter, kidgameFilter, favoriteFilter, hiddenFilter } = state
  const lowerSearch = searchText.toLowerCase()

  const result = games.filter((g) => {
    if (systemFilter) {
      const selectedSystems = systemFilter.split('||')
      if (!selectedSystems.includes(g.system)) return false
    }
    if (genreFilter) {
      const selectedGenres = genreFilter.split('||')
      if (!g.genre || !selectedGenres.includes(g.genre)) return false
    }
    if (kidgameFilter === 'yes' && !g.kidgame) return false
    if (kidgameFilter === 'no' && g.kidgame) return false
    if (favoriteFilter === 'yes' && !g.favorite) return false
    if (favoriteFilter === 'no' && g.favorite) return false
    if (hiddenFilter === 'yes' && !g.hidden) return false
    if (hiddenFilter === 'no' && g.hidden) return false
    if (lowerSearch) {
      const name = (g.name || g.path).toLowerCase()
      const desc = (g.desc || '').toLowerCase()
      const genre = (g.genre || '').toLowerCase()
      if (!name.includes(lowerSearch) && !desc.includes(lowerSearch) && !genre.includes(lowerSearch)) {
        return false
      }
    }
    return true
  })

  cachedFilterGamesRef = state.games
  cachedFilterKey = key
  cachedFilterResult = result
  return result
}
