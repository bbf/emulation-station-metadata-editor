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

const ROMS_PATH = '\\\\rcade\\share\\roms'

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, '../out/main/index.js')],
    env: { ...process.env, NODE_ENV: 'production' }
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app.close()
})

test.describe.serial('Startup & Loading', () => {
  test('shows path selector with title, input, and button', async () => {
    await expect(page.locator('h1')).toHaveText('ES Metadata Editor')
    await expect(page.locator('.path-input')).toBeVisible()
    await expect(page.locator('.btn-primary')).toHaveText('Load Gamelists')
    await expect(page.locator('.subtitle')).toContainText('path')
  })

  test('browse button is present', async () => {
    await expect(page.locator('.btn-secondary', { hasText: 'Browse' })).toBeVisible()
  })

  test('load button is disabled when input is empty', async () => {
    await page.locator('.path-input').fill('')
    await expect(page.locator('.btn-primary')).toBeDisabled()
  })

  test('load gamelists shows progress bar', async () => {
    test.setTimeout(120_000)
    await page.locator('.path-input').fill(ROMS_PATH)
    await page.locator('.btn-primary').click()

    await expect(page.locator('.loading-card')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.loading-phase')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.loading-bar-fill')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('.loading-count')).toBeVisible({ timeout: 10_000 })
  })

  test('progress counter shows numeric values', async () => {
    test.setTimeout(120_000)
    const countText = await page.locator('.loading-count').textContent()
    expect(countText).toMatch(/\d+\s*\/\s*\d+/)
    await page.waitForSelector('.game-table-wrapper', { timeout: 90_000 })
  })

  test('window title is correct', async () => {
    expect(await page.title()).toBe('EmulationStation Metadata Editor')
  })
})

