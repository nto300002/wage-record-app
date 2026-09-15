import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const port = 4173
const server = spawn('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' })
const baseUrl = `http://127.0.0.1:${port}`

try {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) break
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(baseUrl)

  if (await page.getByLabel('午前の仕事').count() !== 0) throw new Error('午前の仕事ラベルが見つかりません')
  if (await page.getByLabel('午前のしごと').count() !== 1) throw new Error('午前のしごとラベルが見つかりません')
  if (await page.getByLabel('午前の時間').count() !== 1) throw new Error('午前の時間ラベルが見つかりません')
  if (await page.getByLabel('出来高1の単価').count() !== 1) throw new Error('出来高の単価ラベルが見つかりません')

  await page.keyboard.press('Tab')
  if (await page.evaluate(() => document.activeElement?.tagName) !== 'BUTTON') throw new Error('キーボードフォーカスが移動しません')

  await page.getByRole('button', { name: 'なし' }).click()
  if (await page.getByRole('heading', { name: 'できだか' }).count() !== 1) throw new Error('やさしい表示へ切り替わりません')
  if (await page.getByText('かんじ', { exact: true }).count() !== 1) throw new Error('かんじ表記へ切り替わりません')
  if (await page.getByLabel('できだか1の単価').count() !== 1) throw new Error('やさしい表示の出来高ラベルが見つかりません')

  await page.getByRole('button', { name: /おわる/ }).click()
  if (await page.getByLabel('ごぜんの時間').inputValue() !== '0') throw new Error('リセット後の時間が0になりません')
  if (await page.getByLabel('ごぜんの分').inputValue() !== '0') throw new Error('リセット後の分が0になりません')

  const results = await new AxeBuilder({ page }).analyze()
  if (results.violations.length > 0) {
    throw new Error(`アクセシビリティ違反: ${results.violations.map((violation) => violation.id).join(', ')}`)
  }

  await browser.close()
  console.log('Browser acceptance and accessibility checks passed.')
} finally {
  server.kill()
}
