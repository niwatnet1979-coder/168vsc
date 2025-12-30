# 🗄️ Database Schema Documentation for Supabase Migration

**วันที่สร้าง:** 2025-12-02  
**Version:** 1.0  
**วัตถุประสงค์:** เอกสารนี้กำหนดโครงสร้างฐานข้อมูลสำหรับการ Migrate จาก LocalStorage ไปยัง Supabase

---

## 📊 ภาพรวมโครงสร้าง (Overview)

ระบบประกอบด้วย **6 ตารางหลัก** ที่เชื่อมโยงกัน:

1. **products** - สินค้า
2. **customers** - ลูกค้า
3. **orders** - ใบสั่งซื้อ
4. **order_items** - รายการสินค้าในใบ order
5. **jobs** - งานติดตั้ง/จัดส่ง
6. **teams** - ทีมช่าง/QC

---

## 1️⃣ Table: `products` (สินค้า)

**ชื่อไฟล์ LocalStorage:** `products_data_v3`

| Column Name | Data Type | Constraints | Description | Example |
|:---|:---|:---|:---|:---|
| `id` | TEXT | PRIMARY KEY | รหัสสินค้า (SKU) | `AA001-GLD-80-80-00` |
| `base_code` | TEXT | | รหัสฐาน (ไม่รวม spec) | `AA001` |
| `name` | TEXT | | ชื่อสินค้า (ถ้ามี) | - |
| `category` | TEXT | | ประเภทหลัก | `โคมไฟระย้า` |
| `subcategory` | TEXT | | ประเภทย่อย | `คริสตัล` |
| `description` | TEXT | | รายละเอียด | `โคมระย้า 6 แขน` |
| `price` | DECIMAL(10,2) | NOT NULL, DEFAULT 0 | ราคา (บาท) | `832900.00` |
| `stock` | INTEGER | NOT NULL, DEFAULT 0 | จำนวนคงเหลือ | `5` |
| `length` | TEXT | | ความยาว (cm) | `80` |
| `width` | TEXT | | ความกว้าง (cm) | `80` |
| `height` | TEXT | | ความสูง (cm) | `120` |
| `material` | TEXT | | วัสดุ | `คริสตัล/โลหะ` |
| `color` | TEXT | | สีโครงสร้าง | `ทอง` |
| `crystal_color` | TEXT | | สีคริสตัล | `ใส` |
| `bulb_type` | TEXT | | ชนิดหลอดไฟ | `E14` |
| `light` | TEXT | | ชนิดแสงไฟ | `Warm White` |
| `remote` | TEXT | | มีรีโมทหรือไม่ | `มี` / `ไม่มี` |
| `brand` | TEXT | | ยี่ห้อ | - |
| `supplier` | TEXT | | ผู้จำหน่าย | - |
| `warranty` | TEXT | | การรับประกัน | `1 ปี` |
| `images` | JSONB | | รูปภาพ (array of URLs) | `["base64..."]` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่สร้าง | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่แก้ไข | |

**Indexes:**

- `idx_products_category` ON `category`
- `idx_products_base_code` ON `base_code`

---

## 2️⃣ Table: `customers` (ลูกค้า)

**ชื่อไฟล์ LocalStorage:** `customers_data`

| Column Name | Data Type | Constraints | Description | Example |
|:---|:---|:---|:---|:---|
| `id` | SERIAL | PRIMARY KEY | รหัสลูกค้า | `1` |
| `name` | TEXT | NOT NULL | ชื่อลูกค้า/บริษัท | `บริษัท สยามพารากอน จำกัด` |
| `contact_person` | TEXT | | ชื่อผู้ติดต่อ | `คุณสมชาย` |
| `phone` | TEXT | | เบอร์โทร | `02-610-8000` |
| `email` | TEXT | | อีเมล | `contact@siamparagon.com` |
| `line_id` | TEXT | | LINE ID | `@siamparagon` |
| `facebook` | TEXT | | Facebook | `Siam Paragon` |
| `instagram` | TEXT | | Instagram | `@siamparagon` |
| `tax_invoices` | JSONB | | ข้อมูลใบกำกับภาษี (array) | `[{...}]` |
| `saved_addresses` | JSONB | | ที่อยู่ที่บันทึกไว้ (array) | `[{...}]` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่สร้าง | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่แก้ไข | |

### JSONB Structure: `tax_invoices`

```json
[
  {
    "company_name": "บริษัท สยามพารากอน จำกัด",
    "tax_id": "0105585098765",
    "branch": "สำนักงานใหญ่",
    "address": "991 ถนนพระราม 1 เขตปทุมวัน กรุงเทพฯ 10330",
    "phone": "02-610-8000",
    "email": "acc@siamparagon.com",
    "delivery_address": "..."
  }
]
```

