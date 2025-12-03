// Shared Mock Data for the entire application
// Shop Coordinates (ร้าน 168VSC)
export const SHOP_LAT = 13.9647757
export const SHOP_LON = 100.6203268

// Mock Customers Data - Complete with granular address fields
export const MOCK_CUSTOMERS_DATA = [
    {
        id: 1,
        name: 'บริษัท แสนสิริ จำกัด (มหาชน)',
        phone: '02-201-3905',
        email: 'cs@sansiri.com',
        line: '@sansiriplc',
        facebook: 'Sansiri PLC',
        instagram: 'sansiriplc',
        mediaSource: 'Google',
        mediaSourceOther: '',
        contact1: { name: 'คุณนภัทร (จัดซื้อ)', phone: '081-234-5678' },
        contact2: { name: 'คุณวิภา (บัญชี)', phone: '089-876-5432' },
        lastOrder: '01/12/2023',
        taxInvoices: [
            {
                companyName: 'บริษัท แสนสิริ จำกัด (มหาชน)',
                taxId: '0107538000665',
                branch: 'สำนักงานใหญ่',
                addrNumber: '59', addrMoo: '', addrVillage: '', addrSoi: 'ริมคลองพระโขนง', addrRoad: '',
                addrTambon: 'พระโขนงเหนือ', addrAmphoe: 'วัฒนา', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10110',
                address: '59 ซอยริมคลองพระโขนง แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร 10110',
                phone: '02-201-3905',
                email: 'acc@sansiri.com',
                deliveryAddrNumber: '59', deliveryAddrMoo: '', deliveryAddrVillage: '', deliveryAddrSoi: 'ริมคลองพระโขนง', deliveryAddrRoad: '',
                deliveryAddrTambon: 'พระโขนงเหนือ', deliveryAddrAmphoe: 'วัฒนา', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10110',
                deliveryAddress: '59 ซอยริมคลองพระโขนง แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร 10110'
            }
        ],
        addresses: [
            {
                label: 'สำนักงานใหญ่ (สิริภิญโญ)',
                addrNumber: '475', addrMoo: '', addrVillage: 'อาคารสิริภิญโญ', addrSoi: '', addrRoad: 'ศรีอยุธยา',
                addrTambon: 'ถนนพญาไท', addrAmphoe: 'ราชเทวี', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10400',
                address: '475 อาคารสิริภิญโญ ถนนศรีอยุธยา แขวงถนนพญาไท เขตราชเทวี กรุงเทพมหานคร 10400',
                googleMapsLink: 'https://maps.google.com/?q=13.7563,100.5342',
                distance: 15.5,
                inspector1: { name: 'คุณสมชาย (รปภ)', phone: '02-201-3000' },
                inspector2: { name: 'คุณวิชัย (ช่างอาคาร)', phone: '081-111-2222' }
            },
            {
                label: 'โครงการเศรษฐสิริ ดอนเมือง',
                addrNumber: '99', addrMoo: '5', addrVillage: '', addrSoi: '', addrRoad: 'เชิดวุฒากาศ',
                addrTambon: 'สีกัน', addrAmphoe: 'ดอนเมือง', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10210',
                address: '99 หมู่ 5 ถนนเชิดวุฒากาศ แขวงสีกัน เขตดอนเมือง กรุงเทพมหานคร 10210',
                googleMapsLink: 'https://maps.google.com/?q=13.9215,100.5987',
                distance: 8.2,
                inspector1: { name: 'คุณนที (PM)', phone: '089-999-8888' },
                inspector2: { name: 'คุณกานต์ (โฟร์แมน)', phone: '087-777-6666' }
            },
            {
                label: 'โครงการบุราสิริ วัชรพล',
                addrNumber: '123', addrMoo: '2', addrVillage: '', addrSoi: '', addrRoad: 'สุขาภิบาล 5',
                addrTambon: 'ออเงิน', addrAmphoe: 'สายไหม', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10220',
                address: '123 หมู่ 2 ถนนสุขาภิบาล 5 แขวงออเงิน เขตสายไหม กรุงเทพมหานคร 10220',
                googleMapsLink: 'https://maps.google.com/?q=13.8954,100.6752',
                distance: 12.0,
                inspector1: { name: 'คุณเอก (PM)', phone: '086-555-4444' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 2,
        name: 'โรงแรม แมนดาริน โอเรียนเต็ล',
        phone: '02-659-9000',
        email: 'mobkk@mohg.com',
        line: '@mo_bangkok',
        facebook: 'Mandarin Oriental Bangkok',
        instagram: 'mo_bangkok',
        mediaSource: 'Facebook',
        mediaSourceOther: '',
        contact1: { name: 'คุณจิรดา (จัดซื้อ)', phone: '082-333-4444' },
        contact2: { name: 'Mr. Michael (GM)', phone: '02-659-9001' },
        lastOrder: '15/11/2023',
        taxInvoices: [
            {
                companyName: 'บริษัท โอเรียนเต็ล โฮเต็ล (ประเทศไทย) จำกัด (มหาชน)',
                taxId: '0107537000211',
                branch: 'สำนักงานใหญ่',
                addrNumber: '48', addrMoo: '', addrVillage: '', addrSoi: 'โอเรียนเต็ล อเวนิว', addrRoad: 'เจริญกรุง',
                addrTambon: 'บางรัก', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '48 ซอยโอเรียนเต็ล อเวนิว ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
                phone: '02-659-9000',
                email: 'acc@mohg.com',
                deliveryAddrNumber: '48', deliveryAddrMoo: '', deliveryAddrVillage: '', addrSoi: 'โอเรียนเต็ล อเวนิว', deliveryAddrRoad: 'เจริญกรุง',
                deliveryAddrTambon: 'บางรัก', deliveryAddrAmphoe: 'บางรัก', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10500',
                deliveryAddress: '48 ซอยโอเรียนเต็ล อเวนิว ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500'
            }
        ],
        addresses: [
            {
                label: 'Lobby (Loading Area)',
                addrNumber: '48', addrMoo: '', addrVillage: '', addrSoi: 'โอเรียนเต็ล อเวนิว', addrRoad: 'เจริญกรุง',
                addrTambon: 'บางรัก', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '48 ซอยโอเรียนเต็ล อเวนิว ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
                googleMapsLink: 'https://maps.google.com/?q=13.7234,100.5141',
                distance: 25.0,
                inspector1: { name: 'คุณประเสริฐ (หัวหน้าช่าง)', phone: '081-987-6543' },
                inspector2: { name: 'คุณสมศักดิ์ (รปภ)', phone: '02-659-9000' }
            },
            {
                label: 'Author\'s Lounge',
                addrNumber: '48', addrMoo: '', addrVillage: '', addrSoi: 'โอเรียนเต็ล อเวนิว', addrRoad: 'เจริญกรุง',
                addrTambon: 'บางรัก', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '48 ซอยโอเรียนเต็ล อเวนิว ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
                googleMapsLink: 'https://maps.google.com/?q=13.7234,100.5141',
                distance: 25.0,
                inspector1: { name: 'คุณแอนนา (ผู้จัดการห้องอาหาร)', phone: '085-222-3333' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 3,
        name: 'คุณธนินท์ เจียรวนนท์',
        phone: '081-888-9999',
        email: 'tanin.c@gmail.com',
        line: '',
        facebook: '',
        instagram: '',
        mediaSource: 'เพื่อนแนะนำ',
        mediaSourceOther: '',
        contact1: { name: 'คุณเลขา (ส่วนตัว)', phone: '081-888-9999' },
        contact2: { name: 'แม่บ้านใหญ่', phone: '089-777-6666' },
        lastOrder: '20/11/2023',
        taxInvoices: [
            {
                companyName: 'นายธนินท์ เจียรวนนท์',
                taxId: '3100500678901',
                branch: 'สำนักงานใหญ่',
                addrNumber: '123', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'วิภาวดีรังสิต',
                addrTambon: 'จอมพล', addrAmphoe: 'จตุจักร', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10900',
                address: '123 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
                phone: '02-555-5555',
                email: '',
                deliveryAddrNumber: '123', deliveryAddrMoo: '', deliveryAddrVillage: '', deliveryAddrSoi: '', deliveryAddrRoad: 'วิภาวดีรังสิต',
                deliveryAddrTambon: 'จอมพล', deliveryAddrAmphoe: 'จตุจักร', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10900',
                deliveryAddress: '123 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900'
            }
        ],
        addresses: [
            {
                label: 'บ้านพักตากอากาศ (เขาใหญ่)',
                addrNumber: '99', addrMoo: '9', addrVillage: '', addrSoi: '', addrRoad: 'ธนะรัชต์',
                addrTambon: 'หมูสี', addrAmphoe: 'ปากช่อง', addrProvince: 'นครราชสีมา', addrZipcode: '30130',
                address: '99 หมู่ 9 ถนนธนะรัชต์ ตำบลหมูสี อำเภอปากช่อง นครราชสีมา 30130',
                googleMapsLink: 'https://maps.google.com/?q=14.5321,101.3456',
                distance: 150.0,
                inspector1: { name: 'คุณสมหมาย (ผู้ดูแลบ้าน)', phone: '081-234-5678' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'คฤหาสน์ (กรุงเทพ)',
                addrNumber: '123', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'วิภาวดีรังสิต',
                addrTambon: 'จอมพล', addrAmphoe: 'จตุจักร', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10900',
                address: '123 ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
                googleMapsLink: 'https://maps.google.com/?q=13.8143,100.5608',
                distance: 10.0,
                inspector1: { name: 'หัวหน้า รปภ.', phone: '02-555-5555' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 4,
        name: 'บริษัท ปตท. น้ำมันและการค้าปลีก จำกัด (มหาชน)',
        phone: '1365',
        email: 'contact@pttor.com',
        line: '@pttor',
        facebook: 'OR Official',
        instagram: 'pttor_official',
        mediaSource: 'Google',
        mediaSourceOther: '',
        contact1: { name: 'คุณสมชาย (วิศวกร)', phone: '081-444-5555' },
        contact2: { name: 'คุณสมหญิง (จัดซื้อ)', phone: '086-666-7777' },
        lastOrder: '25/11/2023',
        taxInvoices: [
            {
                companyName: 'บริษัท ปตท. น้ำมันและการค้าปลีก จำกัด (มหาชน)',
                taxId: '0107561000019',
                branch: 'สำนักงานใหญ่',
                addrNumber: '555/2', addrMoo: '', addrVillage: 'ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 12', addrSoi: '', addrRoad: 'วิภาวดีรังสิต',
                addrTambon: 'จตุจักร', addrAmphoe: 'จตุจักร', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10900',
                address: '555/2 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 12 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
                phone: '02-196-5959',
                email: 'acc@pttor.com',
                deliveryAddrNumber: '555/2', deliveryAddrMoo: '', deliveryAddrVillage: 'ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 12', deliveryAddrSoi: '', deliveryAddrRoad: 'วิภาวดีรังสิต',
                deliveryAddrTambon: 'จตุจักร', deliveryAddrAmphoe: 'จตุจักร', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10900',
                deliveryAddress: '555/2 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 12 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900'
            }
        ],
        addresses: [
            {
                label: 'Café Amazon (สาขา EnCo)',
                addrNumber: '555/2', addrMoo: '', addrVillage: 'ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 1', addrSoi: '', addrRoad: 'วิภาวดีรังสิต',
                addrTambon: 'จตุจักร', addrAmphoe: 'จตุจักร', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10900',
                address: '555/2 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 1 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
                googleMapsLink: 'https://maps.google.com/?q=13.8195,100.5562',
                distance: 11.0,
                inspector1: { name: 'คุณวิชัย (ผจก.ร้าน)', phone: '089-111-2222' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'PTT Station (สาขาวิภาวดี 62)',
                addrNumber: '789', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'วิภาวดีรังสิต',
                addrTambon: 'ตลาดบางเขน', addrAmphoe: 'หลักสี่', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10210',
                address: '789 ถนนวิภาวดีรังสิต แขวงตลาดบางเขน เขตหลักสี่ กรุงเทพมหานคร 10210',
                googleMapsLink: 'https://maps.google.com/?q=13.8734,100.5891',
                distance: 14.5,
                inspector1: { name: 'คุณสมศักดิ์ (ผจก.ปั๊ม)', phone: '087-333-4444' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 5,
        name: 'โรงพยาบาลกรุงเทพ',
        phone: '1719',
        email: 'info@bangkokhospital.com',
        line: '@bangkokhospital',
        facebook: 'Bangkok Hospital',
        instagram: 'bangkok_hospital',
        mediaSource: 'Website',
        mediaSourceOther: '',
        contact1: { name: 'คุณหมอประเสริฐ', phone: '081-999-0000' },
        contact2: { name: 'คุณพยาบาลวิไล', phone: '082-888-1111' },
        lastOrder: '28/11/2023',
        taxInvoices: [
            {
                companyName: 'บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน)',
                taxId: '0107537000025',
                branch: 'สำนักงานใหญ่',
                addrNumber: '2', addrMoo: '', addrVillage: '', addrSoi: 'ศูนย์วิจัย 7', addrRoad: 'เพชรบุรีตัดใหม่',
                addrTambon: 'บางกะปิ', addrAmphoe: 'ห้วยขวาง', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10310',
                address: '2 ซอยศูนย์วิจัย 7 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310',
                phone: '02-310-3000',
                email: 'acc@bangkokhospital.com',
                deliveryAddrNumber: '2', deliveryAddrMoo: '', deliveryAddrVillage: '', deliveryAddrSoi: 'ศูนย์วิจัย 7', deliveryAddrRoad: 'เพชรบุรีตัดใหม่',
                deliveryAddrTambon: 'บางกะปิ', deliveryAddrAmphoe: 'ห้วยขวาง', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10310',
                deliveryAddress: '2 ซอยศูนย์วิจัย 7 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310'
            }
        ],
        addresses: [
            {
                label: 'อาคาร D (แผนกฉุกเฉิน)',
                addrNumber: '2', addrMoo: '', addrVillage: '', addrSoi: 'ศูนย์วิจัย 7', addrRoad: 'เพชรบุรีตัดใหม่',
                addrTambon: 'บางกะปิ', addrAmphoe: 'ห้วยขวาง', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10310',
                address: '2 ซอยศูนย์วิจัย 7 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310',
                googleMapsLink: 'https://maps.google.com/?q=13.7495,100.5832',
                distance: 18.0,
                inspector1: { name: 'หัวหน้าเวรเปล', phone: '02-310-3100' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'อาคาร R (Rehabilitation)',
                addrNumber: '2', addrMoo: '', addrVillage: '', addrSoi: 'ศูนย์วิจัย 7', addrRoad: 'เพชรบุรีตัดใหม่',
                addrTambon: 'บางกะปิ', addrAmphoe: 'ห้วยขวาง', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10310',
                address: '2 ซอยศูนย์วิจัย 7 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310',
                googleMapsLink: 'https://maps.google.com/?q=13.7495,100.5832',
                distance: 18.0,
                inspector1: { name: 'คุณสมศรี (กายภาพ)', phone: '089-777-8888' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 6,
        name: 'ร้านอาหาร เจ๊ไฝ (Michelin Star)',
        phone: '02-223-9384',
        email: 'jayfaibkk@gmail.com',
        line: '',
        facebook: 'Jay Fai',
        instagram: 'jayfaibangkok',
        mediaSource: 'Instagram',
        mediaSourceOther: '',
        contact1: { name: 'เจ๊ไฝ', phone: '081-111-2222' },
        contact2: { name: 'ลูกสาวเจ๊ไฝ', phone: '089-333-4444' },
        lastOrder: '30/11/2023',
        taxInvoices: [
            {
                companyName: 'นางสุภิญญา จันสุตะ',
                taxId: '3100900123456',
                branch: 'สำนักงานใหญ่',
                addrNumber: '327', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'มหาไชย',
                addrTambon: 'สำราญราษฎร์', addrAmphoe: 'พระนคร', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10200',
                address: '327 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพมหานคร 10200',
                phone: '02-223-9384',
                email: '',
                deliveryAddrNumber: '327', deliveryAddrMoo: '', deliveryAddrVillage: '', deliveryAddrSoi: '', deliveryAddrRoad: 'มหาไชย',
                deliveryAddrTambon: 'สำราญราษฎร์', deliveryAddrAmphoe: 'พระนคร', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10200',
                deliveryAddress: '327 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพมหานคร 10200'
            }
        ],
        addresses: [
            {
                label: 'ร้านเจ๊ไฝ (ประตูผี)',
                addrNumber: '327', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'มหาไชย',
                addrTambon: 'สำราญราษฎร์', addrAmphoe: 'พระนคร', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10200',
                address: '327 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพมหานคร 10200',
                googleMapsLink: 'https://maps.google.com/?q=13.7526,100.5048',
                distance: 22.0,
                inspector1: { name: 'เจ๊ไฝ', phone: '081-111-2222' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'บ้านพัก (พุทธมณฑล)',
                addrNumber: '99/9', addrMoo: '2', addrVillage: '', addrSoi: '', addrRoad: 'พุทธมณฑลสาย 2',
                addrTambon: 'ศาลาธรรมสพน์', addrAmphoe: 'ทวีวัฒนา', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10170',
                address: '99/9 หมู่ 2 ถนนพุทธมณฑลสาย 2 แขวงศาลาธรรมสพน์ เขตทวีวัฒนา กรุงเทพมหานคร 10170',
                googleMapsLink: 'https://maps.google.com/?q=13.7890,100.3890',
                distance: 35.0,
                inspector1: { name: 'แม่บ้าน', phone: '086-666-7777' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 7,
        name: 'บริษัท เอสซีจี แพคเกจจิ้ง จำกัด (มหาชน)',
        phone: '02-586-3333',
        email: 'contact@scgpackaging.com',
        line: '@scgpackaging',
        facebook: 'SCG Packaging',
        instagram: 'scgpackaging',
        mediaSource: 'LinkedIn',
        mediaSourceOther: '',
        contact1: { name: 'คุณวิศิษฐ์ (โรงงาน)', phone: '081-555-6666' },
        contact2: { name: 'คุณนารี (จัดซื้อ)', phone: '089-444-3333' },
        lastOrder: '02/12/2023',
        taxInvoices: [
            {
                companyName: 'บริษัท เอสซีจี แพคเกจจิ้ง จำกัด (มหาชน)',
                taxId: '0107562000106',
                branch: 'สำนักงานใหญ่',
                addrNumber: '1', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'ปูนซิเมนต์ไทย',
                addrTambon: 'บางซื่อ', addrAmphoe: 'บางซื่อ', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10800',
                address: '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800',
                phone: '02-586-3333',
                email: 'acc@scg.com',
                deliveryAddrNumber: '1', deliveryAddrMoo: '', deliveryAddrVillage: '', deliveryAddrSoi: '', deliveryAddrRoad: 'ปูนซิเมนต์ไทย',
                deliveryAddrTambon: 'บางซื่อ', deliveryAddrAmphoe: 'บางซื่อ', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10800',
                deliveryAddress: '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800'
            }
        ],
        addresses: [
            {
                label: 'SCG สำนักงานใหญ่ (บางซื่อ)',
                addrNumber: '1', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'ปูนซิเมนต์ไทย',
                addrTambon: 'บางซื่อ', addrAmphoe: 'บางซื่อ', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10800',
                address: '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800',
                googleMapsLink: 'https://maps.google.com/?q=13.8056,100.5376',
                distance: 16.0,
                inspector1: { name: 'คุณสมชาย (รปภ. ประตู 1)', phone: '02-586-1111' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'โรงงานนวนคร',
                addrNumber: '101/10', addrMoo: '20', addrVillage: 'นิคมอุตสาหกรรมนวนคร', addrSoi: '', addrRoad: 'พหลโยธิน',
                addrTambon: 'คลองหนึ่ง', addrAmphoe: 'คลองหลวง', addrProvince: 'ปทุมธานี', addrZipcode: '12120',
                address: '101/10 หมู่ 20 นิคมอุตสาหกรรมนวนคร ถนนพหลโยธิน ตำบลคลองหนึ่ง อำเภอคลองหลวง ปทุมธานี 12120',
                googleMapsLink: 'https://maps.google.com/?q=14.1234,100.6123',
                distance: 45.0,
                inspector1: { name: 'คุณวิชัย (ผจก.โรงงาน)', phone: '081-999-8888' },
                inspector2: { name: 'คุณสมศักดิ์ (Safety)', phone: '087-666-5555' }
            },
            {
                label: 'โรงงานบ้านโป่ง',
                addrNumber: '19', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'แสงชูโต',
                addrTambon: 'ท่าผา', addrAmphoe: 'บ้านโป่ง', addrProvince: 'ราชบุรี', addrZipcode: '70110',
                address: '19 ถนนแสงชูโต ตำบลท่าผา อำเภอบ้านโป่ง ราชบุรี 70110',
                googleMapsLink: 'https://maps.google.com/?q=13.8123,99.8765',
                distance: 85.0,
                inspector1: { name: 'คุณอำนวย', phone: '086-444-3333' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 8,
        name: 'โรงเรียนนานาชาติ ISB',
        phone: '02-963-5800',
        email: 'admissions@isb.ac.th',
        line: '@isbthailand',
        facebook: 'International School Bangkok',
        instagram: 'isbthailand',
        mediaSource: 'Google',
        mediaSourceOther: '',
        contact1: { name: 'Mr. John Smith (Headmaster)', phone: '081-123-4567' },
        contact2: { name: 'คุณสมศรี (ธุรการ)', phone: '089-987-6543' },
        lastOrder: '05/11/2023',
        taxInvoices: [
            {
                companyName: 'International School Bangkok',
                taxId: '0994000123456',
                branch: 'Head Office',
                addrNumber: '39/7', addrMoo: '', addrVillage: 'Nichada Thani', addrSoi: 'Nichada Thani', addrRoad: 'Samakee',
                addrTambon: 'Pakkret', addrAmphoe: 'Pakkret', addrProvince: 'Nonthaburi', addrZipcode: '11120',
                address: '39/7 Soi Nichada Thani, Samakee Road, Pakkret, Nonthaburi 11120',
                phone: '02-963-5800',
                email: 'finance@isb.ac.th',
                deliveryAddrNumber: '39/7', deliveryAddrMoo: '', deliveryAddrVillage: 'Nichada Thani', deliveryAddrSoi: 'Nichada Thani', deliveryAddrRoad: 'Samakee',
                deliveryAddrTambon: 'Pakkret', deliveryAddrAmphoe: 'Pakkret', deliveryAddrProvince: 'Nonthaburi', deliveryAddrZipcode: '11120',
                deliveryAddress: '39/7 Soi Nichada Thani, Samakee Road, Pakkret, Nonthaburi 11120'
            }
        ],
        addresses: [
            {
                label: 'Main Campus (Nichada Thani)',
                addrNumber: '39/7', addrMoo: '', addrVillage: 'Nichada Thani', addrSoi: 'Nichada Thani', addrRoad: 'Samakee',
                addrTambon: 'Pakkret', addrAmphoe: 'Pakkret', addrProvince: 'Nonthaburi', addrZipcode: '11120',
                address: '39/7 Soi Nichada Thani, Samakee Road, Pakkret, Nonthaburi 11120',
                googleMapsLink: 'https://maps.google.com/?q=13.8890,100.5280',
                distance: 28.0,
                inspector1: { name: 'Security Guard', phone: '02-963-5800' },
                inspector2: { name: 'Maintenance Manager', phone: '081-555-4444' }
            },
            {
                label: 'Sports Complex',
                addrNumber: '39/7', addrMoo: '', addrVillage: 'Nichada Thani', addrSoi: 'Nichada Thani', addrRoad: 'Samakee',
                addrTambon: 'Pakkret', addrAmphoe: 'Pakkret', addrProvince: 'Nonthaburi', addrZipcode: '11120',
                address: '39/7 Soi Nichada Thani, Samakee Road, Pakkret, Nonthaburi 11120',
                googleMapsLink: 'https://maps.google.com/?q=13.8895,100.5285',
                distance: 28.5,
                inspector1: { name: 'Coach Mike', phone: '086-777-8888' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 9,
        name: 'คอนโด Ideo Q Chula-Samyan',
        phone: '02-316-2222',
        email: 'juristic.ideoq@ananda.co.th',
        line: '@ideoqchula',
        facebook: 'Ideo Q Chula-Samyan',
        instagram: '',
        mediaSource: 'Walk-in',
        mediaSourceOther: '',
        contact1: { name: 'นิติบุคคล', phone: '02-316-2222' },
        contact2: { name: 'ช่างอาคาร', phone: '081-222-3333' },
        lastOrder: '10/11/2023',
        taxInvoices: [
            {
                companyName: 'นิติบุคคลอาคารชุด ไอดีโอ คิว จุฬา-สามย่าน',
                taxId: '0994000987654',
                branch: 'สำนักงานใหญ่',
                addrNumber: '660', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'พระรามที่ 4',
                addrTambon: 'มหาพฤฒาราม', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500',
                phone: '02-316-2222',
                email: 'juristic.ideoq@ananda.co.th',
                deliveryAddrNumber: '660', deliveryAddrMoo: '', deliveryAddrVillage: '', deliveryAddrSoi: '', deliveryAddrRoad: 'พระรามที่ 4',
                deliveryAddrTambon: 'มหาพฤฒาราม', deliveryAddrAmphoe: 'บางรัก', deliveryAddrProvince: 'กรุงเทพมหานคร', deliveryAddrZipcode: '10500',
                deliveryAddress: '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500'
            }
        ],
        addresses: [
            {
                label: 'Lobby',
                addrNumber: '660', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'พระรามที่ 4',
                addrTambon: 'มหาพฤฒาราม', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500',
                googleMapsLink: 'https://maps.google.com/?q=13.7334,100.5289',
                distance: 21.0,
                inspector1: { name: 'นิติบุคคล', phone: '02-316-2222' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'ห้องควบคุมระบบ (ชั้น 5)',
                addrNumber: '660', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'พระรามที่ 4',
                addrTambon: 'มหาพฤฒาราม', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500',
                googleMapsLink: 'https://maps.google.com/?q=13.7334,100.5289',
                distance: 21.0,
                inspector1: { name: 'หัวหน้าช่าง', phone: '081-222-3333' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'สระว่ายน้ำ (ชั้นดาดฟ้า)',
                addrNumber: '660', addrMoo: '', addrVillage: '', addrSoi: '', addrRoad: 'พระรามที่ 4',
                addrTambon: 'มหาพฤฒาราม', addrAmphoe: 'บางรัก', addrProvince: 'กรุงเทพมหานคร', addrZipcode: '10500',
                address: '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500',
                googleMapsLink: 'https://maps.google.com/?q=13.7334,100.5289',
                distance: 21.0,
                inspector1: { name: 'ผู้ดูแลสระ', phone: '089-555-6666' },
                inspector2: { name: '', phone: '' }
            }
        ]
    },
    {
        id: 10,
        name: 'วัดพระธรรมกาย',
        phone: '02-831-1000',
        email: 'info@dhammakaya.net',
        line: '@dhammakaya',
        facebook: 'Dhammakaya Temple',
        instagram: 'dhammakaya_official',
        mediaSource: 'ศิษย์เก่า',
        mediaSourceOther: '',
        contact1: { name: 'พระอาจารย์สมชาย', phone: '081-999-9999' },
        contact2: { name: 'อุบาสกวิชัย', phone: '082-888-8888' },
        lastOrder: '12/11/2023',
        taxInvoices: [
            {
                companyName: 'มูลนิธิธรรมกาย',
                taxId: '0994000111222',
                branch: 'สำนักงานใหญ่',
                addrNumber: '23/2', addrMoo: '7', addrVillage: '', addrSoi: '', addrRoad: '',
                addrTambon: 'คลองสาม', addrAmphoe: 'คลองหลวง', addrProvince: 'ปทุมธานี', addrZipcode: '12120',
                address: '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120',
                phone: '02-831-1000',
                email: 'finance@dhammakaya.net',
                deliveryAddrNumber: '23/2', deliveryAddrMoo: '7', deliveryAddrVillage: '', deliveryAddrSoi: '', deliveryAddrRoad: '',
                deliveryAddrTambon: 'คลองสาม', deliveryAddrAmphoe: 'คลองหลวง', deliveryAddrProvince: 'ปทุมธานี', deliveryAddrZipcode: '12120',
                deliveryAddress: '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120'
            }
        ],
        addresses: [
            {
                label: 'สภาธรรมกายสากล',
                addrNumber: '23/2', addrMoo: '7', addrVillage: '', addrSoi: '', addrRoad: '',
                addrTambon: 'คลองสาม', addrAmphoe: 'คลองหลวง', addrProvince: 'ปทุมธานี', addrZipcode: '12120',
                address: '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120',
                googleMapsLink: 'https://maps.google.com/?q=14.0725,100.6438',
                distance: 40.0,
                inspector1: { name: 'หัวหน้าอาสาสมัคร', phone: '081-111-2222' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'อาคาร 100 ปี',
                addrNumber: '23/2', addrMoo: '7', addrVillage: '', addrSoi: '', addrRoad: '',
                addrTambon: 'คลองสาม', addrAmphoe: 'คลองหลวง', addrProvince: 'ปทุมธานี', addrZipcode: '12120',
                address: '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120',
                googleMapsLink: 'https://maps.google.com/?q=14.0750,100.6450',
                distance: 40.5,
                inspector1: { name: 'เจ้าหน้าที่อาคาร', phone: '089-333-4444' },
                inspector2: { name: '', phone: '' }
            },
            {
                label: 'โรงครัว 71 ปี',
                addrNumber: '23/2', addrMoo: '7', addrVillage: '', addrSoi: '', addrRoad: '',
                addrTambon: 'คลองสาม', addrAmphoe: 'คลองหลวง', addrProvince: 'ปทุมธานี', addrZipcode: '12120',
                address: '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120',
                googleMapsLink: 'https://maps.google.com/?q=14.0700,100.6420',
                distance: 39.5,
                inspector1: { name: 'แม่ครัวใหญ่', phone: '086-555-6666' },
                inspector2: { name: '', phone: '' }
            }
        ]
    }
]

// Mock Products Data
export const MOCK_PRODUCTS_DATA = [
    {
        id: 'OT022-GRY-00-23-00',
        name: 'โคมไฟกริ่งคริสตัล',
        category: 'อื่นๆ',
        subcategory: '',
        price: 43400,
        stock: 0,
        description: 'A022 โคมไฟกริ่งคริสตัล สแตนเลสสีเงิน ขนาด D23*H50cm = 14ชิ้น (warm)',
        length: '', width: '23', height: '50',
        material: 'สแตนเลส', color: 'เทา', crystalColor: '',
        bulbType: '', light: 'Warm', remote: '',
        images: []
    },
    {
        id: 'OT03-GLD-00-20-00',
        name: 'โคมไฟกริ่งคาดสีทอง',
        category: 'อื่นๆ',
        subcategory: '',
        price: 6000,
        stock: 0,
        description: 'A03 โคมไฟกริ่งคาดสีทอง ขนาด 20*45cm พร้อมไฟแสง Day light = 2 ชุด',
        length: '', width: '20', height: '45',
        material: 'สแตนเลส', color: 'ทอง', crystalColor: '',
        bulbType: '', light: 'Day Light', remote: '',
        images: []
    },
    {
        id: 'AA002-SLV-00-60-00',
        name: 'โคมไฟสปาร์คบอล',
        category: 'โคมไฟระย้า',
        subcategory: '',
        price: 21900,
        stock: 0,
        description: 'AA002-60 โคมไฟสปาร์คบอล ขนาด 60cm สีเงิน ไฟ 3 แสง',
        length: '', width: '60', height: '',
        material: 'สแตนเลส', color: 'สีเงิน', crystalColor: '',
        bulbType: '', light: '3 แสง', remote: 'มี',
        images: []
    },
    {
        id: 'AA018-BLK-00-50-00',
        name: 'โคมไฟระย้าคริสตัล สีดำ',
        category: 'โคมไฟระย้า',
        subcategory: '',
        price: 12900,
        stock: 0,
        description: 'AA018 โคมไฟระย้าคริสตัล สีดำ 12 หัว ขนาด 50*240cm (3แสง)',
        length: '', width: '50', height: '240',
        material: 'สแตนเลส', color: 'ดำ', crystalColor: '',
        bulbType: '', light: '3 แสง', remote: '',
        images: []
    },
    {
        id: 'AA020-GLD-00-60-00',
        name: 'โคมไฟระย้าแท่งแก้วใส',
        category: 'โคมไฟระย้า',
        subcategory: '',
        price: 25900,
        stock: 0,
        description: 'AA020 โคมไฟระย้าแท่งแก้วใส สีทอง 21หัว ขนาด 60cm*230cm',
        length: '', width: '60', height: '230',
        material: '', color: 'ทอง', crystalColor: '',
        bulbType: '', light: '', remote: '',
        images: []
    },
    {
        id: 'AA025-GLD-00-30-00',
        name: 'โคมไฟวงแหวนสแตนเลส',
        category: 'โคมไฟระย้า',
        subcategory: '',
        price: 28900,
        stock: 0,
        description: 'AA025-6 โคมไฟวงแหวนสแตนเลสสีทอง 6 วง ขนาด 120+100+80+60+40+30cm (3แสง) + รีโมท',
        length: '', width: '30', height: '',
        material: 'สแตนเลส', color: 'ทอง', crystalColor: '',
        bulbType: '', light: '3 แสง', remote: 'มี',
        images: []
    },
    {
        id: 'AA031-RGD-00-20-00',
        name: 'โคมไฟระย้าลูกบาศก์',
        category: 'โคมไฟระย้า',
        subcategory: '',
        price: 46900,
        stock: 0,
        description: 'AA031 โคมไฟระย้า ลูกบากศ์ สีโรสโกลด์ 9ดวง dia.20cm *6 ,30cm*3, ฐาน 80cm*สูง 300cm',
        length: '', width: '20', height: '300',
        material: 'สแตนเลส', color: 'โรสโกลด์', crystalColor: '',
        bulbType: '', light: '', remote: 'มี',
        images: []
    },
    {
        id: 'AA035-RGD-00-18-00',
        name: 'โคมไฟระย้า LAVA',
        category: 'โคมไฟระย้า',
        subcategory: '',
        price: 22400,
        stock: 0,
        description: 'AA035 โคมไฟระย้า LAVA 18cm สีโรสโกลด์ 8 ลูก',
        length: '', width: '18', height: '',
        material: '', color: 'โรสโกลด์', crystalColor: '',
        bulbType: '', light: '', remote: '',
        images: []
    },
    {
        id: 'LED-BULB-09',
        name: 'หลอดไฟ LED 9W',
        category: 'หลอดไฟ',
        subcategory: '',
        price: 150,
        stock: 100,
        description: 'หลอด LED ประหยัดพลังงาน แสง Daylight ขั้ว E27',
        length: '12', width: '6', height: '6',
        material: 'พลาสติก', color: 'ขาว', crystalColor: '-',
        bulbType: 'E27', light: 'Daylight', remote: '-',
        images: []
    },
    {
        id: 'SPOT-WH-7W',
        name: 'ดาวน์ไลท์ LED 7W',
        category: 'ดาวน์ไลท์',
        subcategory: '',
        price: 180,
        stock: 50,
        description: '7W, Day Light, สีขาว',
        length: '9', width: '9', height: '5',
        material: 'อลูมิเนียม', color: 'ขาว', crystalColor: '-',
        bulbType: 'LED 7W', light: 'Day Light', remote: '-',
        images: []
    }
]

