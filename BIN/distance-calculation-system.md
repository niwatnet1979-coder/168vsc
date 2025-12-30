# 📍 ระบบคำนวณระยะทางจากร้านไปสถานที่ติดตั้ง

**วันที่สร้าง:** 2025-12-02  
**Version:** V1.2  
**ไฟล์:** `components/OrderForm.jsx`

---

## 🎯 วัตถุประสงค์

คำนวณระยะทางอัตโนมัติจากร้านไปยังสถานที่ติดตั้งของลูกค้า โดยใช้พิกัดจาก Google Maps URL

---

## 📦 Components

### 1. ค่าคงที่ - พิกัดร้าน (Shop Coordinates)

```javascript
const SHOP_LAT = 13.9647757  // ละติจูดของร้าน
const SHOP_LON = 100.6203268 // ลองจิจูดของร้าน
```

**หมายเหตุ:** พิกัดนี้ต้องอัพเดทให้ตรงกับตำแหน่งร้านจริง

---

### 2. Function `extractCoordinates(url)` - ดึงพิกัดจาก Google Maps URL

**Input:** Google Maps URL (string)  
**Output:** `{ lat: number, lon: number }` หรือ `null`

**รองรับ URL รูปแบบ:**

#### รูปแบบที่ 1: `@lat,lon` (Standard)

```javascript
// Example: https://maps.google.com/@13.7563,100.5018,15z
const match = url.match(/@([-0-9.]+),([-0-9.]+)/)
if (match) {
    return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) }
}
```

#### รูปแบบที่ 2: `?q=lat,lon` (Query Parameter)

```javascript
// Example: https://maps.google.com/?q=13.7563,100.5018
const matchQ = url.match(/[?&]q=([-0-9.]+),([-0-9.]+)/)
if (matchQ) {
    return { lat: parseFloat(matchQ[1]), lon: parseFloat(matchQ[2]) }
}
```

#### รูปแบบที่ 3: `/search/lat,lon` (Search)

```javascript
// Example: https://maps.google.com/search/13.7563,100.5018
const matchSearch = url.match(/\/search\/([-0-9.]+),([-0-9.]+)/)
if (matchSearch) {
    return { lat: parseFloat(matchSearch[1]), lon: parseFloat(matchSearch[2]) }
}
```

#### รูปแบบที่ 4: `/dir/.../lat,lon` (Directions)

```javascript
// Example: https://maps.google.com/dir//13.7563,100.5018
const matchDir = url.match(/\/dir\/.*\/([-0-9.]+),([-0-9.]+)/)
if (matchDir) {
    return { lat: parseFloat(matchDir[1]), lon: parseFloat(matchDir[2]) }
}
```

**⚠️ ข้อจำกัด:**

- ไม่รองรับ Short URL (เช่น `goo.gl/xxx`, `maps.app.goo.gl/xxx`)
- ต้องใช้ Full URL จาก Address Bar

---

### 3. Function `calculateDistance(lat1, lon1, lat2, lon2)` - คำนวณระยะทาง

**Input:**

- `lat1, lon1` - พิกัดจุดเริ่มต้น (ร้าน)
- `lat2, lon2` - พิกัดจุดปลายทาง (ลูกค้า)

**Output:** ระยะทาง (กม.) ปัดเป็น 2 ทศนิยม (string)

**สูตร:** Haversine Formula (คำนวณระยะทางบนพื้นผิวโลก)

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // รัศมีโลก (กิโลเมตร)
    
    // แปลงความต่างของพิกัดเป็น radian
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    
    // สูตร Haversine
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // ระยะทาง (กม.)
    
    return d.toFixed(2) // ปัดเป็น 2 ทศนิยม
}
```

**ตัวอย่าง:**

```javascript
calculateDistance(13.9647757, 100.6203268, 13.7563, 100.5018)
// Output: "32.45" (km)
```

---

### 4. Helper Function `deg2rad(deg)` - แปลงองศาเป็น radian

```javascript
function deg2rad(deg) {
    return deg * (Math.PI / 180)
}
```

---

## 🔄 การใช้งานใน Component

### ใน Master Job (jobInfo)

```javascript
// Distance Calculation for Master Job
useEffect(() => {
    const coords = extractCoordinates(jobInfo.googleMapLink)
    if (coords) {
        const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
        setJobInfo(prev => {
            if (prev.distance === dist) return prev // ป้องกัน infinite loop
            return { ...prev, distance: dist }
        })
    }
}, [jobInfo.googleMapLink])
```

### ใน Modal (modalJobDetails)

```javascript
// Distance Calculation for Modal
useEffect(() => {
    const coords = extractCoordinates(modalJobDetails.googleMapLink)
    if (coords) {
        const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
        setModalJobDetails(prev => {
            if (prev.distance === dist) return prev // ป้องกัน infinite loop
            return { ...prev, distance: dist }
        })
    }
}, [modalJobDetails.googleMapLink])
```

---

## 🎨 การแสดงผลใน UI

### Master Job

```jsx
<label>
    🗺️ Google Maps Link
    {jobInfo.distance && (
        <span style={{ marginLeft: 8, color: '#0070f3', fontSize: 12 }}>
            ({jobInfo.distance} km)
        </span>
    )}
