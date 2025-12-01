// Shared Mock Data for the entire application
// This file contains all mock data used across different pages

// Shop Coordinates (ร้าน 168VSC)
export const SHOP_LAT = 13.9647757
export const SHOP_LON = 100.6203268

// Mock Customers Data - Optimized for Testing
export const MOCK_CUSTOMERS_DATA = [
    {
        id: 1,
        name: 'บริษัท สยามพารากอน ดีเวลลอปเม้นท์ จำกัด',
        phone: '02-610-8000',
        email: 'contact@siamparagon.co.th',
        line: '@siamparagon',
        facebook: 'Siam Paragon',
        instagram: 'siamparagonshopping',
        mediaSource: 'Google',
        mediaSourceOther: '',
        contact1: { name: 'คุณสมชาย (จัดซื้อ)', phone: '081-111-1111' },
        contact2: { name: 'คุณวิภา (บัญชี)', phone: '082-222-2222' },
        lastOrder: '01/12/2023',
        taxInvoices: [
            {
                companyName: 'บริษัท สยามพารากอน ดีเวลลอปเม้นท์ จำกัด',
                taxId: '0105545098765',
                branch: 'สำนักงานใหญ่',
                address: '991 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330',
                phone: '02-610-8000',
                email: 'acc@siamparagon.co.th',
                deliveryAddress: '991 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330'
            },
            {
                companyName: 'บริษัท สยามพารากอน ดีเวลลอปเม้นท์ จำกัด',
                taxId: '0105545098765',
                branch: 'สาขาลาดกระบัง (คลังสินค้า)',
                address: '888 ถนนลาดกระบัง แขวงลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520',
                phone: '02-326-9999',
                email: 'warehouse@siamparagon.co.th',
                deliveryAddress: '888 ถนนลาดกระบัง แขวงลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520'
            }
        ],
        savedAddresses: [
            {
                name: 'ห้างสยามพารากอน (Loading Area)',
                address: '991 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330',
                mapLink: 'https://maps.google.com/?q=13.7462,100.5347',
                inspector1: 'คุณสมชาย',
                inspector1Phone: '081-111-1111',
                inspector2: 'รปภ. หัวหน้าชุด',
                inspector2Phone: '02-610-8888'
            },
            {
                name: 'คลังสินค้าลาดกระบัง',
                address: '888 ถนนลาดกระบัง แขวงลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520',
                mapLink: 'https://maps.google.com/?q=13.7228,100.7865',
                inspector1: 'คุณวิชัย (ผจก.คลัง)',
                inspector1Phone: '089-999-9999',
                inspector2: '-',
                inspector2Phone: '-'
            }
        ]
    },
    {
        id: 2,
        name: 'โรงพยาบาลศิริราช',
        phone: '02-419-7000',
        email: 'info@siriraj.com',
        line: '@siriraj',
        facebook: 'Siriraj Hospital',
        instagram: 'siriraj_official',
        mediaSource: 'Facebook',
        mediaSourceOther: '',
        contact1: { name: 'ดร.สมศักดิ์', phone: '083-333-3333' },
        contact2: { name: 'พยาบาลใจดี', phone: '084-444-4444' },
        lastOrder: '15/11/2023',
        taxInvoices: [
            {
                companyName: 'คณะแพทยศาสตร์ศิริราชพยาบาล',
                taxId: '0994000165897',
                branch: 'สำนักงานใหญ่',
                address: '2 ถนนวังหลัง แขวงศิริราช เขตบางกอกน้อย กรุงเทพมหานคร 10700',
                phone: '02-419-7000',
                email: 'finance@siriraj.com',
                deliveryAddress: '2 ถนนวังหลัง แขวงศิริราช เขตบางกอกน้อย กรุงเทพมหานคร 10700'
            },
            {
                companyName: 'ศูนย์การแพทย์กาญจนาภิเษก',
                taxId: '0994000165897',
                branch: 'สาขาศาลายา',
                address: '999 หมู่ 5 ถนนพุทธมณฑลสาย 4 ตำบลศาลายา อำเภอพุทธมณฑล นครปฐม 73170',
                phone: '02-849-6600',
                email: 'gj@siriraj.com',
                deliveryAddress: '999 หมู่ 5 ถนนพุทธมณฑลสาย 4 ตำบลศาลายา อำเภอพุทธมณฑล นครปฐม 73170'
            }
        ],
        savedAddresses: [
            {
                name: 'ตึกผู้ป่วยนอก (OPD)',
                address: '2 ถนนวังหลัง แขวงศิริราช เขตบางกอกน้อย กรุงเทพมหานคร 10700',
                mapLink: 'https://maps.google.com/?q=13.7593,100.4856',
                inspector1: 'คุณหมอสมศักดิ์',
                inspector1Phone: '083-333-3333',
                inspector2: 'ช่างประจำตึก',
                inspector2Phone: '02-419-7777'
            },
            {
                name: 'ศูนย์กาญจนาภิเษก (ศาลายา)',
                address: '999 หมู่ 5 ถนนพุทธมณฑลสาย 4 ตำบลศาลายา อำเภอพุทธมณฑล นครปฐม 73170',
                mapLink: 'https://maps.google.com/?q=13.7997,100.3205',
                inspector1: 'คุณอำนวย',
                inspector1Phone: '085-555-5555',
                inspector2: '-',
                inspector2Phone: '-'
            }
        ]
    },
    {
        id: 3,
        name: 'ร้านกาแฟ อเมซอน (แฟรนไชส์)',
        phone: '086-666-6666',
        email: 'amazon.franchise@gmail.com',
        line: 'cafeamazon_branch',
        facebook: '-',
        instagram: '-',
        mediaSource: 'เพื่อนแนะนำ',
        mediaSourceOther: '',
        contact1: { name: 'คุณเจ้าของร้าน', phone: '086-666-6666' },
        contact2: { name: 'ผู้จัดการร้าน', phone: '087-777-7777' },
        lastOrder: '20/11/2023',
        taxInvoices: [
            {
                companyName: 'นายรักกาแฟ สดชื่น',
                taxId: '1100500678901',
                branch: 'สำนักงานใหญ่ (บ้าน)',
                address: '55/88 หมู่บ้านพฤกษา ถนนรังสิต-นครนายก ปทุมธานี 12130',
                phone: '086-666-6666',
                email: 'owner@gmail.com',
                deliveryAddress: '55/88 หมู่บ้านพฤกษา ถนนรังสิต-นครนายก ปทุมธานี 12130'
            },
            {
                companyName: 'ร้านกาแฟ อเมซอน สาขาปั๊ม ปตท. วิภาวดี',
                taxId: '1100500678901',
                branch: 'สาขา 001',
                address: '123 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
                phone: '02-555-5555',
                email: 'shop@gmail.com',
                deliveryAddress: '123 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900'
            }
        ],
        savedAddresses: [
            {
                name: 'สาขา ปตท. วิภาวดี',
                address: '123 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
                mapLink: 'https://maps.google.com/?q=13.8143,100.5608',
                inspector1: 'ผู้จัดการร้าน',
                inspector1Phone: '087-777-7777',
                inspector2: '-',
                inspector2Phone: '-'
            },
            {
                name: 'สาขา ปตท. เกษตร-นวมินทร์',
                address: '456 ถนนประเสริฐมนูกิจ แขวงนวมินทร์ เขตบึงกุ่ม กรุงเทพมหานคร 10240',
                mapLink: 'https://maps.google.com/?q=13.8268,100.6278',
                inspector1: 'หัวหน้าบาริสต้า',
                inspector1Phone: '088-888-8888',
                inspector2: '-',
                inspector2Phone: '-'
            }
        ]
    }
]

