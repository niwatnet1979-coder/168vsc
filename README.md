# 168VSC — 168 Interior Lighting Store App

This repository contains a minimal Next.js app with a sales/quotation page (ใบเสนอราคา) for 168 Interior Lighting.

Quick start (macOS, zsh):

```bash
# 1. Install dependencies
cd /Users/seng/PROJECT/168vsc
npm install

# 2. Run development server
npm run dev

# 3. Open the quotation page
# In your browser visit http://localhost:3001/quotation
```

What's included

- `pages/quotation.js`: Quotation (ใบเสนอราคา) page with legal/company info, sample customer, items, VAT calculation, and terms.
- `components/Quotation.jsx`: React component rendering the quotation
- `styles/globals.css`: Basic styles

Next steps you might want:

- Add PDF export (html-to-pdf / Puppeteer)
- Persist quotations in a database (Postgres / MongoDB)
- Add authentication and admin management pages

If you'd like, I can:

- Add print-to-PDF functionality
- Integrate a simple API route to save/load quotations
- Build additional pages (inventory, customers, invoices)

Print / บันทึกเป็น PDF
---------------------

คุณสามารถพิมพ์หรือบันทึกเป็น PDF โดยใช้ปุ่ม "พิมพ์ / บันทึกเป็น PDF" บนหน้าใบเสนอราคา หรือใช้คำสั่งพิมพ์ของเบราว์เซอร์ (File → Print) แล้วเลือก "Save as PDF" ในหน้าต่างพิมพ์ ตัวอย่างคำสั่งรันเซิร์ฟเวอร์และเปิดหน้า:

```bash
cd /Users/seng/PROJECT/168vsc
npm install
npm run dev
# เปิด http://localhost:3000/quotation
```

ถ้าต้องการให้ผมเพิ่มการสร้าง PDF ฝั่งเซิร์ฟเวอร์ (เช่นใช้ Puppeteer) หรือสร้างปุ่มดาวน์โหลด PDF แบบอัตโนมัติ แจ้งได้เลย ผมจะดำเนินการต่อให้
