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
- `pages/products.js`: **(New in V0.3)** Product Management with Excel export, sorting, and "Smart SKU Generator" (Auto-create IDs like `AA036-GLD-60`).
- `components/OrderForm.jsx`: **(New in V0.3)** Enhanced order form with product search, auto-fill, and job details.
- `components/Quotation.jsx`: React component rendering the quotation
- `styles/globals.css`: Basic styles

## Version 0.3 Highlights

- **Smart SKU Generator**: Automatically generates standardized product IDs (e.g., `AA036-GLD-100-50-30`) based on category, running number, color, and dimensions.
- **Product Search**: Search for products directly in the order form by ID or category, with auto-fill for price and details.
- **Excel Export**: Export your product inventory to Excel format for easy management.
- **Refined Data**: Product IDs are now structured as `CODE-COLOR-L-W-H` for better inventory tracking.

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
