// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useMemo, useRef, useCallback, memo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useState } from 'react'
import { useGameStore, selectFilteredGames, formatReleaseDate } from '../stores/gameStore'
import { useCachedImage } from '../hooks/useImageLoader'
import { prioritizeBatch } from '../hooks/imageCache'
import type { Game } from '../types'
import '../styles/components/GameTable.css'

const ThumbnailCell = memo(
  function ThumbnailCell({ resolvedPath }: { resolvedPath: string | undefined }) {
    const dataUrl = useCachedImage(resolvedPath)
    if (dataUrl) {
      return <img className="table-thumbnail" src={dataUrl} alt="" />
    }
    return <div className="table-thumbnail-empty" />
  },
  (prev, next) => prev.resolvedPath === next.resolvedPath
)

const ToggleCell = memo(function ToggleCell({
  gameId,
  field,
  checked
}: {
  gameId: string
  field: 'kidgame' | 'favorite' | 'hidden'
  checked: boolean
}) {
  const updateGame = useGameStore((s) => s.updateGame)
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        e.stopPropagation()
        updateGame(gameId, { [field]: e.target.checked })
      }}
      onClick={(e) => e.stopPropagation()}
    />
  )
})

function RatingCell({ value }: { value?: string }): React.JSX.Element {
  if (!value) return <span />
  const num = parseFloat(value)
  if (isNaN(num)) return <span>{value}</span>
  const stars = Math.round(num * 5)
  return (
    <span className="rating-stars">
      {'★'.repeat(stars)}
      {'☆'.repeat(5 - stars)}
    </span>
  )
}

const NAME_MIN_SIZE = 200
const ROW_HEIGHT = 140

export default function GameTable(): React.JSX.Element {
  const games = useGameStore(selectFilteredGames)
  const selectedGameId = useGameStore((s) => s.selectedGameId)
  const setSelectedGameId = useGameStore((s) => s.setSelectedGameId)
  const visibleColumns = useGameStore((s) => s.visibleColumns)

  const [sorting, setSorting] = useState<SortingState>([])
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const allColumns: ColumnDef<Game>[] = useMemo(
    () => [
      {
        id: 'system',
        accessorKey: 'system',
        header: 'System',
        size: 100,
        meta: { fixedWidth: true }
      },
      {
        id: 'thumbnail',
        header: 'Thumb',
        size: 140,
        enableSorting: false,
        meta: { fixedWidth: true },
        cell: ({ row }) => <ThumbnailCell resolvedPath={row.original.resolvedThumbnailPath} />
      },
      {
        id: 'name',
        accessorFn: (row) => row.name || row.path,
        header: 'Name',
        size: NAME_MIN_SIZE,
        meta: { flexGrow: true }
      },
      {
        id: 'genre',
        accessorKey: 'genre',
        header: 'Genre',
        size: 150,
        meta: { fixedWidth: true }
      },
      {
        id: 'rating',
        accessorKey: 'rating',
        header: 'Rating',
        size: 100,
        meta: { fixedWidth: true },
        cell: ({ getValue }) => <RatingCell value={getValue() as string | undefined} />
      },
      {
        id: 'players',
        accessorKey: 'players',
        header: 'Players',
        size: 80,
        meta: { fixedWidth: true }
      },
      {
        id: 'kidgame',
        header: 'Kid',
        size: 50,
        accessorKey: 'kidgame',
        meta: { fixedWidth: true },
        cell: ({ row }) => (
          <ToggleCell gameId={row.original.id} field="kidgame" checked={!!row.original.kidgame} />
        )
      },
      {
        id: 'favorite',
        header: 'Fav',
        size: 50,
        accessorKey: 'favorite',
        meta: { fixedWidth: true },
        cell: ({ row }) => (
          <ToggleCell gameId={row.original.id} field="favorite" checked={!!row.original.favorite} />
        )
      },
      {
        id: 'hidden',
        header: 'Hidden',
        size: 60,
        accessorKey: 'hidden',
        meta: { fixedWidth: true },
        cell: ({ row }) => (
          <ToggleCell gameId={row.original.id} field="hidden" checked={!!row.original.hidden} />
        )
      },
      {
        id: 'developer',
        accessorKey: 'developer',
        header: 'Developer',
        size: 150,
        meta: { fixedWidth: true }
      },
      {
        id: 'publisher',
        accessorKey: 'publisher',
        header: 'Publisher',
        size: 150,
        meta: { fixedWidth: true }
      },
      {
        id: 'releasedate',
        header: 'Release Date',
        size: 110,
        meta: { fixedWidth: true },
        accessorFn: (row) => row.releasedate,
        cell: ({ getValue }) => <span>{formatReleaseDate(getValue() as string | undefined)}</span>,
        sortingFn: 'alphanumeric'
      },
      {
        id: 'playcount',
        accessorKey: 'playcount',
        header: 'Plays',
        size: 60,
        meta: { fixedWidth: true }
      },
      {
        id: 'lastplayed',
        header: 'Last Played',
        size: 110,
        meta: { fixedWidth: true },
        accessorFn: (row) => row.lastplayed,
        cell: ({ getValue }) => <span>{formatReleaseDate(getValue() as string | undefined)}</span>,
        sortingFn: 'alphanumeric'
      }
    ],
    []
  )

  const columns = useMemo(
    () => allColumns.filter((c) => visibleColumns.includes(c.id!)),
    [allColumns, visibleColumns]
  )

  const table = useReactTable({
    data: games,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5
  })

  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const visiblePaths: string[] = []
    for (const vi of virtualItems) {
      const game = rows[vi.index]?.original
      if (game?.resolvedThumbnailPath) {
        visiblePaths.push(game.resolvedThumbnailPath)
      }
    }
    if (visiblePaths.length > 0) {
      prioritizeBatch(visiblePaths)
    }
  }, [virtualItems, rows])

  const handleRowClick = useCallback(
    (gameId: string) => {
      setSelectedGameId(selectedGameId === gameId ? null : gameId)
    },
    [selectedGameId, setSelectedGameId]
  )

  const headers = table.getHeaderGroups()

  return (
    <div className="game-table-wrapper">
      <div className="game-table-header">
        {headers.map((headerGroup) => (
          <div key={headerGroup.id} className="header-row">
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as { flexGrow?: boolean } | undefined
              return (
                <div
                  key={header.id}
                  className={`header-cell ${header.column.getCanSort() ? 'sortable' : ''} ${meta?.flexGrow ? 'flex-grow' : ''}`}
                  style={
                    meta?.flexGrow
                      ? { minWidth: header.getSize(), flex: 1 }
                      : { width: header.getSize(), minWidth: header.getSize(), flexShrink: 0 }
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc'
                    ? ' ▲'
                    : header.column.getIsSorted() === 'desc'
                      ? ' ▼'
                      : ''}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="game-table-body" ref={tableContainerRef}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index]
            const isSelected = selectedGameId === row.id
            return (
              <div
                key={row.id}
                className={`game-row ${isSelected ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: ROW_HEIGHT,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                onClick={() => handleRowClick(row.id)}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { flexGrow?: boolean } | undefined
                  return (
                    <div
                      key={cell.id}
                      className={`game-cell ${meta?.flexGrow ? 'flex-grow' : ''}`}
                      style={
                        meta?.flexGrow
                          ? { minWidth: cell.column.getSize(), flex: 1 }
                          : {
                              width: cell.column.getSize(),
                              minWidth: cell.column.getSize(),
                              flexShrink: 0
                            }
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