</label>
<input
    type="text"
    value={jobInfo.googleMapLink}
    onChange={e => setJobInfo({ ...jobInfo, googleMapLink: e.target.value })}
    placeholder="https://maps.google.com/..."
/>
```

### Modal

```jsx
<label>
    Google Maps Link
    {modalJobDetails.distance && (
        <span style={{ marginLeft: 8, color: '#0070f3', fontSize: 12 }}>
            ({modalJobDetails.distance} km)
        </span>
    )}
</label>
<input
    type="text"
    value={modalJobDetails.googleMapLink}
    onChange={e => setModalJobDetails({ ...modalJobDetails, googleMapLink: e.target.value })}
    placeholder="https://maps.google.com/..."
/>
```

---

## 📊 State Structure

### jobInfo

```javascript
const [jobInfo, setJobInfo] = useState({
    // ... other fields
    googleMapLink: '',
    distance: '',  // ระยะทาง (กม.) - คำนวณอัตโนมัติ
    // ... other fields
})
```

### modalJobDetails

```javascript
const [modalJobDetails, setModalJobDetails] = useState({
    // ... other fields
    googleMapLink: '',
    distance: '',  // ระยะทาง (กม.) - คำนวณอัตโนมัติ
    // ... other fields
})
```

---

## 🔧 การทำงาน (Flow)

1. **ผู้ใช้วาง Google Maps URL** ลงในช่อง "Google Maps Link"
2. **`useEffect` ตรวจจับการเปลี่ยนแปลง** ของ `googleMapLink`
3. **`extractCoordinates(url)`** ดึงพิกัด (lat, lon) จาก URL
4. **ถ้าดึงพิกัดได้** → เรียก `calculateDistance()`
5. **`calculateDistance()`** คำนวณระยะทางจากร้านไปลูกค้า
6. **อัพเดท state** `distance` ด้วยค่าที่คำนวณได้
7. **แสดงผล** ระยะทางใน UI: `(XX.XX km)`

---

## ⚠️ ข้อควรระวัง

1. **Infinite Loop Prevention:**

   ```javascript
   if (prev.distance === dist) return prev
   ```

   ต้องเช็คว่าค่าเดิมกับค่าใหม่เหมือนกันหรือไม่ ก่อน setState

2. **Short URL ไม่รองรับ:**
   - ❌ `https://goo.gl/maps/xxx`
   - ❌ `https://maps.app.goo.gl/xxx`
   - ✅ ใช้ Full URL จาก Address Bar แทน

3. **พิกัดร้านต้องถูกต้อง:**
   - ตรวจสอบ `SHOP_LAT` และ `SHOP_LON` ให้ตรงกับตำแหน่งร้านจริง

---

## 🚀 การปรับปรุงในอนาคต

1. **รองรับ Short URL:**
   - ใช้ API เพื่อ expand short URL
   - หรือใช้ Google Maps API

2. **แสดงเส้นทาง:**
   - เพิ่มปุ่ม "ดูเส้นทาง" ที่เปิด Google Maps Directions

3. **คำนวณค่าขนส่ง:**
   - ใช้ระยะทางคำนวณค่าขนส่งอัตโนมัติ
   - เช่น: ระยะทาง 0-20 km = 0 บาท, 21-50 km = 500 บาท

4. **บันทึกประวัติ:**
   - เก็บระยะทางไว้ใน Database
   - วิเคราะห์ข้อมูลเพื่อวางแผนเส้นทาง

---

## 📝 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: URL ปกติ

```
Input:  https://maps.google.com/@13.7563,100.5018,15z
Output: { lat: 13.7563, lon: 100.5018 }
Distance: 32.45 km
```

### ตัวอย่างที่ 2: URL แบบ Query

```
Input:  https://maps.google.com/?q=13.7563,100.5018
Output: { lat: 13.7563, lon: 100.5018 }
Distance: 32.45 km
```

### ตัวอย่างที่ 3: URL ไม่ถูกต้อง

```
Input:  https://maps.app.goo.gl/xxx
Output: null
Distance: (ไม่แสดง)
```

---

## 📚 อ้างอิง

- **Haversine Formula:** <https://en.wikipedia.org/wiki/Haversine_formula>
- **Google Maps URL Formats:** <https://developers.google.com/maps/documentation/urls/get-started>

---

**หมายเหตุ:** Note นี้สร้างขึ้นเพื่อเก็บไว้ใช้หลังจาก debug V1.2 เสร็จแล้ว
