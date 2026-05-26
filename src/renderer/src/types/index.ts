// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

export interface Game {
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

export interface GameChange {
  gameId: string
  gamelistPath: string
  gamePath: string
  changes: Partial<Game>
}

export interface SaveResult {
  success: boolean
  savedFiles: string[]
  errors: { file: string; error: string }[]
}

export interface GamelistFile {
  system: string
  path: string
  gameCount: number
}

export interface LoadProgress {
  phase: string
  current: number
  total: number
}

export interface ElectronAPI {
  scanGamelists(romsPath: string): Promise<GamelistFile[]>
  loadAllGames(romsPath: string): Promise<{ games: Game[]; systems: string[] }>
  saveModifiedGamelists(changes: GameChange[]): Promise<SaveResult>
  resolveImagePath(
    imagePath: string,
    gamelistDir: string,
    romsPath: string
  ): Promise<string | null>
  getImageAsDataUrl(absolutePath: string): Promise<string | null>
  selectFolder(): Promise<string | null>
  onLoadProgress(cb: (data: LoadProgress) => void): () => void
}
