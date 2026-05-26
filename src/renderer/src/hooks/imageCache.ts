// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

type Listener = () => void

const cache = new Map<string, string>()
const failed = new Set<string>()
const listeners = new Map<string, Set<Listener>>()
const queue: string[] = []
const inFlight = new Set<string>()
const MAX_CONCURRENT = 5

function processQueue(): void {
  while (inFlight.size < MAX_CONCURRENT && queue.length > 0) {
    const absolutePath = queue.shift()!
    if (cache.has(absolutePath) || failed.has(absolutePath) || inFlight.has(absolutePath)) continue
    inFlight.add(absolutePath)
    window.api
      .getImageAsDataUrl(absolutePath)
      .then((dataUrl) => {
        if (dataUrl) {
          cache.set(absolutePath, dataUrl)
        } else {
          failed.add(absolutePath)
        }
      })
      .catch(() => {
        failed.add(absolutePath)
      })
      .finally(() => {
        inFlight.delete(absolutePath)
        const subs = listeners.get(absolutePath)
        if (subs) {
          for (const cb of subs) cb()
        }
        processQueue()
      })
  }
}

export function getCachedImage(absolutePath: string): string | null {
  return cache.get(absolutePath) || null
}

export function requestImage(absolutePath: string): void {
  if (cache.has(absolutePath) || failed.has(absolutePath) || inFlight.has(absolutePath)) return
  if (queue.includes(absolutePath)) return
  queue.push(absolutePath)
  processQueue()
}

export function prioritizeImage(absolutePath: string): void {
  if (cache.has(absolutePath) || failed.has(absolutePath) || inFlight.has(absolutePath)) return
  const idx = queue.indexOf(absolutePath)
  if (idx > 0) {
    queue.splice(idx, 1)
    queue.unshift(absolutePath)
  } else if (idx === -1) {
    queue.unshift(absolutePath)
    processQueue()
  }
}

export function prioritizeBatch(paths: string[]): void {
  const toPromote: string[] = []
  for (const p of paths) {
    if (cache.has(p) || failed.has(p) || inFlight.has(p)) continue
    const idx = queue.indexOf(p)
    if (idx > 0) {
      queue.splice(idx, 1)
      toPromote.push(p)
    } else if (idx === -1) {
      toPromote.push(p)
    }
  }
  if (toPromote.length > 0) {
    queue.unshift(...toPromote)
    processQueue()
  }
}

export function subscribeToImage(absolutePath: string, cb: Listener): () => void {
  if (!listeners.has(absolutePath)) {
    listeners.set(absolutePath, new Set())
  }
  listeners.get(absolutePath)!.add(cb)
  return () => {
    const subs = listeners.get(absolutePath)
    if (subs) {
      subs.delete(cb)
      if (subs.size === 0) listeners.delete(absolutePath)
    }
  }
}