// Mock Products Data
export const MOCK_PRODUCTS_DATA = [
    {
        id: 'CAM-001',
        name: 'กล้องวงจรปิด HD',
        type: 'กล้องวงจรปิด',
        length: '10', width: '10', height: '15',
        material: 'พลาสติก', color: 'ขาว', crystalColor: '-',
        bulbType: '-', light: 'Infrared', remote: 'App',
        price: 3500,
        description: 'ความละเอียด 1080p, กันน้ำ'
    },
    {
        id: 'LED-BULB-09',
        name: 'หลอดไฟ LED 9W',
        type: 'หลอดไฟ',
        length: '6', width: '6', height: '12',
        material: 'แก้ว/พลาสติก', color: 'ขาว', crystalColor: '-',
        bulbType: 'E27', light: 'Daylight', remote: '-',
        price: 150,
        description: 'แสง Daylight, ขั้ว E27'
    },
    {
        id: 'CHAN-001',
        name: 'โคมไฟระย้าคริสตัล',
        type: 'โคมไฟตกแต่ง',
        length: '80', width: '80', height: '120',
        material: 'คริสตัล/โลหะ', color: 'ทอง', crystalColor: 'ใส',
        bulbType: 'E14', light: 'Warm White', remote: 'มี',
        price: 15000,
        description: 'ขนาด 80cm, สีทอง'
    },
    {
        id: 'TRACK-BK',
        name: 'รางไฟ Track Light 1m',
        type: 'อุปกรณ์ติดตั้ง',
        length: '100', width: '4', height: '2',
        material: 'อลูมิเนียม', color: 'ดำ', crystalColor: '-',
        bulbType: '-', light: '-', remote: '-',
        price: 450,
        description: 'รางไฟสีดำ ยาว 1 เมตร'
    },
    {
        id: 'SPOT-WH',
        name: 'ดาวน์ไลท์ LED 7W',
        type: 'ดาวน์ไลท์',
        length: '9', width: '9', height: '5',
        material: 'อลูมิเนียม', color: 'ขาว', crystalColor: '-',
        bulbType: 'LED 7W', light: 'Day Light', remote: '-',
        price: 180,
        description: '7W, Day Light, สีขาว'
    },
    {
        id: 'LED-STRIP',
        name: 'ไฟ LED เส้น RGB',
        type: 'ไฟตกแต่ง',
        length: '500', width: '1', height: '0.2',
        material: 'PCB', color: 'ขาว', crystalColor: '-',
        bulbType: 'LED', light: 'RGB', remote: 'มี',
        price: 850,
        description: 'ม้วนละ 5 เมตร, พร้อมรีโมท'
    }
]
