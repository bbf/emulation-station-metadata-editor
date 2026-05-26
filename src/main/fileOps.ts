// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { promises as fs } from 'fs'
import * as path from 'path'

export async function scanForGamelists(
  romsPath: string
): Promise<{ system: string; path: string }[]> {
  const results: { system: string; path: string }[] = []

  let entries: string[]
  try {
    entries = await fs.readdir(romsPath)
  } catch {
    return results
  }

  for (const entry of entries) {
    const systemDir = path.join(romsPath, entry)
    try {
      const stat = await fs.stat(systemDir)
      if (!stat.isDirectory()) continue
    } catch {
      continue
    }

    const gamelistPath = path.join(systemDir, 'gamelist.xml')
    try {
      await fs.access(gamelistPath)
      results.push({ system: entry, path: gamelistPath })
    } catch {
      // no gamelist.xml in this system folder
    }
  }

  return results
}

export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8')
}

const backedUpFiles = new Set<string>()

export async function createBackup(filePath: string): Promise<void> {
  if (backedUpFiles.has(filePath)) return
  const backupPath = filePath + '.bak'
  await fs.copyFile(filePath, backupPath)
  backedUpFiles.add(filePath)
}

export async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmpPath = filePath + '.tmp'
  await fs.writeFile(tmpPath, content, 'utf-8')
  await fs.rename(tmpPath, filePath)
}

export function resetBackupTracking(): void {
  backedUpFiles.clear()
}
