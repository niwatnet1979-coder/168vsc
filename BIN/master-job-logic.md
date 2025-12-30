# Master Job vs Separate Job Logic Documentation

## 1. วัตถุประสงค์ (Objective)

ระบบนี้ถูกออกแบบมาเพื่อรองรับรูปแบบการทำงาน 2 ลักษณะหลัก:

1. **งานเหมา (Single Job):** สินค้าทุกชิ้นในออเดอร์นี้ ถูกติดตั้งหรือจัดส่ง **ที่เดียวกัน เวลาเดียวกัน ทีมเดียวกัน** (เช่น ติดตั้งไฟทั้งบ้าน)
2. **งานแยก (Separate Job):** สินค้าแต่ละชิ้นอาจจะถูกติดตั้ง **คนละที่ คนละเวลา หรือคนละทีม** (เช่น ซื้อของ 3 ชิ้น ไปติด 3 สาขา)

## 2. ตรรกะการทำงาน (Logic Flow)

### กรณีที่ 1: Master Job = "งานติดตั้ง" หรือ "งานจัดส่ง"

* **สถานะ:** **Inheritance Mode (สืบทอดข้อมูล)**
* **พฤติกรรม:**
  * ข้อมูลใน Job ย่อย (Order Items) จะถูกบังคับให้ **เหมือนกับ Master Job ทุกประการ**
  * **การแก้ไข:** ❌ **ไม่สามารถแก้ไข** ข้อมูลใน Job ย่อยได้ (Read-only / Disabled)
  * หากมีการแก้ไข Master Job -> ข้อมูลใน Job ย่อยทุกรายการจะเปลี่ยนตามทันที
* **Use Case:** ลูกค้าสั่งของ 10 ชิ้น ไปติดตั้งที่บ้านหลังเดียว

### กรณีที่ 2: Master Job = "Job งานแยก (Separate Job)"

* **สถานะ:** **Independent Mode (อิสระ)**
* **พฤติกรรม:**
  * ข้อมูลใน Job ย่อย (Order Items) สามารถ **กำหนดเองได้อย่างอิสระ**
  * **การแก้ไข:** ✅ **สามารถแก้ไข** ข้อมูลใน Job ย่อยได้ทุกช่อง
  * ค่าเริ่มต้น (Default) จะดึงมาจาก Master Job แต่สามารถเปลี่ยนได้
* **Use Case:** ลูกค้าสั่งของ 3 ชิ้น ชิ้นที่ 1 ไปสาขาสยาม, ชิ้นที่ 2 ไปสาขาลาดพร้าว

## 3. การสืบทอดข้อมูล (Data Inheritance)

เมื่อเปิด Modal รายละเอียดงาน (`openJobModal`):

| Field | Logic การดึงข้อมูล |
| :--- | :--- |
| **Type** | `specificJob.type` OR `jobInfo.jobType` |
| **Team** | `specificJob.team` OR `jobInfo.team` |
| **Date/Time** | `specificJob.dateTime` OR `jobInfo.appointmentDate` |
| **Location Name** | `specificJob.installLocationName` OR `jobInfo.installLocationName` |
| **Address** | `specificJob.address` OR `jobInfo.installAddress` |
| **Map Link** | `specificJob.googleMapLink` OR `jobInfo.googleMapLink` |

*หมายเหตุ: ระบบจะพยายามใช้ข้อมูลเฉพาะของสินค้านั้นก่อน (`specificJob`) ถ้าไม่มี จะไปดึงจาก Master Job (`jobInfo`) มาแสดง (Smart Merge)*

## 4. จุดสำคัญในโค้ด (Code Implementation)

ไฟล์: `components/OrderForm.jsx`

### 4.1 การตรวจสอบสิทธิ์การแก้ไข (Editable Check)

```javascript
// ในส่วน Render ของ Modal
const isJobEditable = jobInfo.jobType === 'separate_job';

// ถ้า !isJobEditable -> Input ทุกช่องจะถูก Disabled
<input disabled={!isJobEditable} ... />
```

### 4.2 การซิงค์ข้อมูล (Sync Logic)

```javascript
// useEffect เพื่อซิงค์ข้อมูลเมื่อ Master Job เปลี่ยน (เฉพาะกรณีไม่ใช่ Separate Job)
useEffect(() => {
    if (jobInfo.jobType !== 'separate_job') {
        setItems(prevItems => prevItems.map(item => ({
            ...item,
            specificJob: {
                type: jobInfo.jobType,
                team: jobInfo.team,
                // ... copy other fields from jobInfo
            }
        })))
    }
}, [jobInfo])
```

## 5. การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

* **ปัญหา:** เลือก "Job งานแยก" แล้วแต่ยังแก้ไขไม่ได้
  * **สาเหตุ:** ค่า `value` ใน `<option>` ไม่ตรงกับที่เช็คในโค้ด
  * **วิธีแก้:** ตรวจสอบว่า `<option value="separate_job">` และเงื่อนไข `jobInfo.jobType === 'separate_job'` ตรงกันทุกตัวอักษร (ระวัง underscore)

* **ปัญหา:** เปิด Modal แล้วข้อมูลว่างเปล่า ทั้งที่ Master Job มีข้อมูล
  * **สาเหตุ:** Logic การ Merge ข้อมูลผิดพลาด
  * **วิธีแก้:** ตรวจสอบฟังก์ชัน `openJobModal` ว่ามีการทำ Fallback ไปหา `jobInfo` หรือไม่