### JSONB Structure: `saved_addresses`

```json
[
  {
    "name": "ท่าฉลาก (Loading Area)",
    "address": "991 ถนนพระราม 1...",
    "google_map_link": "https://maps.google.com/?q=13.7462,100.5347",
    "inspector1": "คุณสมชาย",
    "inspector1_phone": "081-111-1111",
    "inspector2": "วิมล ท้าวกัสุ",
    "inspector2_phone": "02-610-8888"
  }
]
```

**Indexes:**

- `idx_customers_name` ON `name`
- `idx_customers_phone` ON `phone`

---

## 3️⃣ Table: `orders` (ใบสั่งซื้อ)

**ชื่อไฟล์ LocalStorage:** `orders_data` (ยังไม่มี - ต้องสร้าง)

| Column Name | Data Type | Constraints | Description | Example |
|:---|:---|:---|:---|:---|
| `id` | TEXT | PRIMARY KEY | รหัสใบสั่งซื้อ | `PO-20251202-001` |
| `customer_id` | INTEGER | FK → customers(id) | รหัสลูกค้า | `1` |
| `order_date` | DATE | NOT NULL | วันที่สั่ง | `2025-12-02` |
| `status` | TEXT | NOT NULL, DEFAULT 'draft' | สถานะ | `draft`, `confirmed`, `completed` |
| `tax_invoice` | JSONB | | ข้อมูลใบกำกับภาษีที่เลือก | `{...}` |
| `shipping_fee` | DECIMAL(10,2) | DEFAULT 0 | ค่าขนส่ง | `500.00` |
| `discount_type` | TEXT | | ประเภทส่วนลด | `percent` / `fixed` |
| `discount_value` | DECIMAL(10,2) | DEFAULT 0 | มูลค่าส่วนลด | `50` (%) หรือ `1000` (บาท) |
| `deposit` | DECIMAL(10,2) | DEFAULT 0 | มัดจำ | `10000.00` |
| `notes` | TEXT | | หมายเหตุ | - |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่สร้าง | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่แก้ไข | |

**Indexes:**

- `idx_orders_customer` ON `customer_id`
- `idx_orders_date` ON `order_date`
- `idx_orders_status` ON `status`

---

## 4️⃣ Table: `order_items` (รายการสินค้าในใบสั่ง)

**ความเชื่อมโยง:** `orders` → `order_items` (One-to-Many)

| Column Name | Data Type | Constraints | Description | Example |
|:---|:---|:---|:---|:---|
| `id` | SERIAL | PRIMARY KEY | รหัสรายการ | `1` |
| `order_id` | TEXT | FK → orders(id), ON DELETE CASCADE | รหัสใบสั่งซื้อ | `PO-20251202-001` |
| `product_id` | TEXT | FK → products(id) | รหัสสินค้า (SKU) | `AA001-GLD-80-80-00` |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | จำนวน | `2` |
| `unit_price` | DECIMAL(10,2) | NOT NULL | ราคาต่อหน่วย | `832900.00` |
| `job_id` | INTEGER | FK → jobs(id), NULL | งานเฉพาะสำหรับรายการนี้ | `5` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่สร้าง | |

**Indexes:**

- `idx_order_items_order` ON `order_id`
- `idx_order_items_product` ON `product_id`

---

## 5️⃣ Table: `jobs` (งานติดตั้ง/จัดส่ง)

**ความเชื่อมโยง:**

- `orders` → `jobs` (One-to-Many) สำหรับ Master Job
- `order_items` → `jobs` (One-to-One optional) สำหรับ Specific Job

