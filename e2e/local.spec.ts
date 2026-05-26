// Copyright (c) 2026 Bruno Figueiredo
// SPDX-License-Identifier: CC-BY-NC-SA-4.0
// https://creativecommons.org/licenses/by-nc-sa/4.0/

import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page
} from '@playwright/test'
import path from 'path'
import fs from 'fs'

const TEST_DATA_PATH = path.join(__dirname, '..', 'test-data')

let app: ElectronApplication
let page: Page

function restoreTestData(): void {
  const systems = ['mame', 'snes', 'atari2600']
  for (const sys of systems) {
    const gl = path.join(TEST_DATA_PATH, sys, 'gamelist.xml')
    const bak = gl + '.bak'
    if (fs.existsSync(bak)) {
      fs.copyFileSync(bak, gl)
      fs.unlinkSync(bak)
    }
  }
}

test.beforeAll(async () => {
  restoreTestData()
  app = await electron.launch({
    args: [path.join(__dirname, '../out/main/index.js')],
    env: { ...process.env, NODE_ENV: 'production' }
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app.close()
  restoreTestData()
})

test.describe.serial('Local Test Data — Startup', () => {
  test('load test data', async () => {
    test.setTimeout(30_000)
    await page.locator('.path-input').fill(TEST_DATA_PATH)
    await page.locator('.btn-primary').click()
    await page.waitForSelector('.game-table-wrapper', { timeout: 20_000 })
    await expect(page.locator('.game-count')).toContainText('games')
  })

  test('loads exactly 25 games', async () => {
    await expect(page.locator('.game-count')).toContainText('25 games')
  })

  test('3 systems loaded', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    expect(await menu.locator('.filter-dropdown-option').count()).toBe(3)

    const labels = await menu.locator('.filter-option-label').allTextContents()
    expect(labels.sort()).toEqual(['atari2600', 'mame', 'snes'])
    await btn.click()
  })
})

test.describe.serial('Local Test Data — System Counts', () => {
  test('mame has 8 games', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    const mameOpt = menu.locator('.filter-dropdown-option', { hasText: 'mame' })
    await expect(mameOpt.locator('.filter-option-count')).toHaveText('8')
    await btn.click()
  })

  test('snes has 10 games', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    const snesOpt = menu.locator('.filter-dropdown-option', { hasText: 'snes' })
    await expect(snesOpt.locator('.filter-option-count')).toHaveText('10')
    await btn.click()
  })

  test('atari2600 has 7 games', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    const atariOpt = menu.locator('.filter-dropdown-option', { hasText: 'atari2600' })
    await expect(atariOpt.locator('.filter-option-count')).toHaveText('7')
    await btn.click()
  })
})