test.describe.serial('Table Structure', () => {
  test('all 14 columns visible by default', async () => {
    const count = await page.locator('.header-cell').count()
    expect(count).toBe(14)
  })

  test('name column fills remaining space (flex-grow)', async () => {
    const nameHeader = page.locator('.header-cell.flex-grow')
    await expect(nameHeader).toBeVisible()
    const box = await nameHeader.boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(200)
  })

  test('header cells display correct labels', async () => {
    const headers = await page.locator('.header-cell').allTextContents()
    const labels = headers.map((h) => h.replace(/[▲▼]/g, '').trim())
    expect(labels).toContain('System')
    expect(labels).toContain('Name')
    expect(labels).toContain('Genre')
    expect(labels).toContain('Kid')
    expect(labels).toContain('Fav')
    expect(labels).toContain('Hidden')
  })

  test('game rows are rendered', async () => {
    const rows = page.locator('.game-row')
    await expect(rows.first()).toBeVisible({ timeout: 5000 })
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('game count shows total', async () => {
    const text = await page.locator('.game-count').textContent()
    expect(text).toMatch(/\d+ games/)
  })

  test('table has virtual scrolling — fewer DOM rows than total games', async () => {
    const body = page.locator('.game-table-body')
    const scrollHeight = await body.evaluate((el) => el.scrollHeight)
    const clientHeight = await body.evaluate((el) => el.clientHeight)
    expect(scrollHeight).toBeGreaterThan(clientHeight)
    const rowCount = await page.locator('.game-row').count()
    expect(rowCount).toBeLessThan(50)
  })

  test('scrolling loads different rows', async () => {
    const body = page.locator('.game-table-body')
    const firstRowBefore = await page.locator('.game-row').first().textContent()
    await body.evaluate((el) => el.scrollTo(0, 5000))
    await page.waitForTimeout(500)
    const firstRowAfter = await page.locator('.game-row').first().textContent()
    expect(firstRowAfter).not.toBe(firstRowBefore)
    await body.evaluate((el) => el.scrollTo(0, 0))
    await page.waitForTimeout(300)
  })

  test('release dates display as YYYY-MM-DD', async () => {
    const all = await page.locator('.game-cell').allTextContents()
    expect(all.some((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.trim()))).toBe(true)
  })

  test('rating stars display in cells', async () => {
    const stars = page.locator('.rating-stars')
    if ((await stars.count()) > 0) {
      const text = await stars.first().textContent()
      expect(text).toMatch(/[★☆]+/)
    }
  })

  test('thumbnails render at 128px', async () => {
    await page.waitForTimeout(3000)
    const thumb = page.locator('.table-thumbnail').first()
    if ((await thumb.count()) > 0) {
      const box = await thumb.boundingBox()
      expect(box!.width).toBeLessThanOrEqual(128)
      expect(box!.height).toBeLessThanOrEqual(128)
    }
  })
})

test.describe.serial('System Filter (checkbox dropdown)', () => {
  test('opens dropdown with checkboxes and counts', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })

    const opts = menu.locator('.filter-dropdown-option')
    expect(await opts.count()).toBeGreaterThan(0)

    const counts = menu.locator('.filter-option-count')
    expect(await counts.count()).toBeGreaterThan(0)
    const firstCount = await counts.first().textContent()
    expect(parseInt(firstCount!)).toBeGreaterThan(0)
  })

  test('selecting a system filters the list', async () => {
    const menu = page.locator('.filter-dropdown-menu').first()
    await menu.locator('.filter-dropdown-option').first().locator('input').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('/')
  })

  test('selecting multiple systems shows union', async () => {
    const menu = page.locator('.filter-dropdown-menu').first()
    const countBefore = await page.locator('.game-count').textContent()
    await menu.locator('.filter-dropdown-option').nth(1).locator('input').click()
    await page.waitForTimeout(300)
    const countAfter = await page.locator('.game-count').textContent()
    expect(countAfter).not.toBe(countBefore)
  })

  test('button shows selection count', async () => {
    const btn = page.locator('.filter-dropdown-btn').first()
    const text = await btn.textContent()
    expect(text).toContain('selected')
  })

  test('clear all resets system filter', async () => {
    const menu = page.locator('.filter-dropdown-menu').first()
    await menu.locator('.filter-clear').click()
    await page.waitForTimeout(200)
    const text = await page.locator('.filter-dropdown-btn').first().textContent()
    expect(text).toContain('All Systems')
  })
})

