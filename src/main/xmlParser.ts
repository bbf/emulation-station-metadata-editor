// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import { XMLParser, XMLBuilder } from 'fast-xml-parser'

const parserOptions = {
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  trimValues: true
}

const builderOptions = {
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '\t',
  suppressEmptyNode: true
}

const parser = new XMLParser(parserOptions)
const builder = new XMLBuilder(builderOptions)

export interface ParsedGamelist {
  raw: unknown[]
  games: ParsedGame[]
}

export interface ParsedGame {
  path: string
  emulator?: string
  fields: Record<string, string>
}

const BOOLEAN_FIELDS = new Set(['favorite', 'hidden', 'kidgame'])
const TEXT_FIELDS = [
  'name',
  'desc',
  'image',
  'thumbnail',
  'rating',
  'releasedate',
  'developer',
  'publisher',
  'genre',
  'players',
  'favorite',
  'hidden',
  'kidgame',
  'playcount',
  'lastplayed'
]

function getTextContent(elements: unknown[]): string {
  for (const el of elements) {
    const item = el as Record<string, unknown>
    if ('#text' in item) return String(item['#text'])
  }
  return ''
}

export function parseGamelistXml(xmlContent: string): ParsedGamelist {
  const parsed = parser.parse(xmlContent) as unknown[]
  const games: ParsedGame[] = []

  for (const topNode of parsed) {
    const node = topNode as Record<string, unknown>
    if (!('gameList' in node)) continue

    const gameListChildren = node['gameList'] as unknown[]
    for (const child of gameListChildren) {
      const childNode = child as Record<string, unknown>
      if (!('game' in childNode)) continue

      const attrs = (childNode[':@'] as Record<string, string>) || {}
      const gamePath = attrs['@_path'] || ''
      const emulator = attrs['@_emulator']

      const fields: Record<string, string> = {}
      const gameChildren = childNode['game'] as unknown[]
      if (gameChildren) {
        for (const fieldNode of gameChildren) {
          const fNode = fieldNode as Record<string, unknown>
          for (const fieldName of TEXT_FIELDS) {
            if (fieldName in fNode) {
              const fieldChildren = fNode[fieldName] as unknown[]
              fields[fieldName] = getTextContent(fieldChildren)
            }
          }
        }
      }

      games.push({ path: gamePath, emulator, fields })
    }
  }

  return { raw: parsed, games }
}

export function applyChangesToXml(
  xmlContent: string,
  changes: Map<string, Record<string, unknown>>
): string {
  const parsed = parser.parse(xmlContent) as unknown[]

  for (const topNode of parsed) {
    const node = topNode as Record<string, unknown>
    if (!('gameList' in node)) continue

    const gameListChildren = node['gameList'] as unknown[]
    for (const child of gameListChildren) {
      const childNode = child as Record<string, unknown>
      if (!('game' in childNode)) continue

      const attrs = (childNode[':@'] as Record<string, string>) || {}
      const gamePath = attrs['@_path'] || ''

      const gameChanges = changes.get(gamePath)
      if (!gameChanges) continue

      const gameChildren = (childNode['game'] as unknown[]) || []

      for (const [fieldName, value] of Object.entries(gameChanges)) {
        if (fieldName === 'path' || fieldName === 'emulator' || fieldName === 'id' || fieldName === 'system' || fieldName === 'gamelistPath') continue

        if (fieldName === 'emulator') {
          if (!childNode[':@']) childNode[':@'] = {} as Record<string, string>
          ;(childNode[':@'] as Record<string, string>)['@_emulator'] = String(value)
          continue
        }

        const existingIdx = gameChildren.findIndex((fc) => {
          const fcNode = fc as Record<string, unknown>
          return fieldName in fcNode
        })

        if (BOOLEAN_FIELDS.has(fieldName)) {
          if (value === true || value === 'true') {
            const newNode = { [fieldName]: [{ '#text': 'true' }] }
            if (existingIdx >= 0) {
              gameChildren[existingIdx] = newNode
            } else {
              gameChildren.push(newNode)
            }
          } else {
            if (existingIdx >= 0) {
              gameChildren.splice(existingIdx, 1)
            }
          }
        } else {
          const strValue = String(value ?? '')
          if (strValue === '' && existingIdx >= 0) {
            gameChildren.splice(existingIdx, 1)
          } else if (strValue !== '') {
            const newNode = { [fieldName]: [{ '#text': strValue }] }
            if (existingIdx >= 0) {
              gameChildren[existingIdx] = newNode
            } else {
              gameChildren.push(newNode)
            }
          }
        }
      }
    }
  }

  let xml = builder.build(parsed) as string
  if (!xml.startsWith('<?xml')) {
    xml = '<?xml version="1.0"?>\n' + xml
  }
  return xml
}
