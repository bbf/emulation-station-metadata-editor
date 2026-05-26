// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'path'
import { scanForGamelists, readFileContent, createBackup, atomicWrite } from './fileOps'
import { parseGamelistXml, applyChangesToXml } from './xmlParser'
import { resolveImagePath, readImageAsDataUrl } from './imageResolver'

interface Game {
  id: string
  system: string
  gamelistPath: string
  path: string
  emulator?: string
  name?: string
  desc?: string
  image?: string
  thumbnail?: string
  rating?: string
  releasedate?: string
  developer?: string
  publisher?: string
  genre?: string
  players?: string
  favorite?: boolean
  hidden?: boolean
  kidgame?: boolean
  playcount?: number
  lastplayed?: string
  resolvedThumbnailPath?: string
  resolvedImagePath?: string
}

interface GameChange {
  gameId: string
  gamelistPath: string
  gamePath: string
  changes: Partial<Game>
}

async function resolveWithConcurrency<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  let i = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      await fn(items[idx])
    }
  })
  await Promise.all(workers)
}

function sendProgress(phase: string, current: number, total: number): void {
  const wins = BrowserWindow.getAllWindows()
  if (wins.length > 0) {
    wins[0].webContents.send('load-progress', { phase, current, total })
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('scan-gamelists', async (_event, romsPath: string) => {
    const found = await scanForGamelists(romsPath)
    return found.map((f) => ({ system: f.system, path: f.path, gameCount: 0 }))
  })

  ipcMain.handle('load-all-games', async (_event, romsPath: string) => {
    const gamelists = await scanForGamelists(romsPath)
    const allGames: Game[] = []
    const systems: string[] = []
    const gamelistDirs = new Map<string, string>()

    sendProgress('Scanning gamelists', 0, gamelists.length)

    for (let gi = 0; gi < gamelists.length; gi++) {
      const gl = gamelists[gi]
      systems.push(gl.system)
      const xmlContent = await readFileContent(gl.path)
      const parsed = parseGamelistXml(xmlContent)
      const gamelistDir = path.dirname(gl.path)

      for (const pg of parsed.games) {
        const game: Game = {
          id: `${gl.system}::${pg.path}`,
          system: gl.system,
          gamelistPath: gl.path,
          path: pg.path,
          emulator: pg.emulator,
          name: pg.fields.name || undefined,
          desc: pg.fields.desc || undefined,
          image: pg.fields.image || undefined,
          thumbnail: pg.fields.thumbnail || undefined,
          rating: pg.fields.rating || undefined,
          releasedate: pg.fields.releasedate || undefined,
          developer: pg.fields.developer || undefined,
          publisher: pg.fields.publisher || undefined,
          genre: pg.fields.genre || undefined,
          players: pg.fields.players || undefined
        }

        if (pg.fields.favorite === 'true') game.favorite = true
        if (pg.fields.hidden === 'true') game.hidden = true
        if (pg.fields.kidgame === 'true') game.kidgame = true

        if (pg.fields.playcount) {
          game.playcount = parseInt(pg.fields.playcount, 10) || undefined
        }
        if (pg.fields.lastplayed) {
          game.lastplayed = pg.fields.lastplayed
        }

        allGames.push(game)
        gamelistDirs.set(game.id, gamelistDir)
      }

      sendProgress('Parsing gamelists', gi + 1, gamelists.length)
    }

    let resolved = 0
    sendProgress('Resolving images', 0, allGames.length)

    await resolveWithConcurrency(
      allGames,
      async (game) => {
        const dir = gamelistDirs.get(game.id)!
        const thumbSrc = game.thumbnail || game.image
        if (thumbSrc) {
          game.resolvedThumbnailPath =
            (await resolveImagePath(thumbSrc, dir, romsPath)) || undefined
        }
        if (game.image) {
          game.resolvedImagePath =
            (await resolveImagePath(game.image, dir, romsPath)) || undefined
        }
        resolved++
        if (resolved % 20 === 0 || resolved === allGames.length) {
          sendProgress('Resolving images', resolved, allGames.length)
        }
      },
      30
    )

    systems.sort()
    return { games: allGames, systems }
  })

  ipcMain.handle('save-modified-gamelists', async (_event, changes: GameChange[]) => {
    const byFile = new Map<string, Map<string, Record<string, unknown>>>()

    for (const change of changes) {
      if (!byFile.has(change.gamelistPath)) {
        byFile.set(change.gamelistPath, new Map())
      }
      byFile.get(change.gamelistPath)!.set(change.gamePath, change.changes)
    }

    const savedFiles: string[] = []
    const errors: { file: string; error: string }[] = []

    for (const [filePath, gameChanges] of byFile) {
      try {
        await createBackup(filePath)
        const xmlContent = await readFileContent(filePath)
        const newXml = applyChangesToXml(xmlContent, gameChanges)
        await atomicWrite(filePath, newXml)
        savedFiles.push(filePath)
      } catch (err) {
        errors.push({ file: filePath, error: String(err) })
      }
    }

    return { success: errors.length === 0, savedFiles, errors }
  })

  ipcMain.handle(
    'resolve-image-path',
    async (_event, imagePath: string, gamelistDir: string, romsPath: string) => {
      return resolveImagePath(imagePath, gamelistDir, romsPath)
    }
  )

  ipcMain.handle('get-image-data-url', async (_event, absolutePath: string) => {
    return readImageAsDataUrl(absolutePath)
  })

  ipcMain.handle('select-folder', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select ROMs Folder'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}