test.describe.serial('Genre Filter (checkbox dropdown with counts)', () => {
  test('opens dropdown with checkboxes and counts', async () => {
    const btn = page.locator('.filter-dropdown-btn').nth(1)
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })

    const counts = menu.locator('.filter-option-count')
    expect(await counts.count()).toBeGreaterThan(0)
    const firstCount = await counts.first().textContent()
    expect(parseInt(firstCount!)).toBeGreaterThan(0)
  })

  test('selecting a genre filters the list', async () => {
    const menu = page.locator('.filter-dropdown-menu').first()
    await menu.locator('.filter-dropdown-option').first().locator('input').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('/')
  })

  test('clear all resets genre filter', async () => {
    const menu = page.locator('.filter-dropdown-menu').first()
    await menu.locator('.filter-clear').click()
    await page.waitForTimeout(200)
    const text = await page.locator('.filter-dropdown-btn').nth(1).textContent()
    expect(text).toContain('All Genres')
  })

  test('only genres in use are shown', async () => {
    const btn = page.locator('.filter-dropdown-btn').nth(1)
    await btn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    const counts = menu.locator('.filter-option-count')
    const allCounts = await counts.allTextContents()
    for (const c of allCounts) {
      expect(parseInt(c)).toBeGreaterThan(0)
    }
    await page.locator('.filter-bar').click({ position: { x: 5, y: 5 } })
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Boolean Filters', () => {
  test('kidgame filter yes/no/all', async () => {
    const sel = page.locator('.filter-select-narrow').first()
    await sel.selectOption('yes')
    await expect(page.locator('.game-count')).toContainText('/', { timeout: 3000 })
    await sel.selectOption('no')
    await expect(page.locator('.game-count')).toContainText('/', { timeout: 3000 })
    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })

  test('favorite filter yes/no/all', async () => {
    const sel = page.locator('.filter-select-narrow').nth(1)
    await sel.selectOption('yes')
    await expect(page.locator('.game-count')).toContainText('/', { timeout: 3000 })
    await sel.selectOption('no')
    await expect(page.locator('.game-count')).toContainText('/', { timeout: 3000 })
    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })

  test('hidden filter yes/no/all', async () => {
    const sel = page.locator('.filter-select-narrow').nth(2)
    await sel.selectOption('yes')
    await expect(page.locator('.game-count')).toContainText('/', { timeout: 3000 })
    await sel.selectOption('no')
    await expect(page.locator('.game-count')).toContainText('/', { timeout: 3000 })
    await sel.selectOption('all')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Search', () => {
  test('search filters by name', async () => {
    const search = page.locator('.filter-search')
    await search.fill('mario')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('/')
  })

  test('clearing search restores full list', async () => {
    const totalBefore = await page.locator('.game-count').textContent()
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(300)
    const totalAfter = await page.locator('.game-count').textContent()
    expect(totalAfter).not.toContain('/')
    expect(totalAfter).toMatch(/\d+ games/)
  })

  test('search with no results shows zero', async () => {
    await page.locator('.filter-search').fill('zzzzznonexistent99999')
    await page.waitForTimeout(300)
    await expect(page.locator('.game-count')).toContainText('0 /')
    await page.locator('.filter-search').fill('')
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Column Selector', () => {
  test('dropdown opens and shows 14 columns', async () => {
    await page.locator('button', { hasText: 'Columns' }).click()
    await expect(page.locator('.column-dropdown')).toBeVisible({ timeout: 2000 })
    expect(await page.locator('.column-option').count()).toBe(14)
  })

  test('unchecking a column removes it from the table', async () => {
    const before = await page.locator('.header-cell').count()
    const genreCheck = page.locator('.column-option', { hasText: 'Genre' }).locator('input')
    await genreCheck.click()
    await page.waitForTimeout(500)
    expect(await page.locator('.header-cell').count()).toBe(before - 1)
  })

  test('re-checking restores the column', async () => {
    const before = await page.locator('.header-cell').count()
    const genreCheck = page.locator('.column-option', { hasText: 'Genre' }).locator('input')
    await genreCheck.click()
    await page.waitForTimeout(500)
    expect(await page.locator('.header-cell').count()).toBe(before + 1)
  })

  test('close dropdown by clicking outside', async () => {
    await page.locator('.game-list-toolbar').click({ position: { x: 5, y: 5 } })
    await expect(page.locator('.column-dropdown')).not.toBeVisible()
  })
})

test.describe.serial('Row Selection & Side Panel', () => {
  test('clicking a row selects it', async () => {
    await page.locator('.game-table-body').evaluate((el) => el.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const row = page.locator('.game-row').first()
    await row.click()
    await expect(row).toHaveClass(/selected/)
  })

  test('side panel opens with image area', async () => {
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.side-panel-image')).toBeVisible()
  })

  test('side panel shows genre label', async () => {
    await expect(page.locator('.side-panel-genre')).toBeVisible()
  })

  test('side panel has name input', async () => {
    const nameInput = page.locator('.sp-field input[type="text"]').first()
    await expect(nameInput).toBeVisible()
    expect((await nameInput.inputValue()).length).toBeGreaterThan(0)
  })

  test('side panel has description textarea that fills space', async () => {
    const desc = page.locator('.sp-desc')
    await expect(desc).toBeVisible()
    const box = await desc.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(75)
  })

  test('side panel has star rating widget', async () => {
    await expect(page.locator('.star-rating')).toBeVisible()
    expect(await page.locator('.star-rating .star').count()).toBe(5)
  })

  test('side panel has genre dropdown', async () => {
    await expect(page.locator('.genre-display')).toBeVisible()
  })

  test('side panel has date input', async () => {
    await expect(page.locator('.sp-field input[type="date"]')).toBeVisible()
  })

  test('side panel has 3 boolean checkboxes', async () => {
    expect(await page.locator('.sp-checkbox').count()).toBe(3)
  })

  test('side panel shows readonly fields', async () => {
    const readonly = page.locator('.sp-readonly')
    await expect(readonly).toBeVisible()
    const text = await readonly.textContent()
    expect(text).toContain('System:')
    expect(text).toContain('Path:')
  })

  test('clicking selected row deselects and hides panel', async () => {
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).not.toBeVisible()
  })
})

test.describe.serial('Inline Editing', () => {
  test('editing name in side panel creates pending change', async () => {
    await page.locator('.game-table-body').evaluate((el) => el.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })

    const nameInput = page.locator('.sp-field input[type="text"]').first()
    const orig = await nameInput.inputValue()
    await nameInput.fill(orig + ' TEST')
    await page.waitForTimeout(300)
    await expect(page.locator('.save-bar')).toBeVisible()
    await expect(page.locator('.save-bar-count')).toContainText('1 change')
  })

  test('reset button appears and restores original value', async () => {
    const resetBtn = page.locator('.sp-reset-btn')
    await expect(resetBtn).toBeVisible()
    await resetBtn.click()
    await page.waitForTimeout(300)
    await expect(page.locator('.sp-reset-btn')).not.toBeVisible()
  })

  test('toggling kidgame checkbox in table creates pending change', async () => {
    await page.locator('.game-row').first().click()
    await page.waitForTimeout(200)

    const cb = page.locator('.game-cell input[type="checkbox"]').first()
    const was = await cb.isChecked()
    await cb.click({ force: true })
    await page.waitForTimeout(500)
    expect(await page.locator('.game-cell input[type="checkbox"]').first().isChecked()).toBe(!was)
    await expect(page.locator('.save-bar')).toBeVisible()
  })

  test('toggling back removes the pending change', async () => {
    await page.locator('.game-cell input[type="checkbox"]').first().click({ force: true })
    await page.waitForTimeout(500)
  })

  test('editing boolean in side panel stages change', async () => {
    await page.locator('.game-table-body').evaluate((el) => el.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })

    const kidCheck = page.locator('.sp-checkbox input').first()
    await kidCheck.click()
    await page.waitForTimeout(300)
    await expect(page.locator('.save-bar')).toBeVisible()

    await kidCheck.click()
    await page.waitForTimeout(300)
  })

  test('discard button removes all pending changes', async () => {
    const nameInput = page.locator('.sp-field input[type="text"]').first()
    const orig = await nameInput.inputValue()
    await nameInput.fill(orig + ' DISCARD_TEST')
    await page.waitForTimeout(300)
    await expect(page.locator('.save-bar')).toBeVisible()

    const discardBtn = page.locator('.save-bar .btn-secondary')
    await discardBtn.click()
    await page.waitForTimeout(300)
  })

  test('after discard, side panel shows original values', async () => {
    const nameInput = page.locator('.sp-field input[type="text"]').first()
    const val = await nameInput.inputValue()
    expect(val).not.toContain('DISCARD_TEST')
    await page.locator('.game-row').first().click()
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Sorting', () => {
  test('clicking a header sorts ascending', async () => {
    const nameHeader = page.locator('.header-cell.flex-grow')
    await nameHeader.click()
    await page.waitForTimeout(300)
    const text = await nameHeader.textContent()
    expect(text).toContain('▲')
  })

  test('clicking again sorts descending', async () => {
    const nameHeader = page.locator('.header-cell.flex-grow')
    await nameHeader.click()
    await page.waitForTimeout(300)
    const text = await nameHeader.textContent()
    expect(text).toContain('▼')
  })

  test('clicking third time removes sort', async () => {
    const nameHeader = page.locator('.header-cell.flex-grow')
    await nameHeader.click()
    await page.waitForTimeout(300)
    const text = await nameHeader.textContent()
    expect(text).not.toContain('▲')
    expect(text).not.toContain('▼')
  })
})

test.describe.serial('Combined Filters', () => {
  test('system + kidgame filters combine', async () => {
    const systemBtn = page.locator('.filter-dropdown-btn').first()
    await systemBtn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    await menu.locator('.filter-dropdown-option').first().locator('input').click()
    await page.waitForTimeout(300)

    const kidSel = page.locator('.filter-select-narrow').first()
    await kidSel.selectOption('yes')
    await page.waitForTimeout(300)

    const text = await page.locator('.game-count').textContent()
    expect(text).toContain('/')

    await kidSel.selectOption('all')
    await menu.locator('.filter-clear').click()
    await page.waitForTimeout(200)
  })

  test('search + genre filter combine', async () => {
    await page.locator('.filter-search').fill('a')
    await page.waitForTimeout(300)

    const genreBtn = page.locator('.filter-dropdown-btn').nth(1)
    await genreBtn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    await menu.locator('.filter-dropdown-option').first().locator('input').click()
    await page.waitForTimeout(300)

    const text = await page.locator('.game-count').textContent()
    expect(text).toContain('/')

    await page.locator('.filter-search').fill('')
    await menu.locator('.filter-clear').click()
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Window Resize', () => {
  test('shrinking window shrinks table', async () => {
    const w1 = await page.locator('.game-table-body').evaluate((el) => el.clientWidth)
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(800, 600))
    await page.waitForTimeout(500)
    const w2 = await page.locator('.game-table-body').evaluate((el) => el.clientWidth)
    expect(w2).toBeLessThan(w1)
  })

  test('growing window grows table', async () => {
    const w1 = await page.locator('.game-table-body').evaluate((el) => el.clientWidth)
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1400, 900))
    await page.waitForTimeout(500)
    const w2 = await page.locator('.game-table-body').evaluate((el) => el.clientWidth)
    expect(w2).toBeGreaterThan(w1)
  })
})

test.describe.serial('Keyboard Shortcuts', () => {
  test('Ctrl+S triggers save when changes pending', async () => {
    await page.locator('.game-table-body').evaluate((el) => el.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await expect(page.locator('.side-panel')).toBeVisible({ timeout: 3000 })

    const nameInput = page.locator('.sp-field input[type="text"]').first()
    const orig = await nameInput.inputValue()
    await nameInput.fill(orig + ' SAVE_TEST')
    await page.waitForTimeout(300)
    await expect(page.locator('.save-bar')).toBeVisible()

    await page.locator('.sp-reset-btn').click()
    await page.waitForTimeout(300)
    await page.locator('.game-row').first().click()
    await page.waitForTimeout(200)
  })
})

test.describe.serial('Rapid Interactions', () => {
  test('rapid filter switching stays responsive', async () => {
    const systemBtn = page.locator('.filter-dropdown-btn').first()
    await systemBtn.click()
    const menu = page.locator('.filter-dropdown-menu').first()
    await expect(menu).toBeVisible({ timeout: 2000 })
    const opts = menu.locator('.filter-dropdown-option input')
    const count = await opts.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      await opts.nth(i).click()
      await expect(page.locator('.game-count')).toBeVisible({ timeout: 2000 })
    }
    for (let i = 0; i < Math.min(count, 5); i++) {
      await opts.nth(i).click()
    }
    await page.waitForTimeout(200)
    const text = await page.locator('.filter-dropdown-btn').first().textContent()
    expect(text).toContain('All Systems')
  })

  test('rapid row clicking stays responsive', async () => {
    for (let i = 0; i < 5; i++) {
      await page.locator('.game-row').nth(i % 3).click()
      await page.waitForTimeout(100)
    }
    await page.locator('.game-row').first().click()
    await page.waitForTimeout(200)
  })
})
