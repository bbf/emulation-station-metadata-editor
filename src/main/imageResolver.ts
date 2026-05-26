// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { promises as fs } from 'fs'
import * as path from 'path'

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function resolveImagePath(
  imagePath: string,
  gamelistDir: string,
  romsPath: string
): Promise<string | null> {
  if (!imagePath) return null

  const normalized = imagePath.replace(/\//g, path.sep)

  if (imagePath.startsWith('./')) {
    const relative = imagePath.slice(2)
    const direct = path.join(gamelistDir, relative)
    if (await fileExists(direct)) return direct

    const usb0 = path.join(gamelistDir, '(usb0)', relative)
    if (await fileExists(usb0)) return usb0
  }

  if (imagePath.startsWith('/rcade/')) {
    const shareRoot = path.dirname(romsPath)
    const remainder = imagePath.slice('/rcade/'.length)
    const mapped = path.join(shareRoot, remainder)
    if (await fileExists(mapped)) return mapped
  }

  if (path.isAbsolute(normalized)) {
    if (await fileExists(normalized)) return normalized
  }

  return null
}

export async function readImageAsDataUrl(absolutePath: string): Promise<string | null> {
  try {
    const data = await fs.readFile(absolutePath)
    const ext = path.extname(absolutePath).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp'
    }
    const mime = mimeMap[ext] || 'image/png'
    return `data:${mime};base64,${data.toString('base64')}`
  } catch {
    return null
  }
}