| Column Name | Data Type | Constraints | Description | Example |
|:---|:---|:---|:---|:---|
| `id` | SERIAL | PRIMARY KEY | รหัสงาน | `1` |
| `order_id` | TEXT | FK → orders(id), ON DELETE CASCADE | รหัสใบสั่งซื้อ | `PO-20251202-001` |
| `job_type` | TEXT | NOT NULL | ประเภทงาน | `installation`, `delivery`, `separate_job` |
| `is_master_job` | BOOLEAN | DEFAULT FALSE | เป็น Master Job หรือไม่ | `TRUE` |
| `team_id` | INTEGER | FK → teams(id), NULL | ทีมที่รับผิดชอบ | `3` |
| `appointment_date` | DATE | | วันที่นัดหมาย | `2025-12-05` |
| `appointment_time` | TIME | | เวลานัดหมาย | `10:00:00` |
| `install_location_name` | TEXT | | ชื่อสถานที่ | `ท่าฉลาก` |
| `install_address` | TEXT | | ที่อยู่ติดตั้ง | `991 ถ.พระราม 1...` |
| `google_map_link` | TEXT | | ลิงก์ Google Maps | `https://maps.google.com/...` |
| `distance` | DECIMAL(10,2) | | ระยะทาง (km) | `26.00` |
| `inspector1_name` | TEXT | | ผู้ตรวจงาน 1 | `คุณสมชาย` |
| `inspector1_phone` | TEXT | | เบอร์ผู้ตรวจงาน 1 | `081-111-1111` |
| `inspector2_name` | TEXT | | ผู้ตรวจงาน 2 | - |
| `inspector2_phone` | TEXT | | เบอร์ผู้ตรวจงาน 2 | - |
| `status` | TEXT | DEFAULT 'pending' | สถานะงาน | `pending`, `in_progress`, `completed` |
| `notes` | TEXT | | หมายเหตุ | - |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่สร้าง | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่แก้ไข | |

**Indexes:**

- `idx_jobs_order` ON `order_id`
- `idx_jobs_team` ON `team_id`
- `idx_jobs_date` ON `appointment_date`

---

## 6️⃣ Table: `teams` (ทีมช่าง/QC)

**ชื่อไฟล์ LocalStorage:** `teams_data`

| Column Name | Data Type | Constraints | Description | Example |
|:---|:---|:---|:---|:---|
| `id` | SERIAL | PRIMARY KEY | รหัสทีม | `1` |
| `name` | TEXT | NOT NULL, UNIQUE | ชื่อทีม | `ทีม A - ติดตั้ง` |
| `type` | TEXT | NOT NULL | ประเภททีม | `QC` / `ช่าง` |
| `members` | JSONB | | สมาชิกในทีม (array) | `[{"name": "คุณสมชาย", "phone": "..."}]` |
| `active` | BOOLEAN | DEFAULT TRUE | ใช้งานอยู่หรือไม่ | `TRUE` |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่สร้าง | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | วันที่แก้ไข | |

**Indexes:**

- `idx_teams_type` ON `type`
- `idx_teams_active` ON `active`

---

## 🔗 Relationships (ความสัมพันธ์)

```
customers (1) ----< orders (M)
                      |
                      +----< order_items (M) ----< products (1)
                      |            |
                      |            +----< jobs (1) [Specific Job]
                      |
                      +----< jobs (M) [Master Jobs]
                               |
                               +----< teams (1)
```

---

## 📝 Migration Steps (ขั้นตอนการ Migrate)

### Step 1: สร้างตารางใน Supabase

```sql
-- สร้างตารางตามลำดับ (เพื่อหลีกเลี่ยง FK errors)
1. products
2. customers
3. teams
4. orders
5. jobs
6. order_items
```

### Step 2: Enable Row Level Security (RLS)

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ... (ทำกับทุกตาราง)
```

### Step 3: สร้าง Policies

```sql
-- อนุญาตให้ทุกคนอ่านได้ (สำหรับ demo)
CREATE POLICY "Enable read for all users" ON products FOR SELECT USING (true);
-- ... (ทำกับทุกตาราง)
```

### Step 4: Migrate Data

```javascript
// ดึงข้อมูลจาก LocalStorage
const products = JSON.parse(localStorage.getItem('products_data_v3'));
const customers = JSON.parse(localStorage.getItem('customers_data'));

// Insert to Supabase
await supabase.from('products').insert(products);
await supabase.from('customers').insert(customers);
```

---

## 🎯 Next Steps

1. **ทดสอบ LocalStorage ให้สมบูรณ์ก่อน**
   - ให้มั่นใจว่า CRUD ทำงานได้ทุกหน้า
   - ข้อมูล sync กันระหว่างหน้า

2. **สร้างตารางใน Supabase ตาม Schema นี้**

3. **Migrate Data จาก LocalStorage → Supabase**

4. **แก้โค้ดเปลี่ยนจาก `localStorage.getItem()` → `supabase.from().select()`**

5. **ทดสอบ Real-time Subscription**

   ```javascript
   supabase
     .channel('products-changes')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, 
       payload => {
         console.log('Product changed:', payload)
         // Refresh UI
       }
     )
     .subscribe()
   ```

---

**หมายเหตุ:** Schema นี้ออกแบบมาให้รองรับการทำงานแบบ Real-time และ Scalable พร้อมใช้งานกับ Supabase ทันที
