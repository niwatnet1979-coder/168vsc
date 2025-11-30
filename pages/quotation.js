import Quotation from '../components/Quotation'
import Link from 'next/link'

const sampleQuotation = {
  company: {
    name: 'บริษัท 168 ไลท์ติ้ง แอนด์ เบดดิ้ง จำกัด',
    address: 'เลขที่ 168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
    taxId: '0135566027619',
    phone: '084-282-9465',
    email: 'LINE@: @interior-lighting',
    branch: 'สำนักงานใหญ่',
    vatRegistered: true
  },
  quotationNumber: 'Q-2025-0001',
  date: '29 พฤศจิกายน 2568',
  validUntil: '13 ธันวาคม 2568',
  // jobType: 'installation' = งานติดตั้ง (จ่ายคงค้างหน้างาน)
  // jobType: 'delivery' = สินค้าจัดส่ง (ชำระก่อนวันจัดส่ง)
  jobType: 'installation',
  customer: {
    // keep internal 'name' if needed elsewhere
    name: 'บริษัท ตัวอย่าง จำกัด',
    contact1: { name: 'นายสมชาย ใจดี', phone: '081-234-5678' },
    contact2: { name: 'นายสมศักดิ์ ใจดี', phone: '081-234-5677' },
    invoiceName: 'บริษัท ตัวอย่าง จำกัด',
    invoiceTaxId: '1234567890123',
    address: '123 ถนนสุขุมวิท คลองตัน เขตวัฒนา กรุงเทพมหานคร 10110'
  },
  installation: {
    appointmentDate: '05 ธันวาคม 2568',
    onsiteContacts: [
      { name: 'นายสมปอง หน้างาน', phone: '089-111-2222' },
      { name: 'นางสาวสมฤดี รับสินค้า', phone: '089-333-4444' }
    ]
  },
  qr: {
    image: '/qr.png',
    title: '168 อินทีเรีย ไลท์ติ้ง',
    account: 'ชื่อบัญชี: บจก. 168 ไลท์ติ้ง แอนด์ เบดดิ้ง',
    reference: 'KP S004KB000001952727'
  },
  items: [
    { description: 'โคมไฟเพดาน LED Model A - 12W', qty: 10, unitPrice: 450 },
    { description: 'โคมไฟติดผนัง LED Model B - 8W', qty: 5, unitPrice: 350 },
    { description: 'ค่าติดตั้ง (ต่อจุด)', qty: 15, unitPrice: 120 }
  ],
  terms: 'ระยะเวลาการส่งสินค้า 7-14 วันหลังวางมัดจำ 50%. การรับประกันสินค้า 1 ปีตามเงื่อนไขของผู้ผลิต. ราคานี้ยังไม่รวมค่าขนส่ง (ถ้ามี) เว้นแต่ระบุไว้เป็นอย่างอื่น.'
}

export default function QuotationPage() {
  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ background: 'white', padding: '20px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#718096', textDecoration: 'none', fontSize: '14px', display: 'inline-block' }}>
          ← กลับหน้าหลัก
        </Link>
      </div>
      <div style={{ padding: 24, fontFamily: 'Inter, system-ui, -apple-system' }}>
        <Quotation data={sampleQuotation} />
      </div>
    </div>
  )
}
