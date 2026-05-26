// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { useSyncExternalStore } from 'react'
import { getCachedImage, requestImage, subscribeToImage } from './imageCache'

export function useCachedImage(resolvedPath: string | undefined): string | null {
  const path = resolvedPath || ''

  const subscribe = (cb: () => void): (() => void) => {
    if (!path) return () => {}
    return subscribeToImage(path, cb)
  }

  const getSnapshot = (): string | null => {
    if (!path) return null
    return getCachedImage(path)
  }

  const dataUrl = useSyncExternalStore(subscribe, getSnapshot)

  if (path && !dataUrl) {
    requestImage(path)
  }

  return dataUrl
}
