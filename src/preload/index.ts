// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { contextBridge, ipcRenderer } from 'electron'

const api = {
  scanGamelists: (romsPath: string) => ipcRenderer.invoke('scan-gamelists', romsPath),
  loadAllGames: (romsPath: string) => ipcRenderer.invoke('load-all-games', romsPath),
  saveModifiedGamelists: (changes: unknown[]) =>
    ipcRenderer.invoke('save-modified-gamelists', changes),
  resolveImagePath: (imagePath: string, gamelistDir: string, romsPath: string) =>
    ipcRenderer.invoke('resolve-image-path', imagePath, gamelistDir, romsPath),
  getImageAsDataUrl: (absolutePath: string) =>
    ipcRenderer.invoke('get-image-data-url', absolutePath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  onLoadProgress: (cb: (data: { phase: string; current: number; total: number }) => void) => {
    const handler = (_event: unknown, data: { phase: string; current: number; total: number }) =>
      cb(data)
    ipcRenderer.on('load-progress', handler)
    return () => {
      ipcRenderer.removeListener('load-progress', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.api = api
}