test.describe.serial('Local Test Data — Genre Filter', () => {
  test('genres list only contains used genres', async () => {
    const btn = page.locator('.filter-dropdown-btn').nth(1)
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })

    const labels = await menu.locator('.filter-option-label').allTextContents()
    const expectedGenres = [
      'Action',
      'Action / Labyrinth',
      'Adventure',
      "Beat'em Up",
      'Platform',
      'Puzzle',
      'Racing, Driving',
      'Role Playing Game',
      "Shoot'em Up",
      'Shooter',
      'Simulation'
    ]
    expect(labels.sort()).toEqual(expectedGenres)
    await btn.click()
  })

  test('filter by Platform shows 4 games', async () => {
    const btn = page.locator('.filter-dropdown-btn').nth(1)
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    await menu.locator('.filter-dropdown-option', { hasText: 'Platform' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('4 / 25')
    await menu.locator('.filter-clear').click()
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Boolean Filters', () => {
  test('kidgame yes shows correct count', async () => {
    const sel = page.locator('.filter-select-narrow').first()
    await sel.selectOption('yes')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('12 / 25')
    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })

  test('favorite yes shows correct count', async () => {
    const sel = page.locator('.filter-select-narrow').nth(1)
    await sel.selectOption('yes')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('9 / 25')
    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })

  test('hidden yes shows correct count', async () => {
    const sel = page.locator('.filter-select-narrow').nth(2)
    await sel.selectOption('yes')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('3 / 25')
    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Search', () => {
  test('search "mario" finds 2 games', async () => {
    await page.locator('.filter-search').fill('mario')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('2 / 25')
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })

  test('search "atari" matches developer/publisher in desc', async () => {
    await page.locator('.filter-search').fill('atari')
    await page.waitForTimeout(300)
    const text = await page.locator('.game-count').textContent()
    expect(text).toContain('/')
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Specific Game Fields', () => {
  test('game with emulator attribute loads', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    await menu.locator('.filter-dropdown-option', { hasText: 'mame' }).click()
    await page.waitForTimeout(300)
    await btn.click()

    await page.locator('.game-table-body').evaluate((el) => el.scrollTo(0, 0))
    await page.waitForTimeout(300)

    const cells = await page.locator('.game-cell').allTextContents()
    const hasStreetFighter = cells.some((c) => c.includes('Street Fighter II'))
    expect(hasStreetFighter).toBe(true)

    await page.locator('.filter-dropdown-btn').first().click()
    const menu2 = page.locator('.filter-dropdown-menu').first()
    await menu2.locator('.filter-clear').click()
    await page.waitForTimeout(200)
  })

  test('game with playcount and lastplayed shows in side panel', async () => {
    await page.locator('.filter-search').fill('Chrono Trigger')
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })

    const readonly = await page.locator('.sp-readonly').textContent()
    expect(readonly).toContain('Play count: 3')
    expect(readonly).toContain('Last played:')

    await page.locator('.game-row').first().click()
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })

  test('minimal game (no desc, no image, no genre) loads', async () => {
    const sel = page.locator('.filter-select-narrow').nth(2)
    await sel.selectOption('yes')
    await page.waitForTimeout(300)

    const cells = await page.locator('.game-cell').allTextContents()
    const hasMegaFamily = cells.some((c) => c.includes('Mega Family'))
    expect(hasMegaFamily).toBe(true)

    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })

  test('game with empty genre element loads', async () => {
    await page.locator('.filter-search').fill('Basic Math')
    await page.waitForTimeout(300)
    const count = await page.locator('.game-row').count()
    expect(count).toBe(1)
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Image Resolution', () => {
  test('relative image path resolves', async () => {
    await page.locator('.filter-search').fill('Pac-Man')
    await page.waitForTimeout(300)
    await page.waitForTimeout(2000)
    const thumb = page.locator('.table-thumbnail')
    expect(await thumb.count()).toBeGreaterThan(0)
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })

  test('(usb0) subdirectory image resolves', async () => {
    await page.locator('.filter-search').fill('Donkey Kong Country')
    await page.waitForTimeout(300)
    await page.waitForTimeout(2000)
    const thumb = page.locator('.table-thumbnail')
    expect(await thumb.count()).toBeGreaterThan(0)
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })

  test('nonexistent image shows placeholder', async () => {
    await page.locator('.filter-search').fill('Frogger')
    await page.waitForTimeout(300)
    await page.waitForTimeout(1000)
    const empty = page.locator('.table-thumbnail-empty')
    expect(await empty.count()).toBeGreaterThan(0)
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })

  test('game with no image element shows placeholder', async () => {
    await page.locator('.filter-search').fill('Space Invaders')
    await page.waitForTimeout(300)
    const empty = page.locator('.table-thumbnail-empty')
    expect(await empty.count()).toBeGreaterThan(0)
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Editing & Reset', () => {
  test('toggle kidgame on a game', async () => {
    await page.locator('.filter-search').fill('Galaga')
    await page.waitForTimeout(300)

    const cb = page.locator('.game-cell input[type="checkbox"]').first()
    expect(await cb.isChecked()).toBe(false)
    await cb.click({ force: true })
    await page.waitForTimeout(500)
    expect(await page.locator('.game-cell input[type="checkbox"]').first().isChecked()).toBe(true)
    await expect(page.locator('.save-bar-count')).toContainText('1 change')
  })

  test('discard reverts the toggle', async () => {
    await page.locator('.save-bar .btn-secondary').click()
    await page.waitForTimeout(300)
    const cb = page.locator('.game-cell input[type="checkbox"]').first()
    expect(await cb.isChecked()).toBe(false)
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })

  test('edit name in side panel and reset', async () => {
    await page.locator('.filter-search').fill('Pac-Man')
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })

    const nameInput = page.locator('.sp-field input[type="text"]').first()
    expect(await nameInput.inputValue()).toBe('Pac-Man')
    await nameInput.fill('Pac-Man EDITED')
    await page.waitForTimeout(300)
    await expect(page.locator('.save-bar')).toBeVisible()

    await page.locator('.sp-reset-btn').click()
    await page.waitForTimeout(300)
    expect(await nameInput.inputValue()).toBe('Pac-Man')

    await page.locator('.game-row').first().click()
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Combined Filters', () => {
  test('system mame + kidgame yes = 4 games', async () => {
    const sysBtn = page.locator('.filter-dropdown-btn').first()
    await sysBtn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    await menu.locator('.filter-dropdown-option', { hasText: 'mame' }).click()
    await page.waitForTimeout(200)
    await sysBtn.click()

    await page.locator('.filter-select-narrow').first().selectOption('yes')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('4 / 25')

    await page.locator('.filter-select-narrow').first().selectOption('all')
    await page.locator('.filter-dropdown-btn').first().click()
    const menu2 = page.locator('.filter-dropdown-menu').first()
    await menu2.locator('.filter-clear').click()
    await page.waitForTimeout(200)
  })

  test('search + system filter combine correctly', async () => {
    await page.locator('.filter-search').fill('street fighter')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('2 / 25')

    const sysBtn = page.locator('.filter-dropdown-btn').first()
    await sysBtn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    await menu.locator('.filter-dropdown-option', { hasText: 'mame' }).click()
    await page.waitForTimeout(200)
    await sysBtn.click()
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('1 / 25')

    await page.locator('.filter-search').fill('')
    await page.locator('.filter-dropdown-btn').first().click()
    const menu2 = page.locator('.filter-dropdown-menu').first()
    await menu2.locator('.filter-clear').click()
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Local Test Data — Sorting', () => {
  test('sort by name ascending', async () => {
    const nameHeader = page.locator('.header-cell.flex-grow')
    await nameHeader.click()
    await page.waitForTimeout(300)

    const firstRow = await page.locator('.game-row').first().textContent()
    expect(firstRow).toContain('Adventure')

    await nameHeader.click()
    await page.waitForTimeout(300)
    await nameHeader.click()
    await page.waitForTimeout(300)
  })
})

test.describe.serial('Local Test Data — Release Dates', () => {
  test('dates display as YYYY-MM-DD', async () => {
    const cells = await page.locator('.game-cell').allTextContents()
    const dates = cells.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.trim()))
    expect(dates.length).toBeGreaterThan(0)
    expect(dates).toContain('1980-05-22')
  })
})

test.describe.serial('Local Test Data — Description with entities', () => {
  test('HTML entities render correctly', async () => {
    await page.locator('.filter-search').fill('Pac-Man')
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })

    const desc = await page.locator('.sp-desc').inputValue()
    expect(desc).toContain('&')
    expect(desc).not.toContain('&amp;')

    await page.locator('.game-row').first().click()
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })
})
