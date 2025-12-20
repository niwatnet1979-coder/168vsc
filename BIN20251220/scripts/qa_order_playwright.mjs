import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'

(async () => {
  const outDir = '/tmp/qa_order_playwright'
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const report = {
    url: 'http://localhost:3001/order',
    timestamp: new Date().toISOString(),
    headings: {},
    dateInputsFound: [],
    buttonsFound: {},
    errors: []
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  try {
    await page.goto(report.url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(800)

    const headings = ['ข้อมูลลูกค้า', 'สรุปยอดชำระ', 'รายการสินค้า', 'ข้อมูลใบกำกับภาษี', 'ผู้ติดต่อจัดซื้อ']
    for (const h of headings) {
      try {
        const locator = page.locator(`text=${h}`).first()
        const visible = await locator.count() > 0 && await locator.isVisible().catch(() => false)
        report.headings[h] = !!visible
        if (visible) {
          const el = await locator.first().elementHandle()
          if (el) {
            const box = await el.boundingBox()
            if (box) {
              const safeName = h.replace(/[^a-zA-Z0-9-_]/g, '_')
              const clip = { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(1200, box.width + 16), height: Math.min(800, box.height + 16) }
              await page.screenshot({ path: path.join(outDir, `heading_${safeName}.png`), clip }).catch(() => {})
            }
          }
        }
      } catch (err) {
        report.errors.push(`heading-check:${h}: ${String(err)}`)
      }
    }

    // find date/time inputs
    const dateInputs = await page.$$('input[type="date"], input[type="datetime-local"], input[type="time"]')
    report.dateInputsFound = dateInputs.length
    if (dateInputs.length > 0) {
      await page.screenshot({ path: path.join(outDir, 'date_inputs_present.png') }).catch(()=>{})
    }

    // buttons
    const buttons = ['เพิ่มการชำระ', 'เพิ่มรายการ', 'ยกเลิก', 'บันทึก']
    for (const b of buttons) {
      try {
        const count = await page.locator(`text=${b}`).count()
        report.buttonsFound[b] = count
      } catch (err) {
        report.errors.push(`button-check:${b}: ${String(err)}`)
      }
    }

    // Try open payment modal if button exists
    try {
      const addPayment = page.locator('text=เพิ่มการชำระ').first()
      if (await addPayment.count() > 0) {
        await addPayment.click({ timeout: 3000 }).catch(()=>{})
        await page.waitForTimeout(600)
        // look for inputs inside modal
        const modalDate = await page.$('input[type="date"], input[type="datetime-local"]')
        report.paymentModal = { dateFieldPresent: !!modalDate }
        await page.screenshot({ path: path.join(outDir, 'payment_modal.png') }).catch(()=>{})
      } else {
        report.paymentModal = { opened: false }
      }
    } catch (err) {
      report.errors.push(`open-payment-modal: ${String(err)}`)
    }

    // full page screenshot
    await page.screenshot({ path: path.join(outDir, 'page_full.png'), fullPage: true }).catch(()=>{})

  } catch (err) {
    report.errors.push(`navigation: ${String(err)}`)
  } finally {
    await browser.close()
  }

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
  console.log('QA report written to', path.join(outDir, 'report.json'))
  process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
