
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        'Dashboard': 'Dashboard',
        'Order Entry': 'Order Entry',
        'Order Entry By SA': 'Order Entry By SA',
        'Orders List': 'Orders List',
        'Products': 'Products',
        'Inventory': 'Inventory',
        'Purchasing': 'Purchasing',
        'Quality Control': 'Quality Control',
        'Customers': 'Customers',
        'Team': 'Team',
        'Jobs': 'Jobs',
        'Mobile': 'Mobile',
        'Reports': 'Reports',
        'Settings': 'Settings',
        'Switch Account': 'Switch Account',
        'Logout': 'Logout',
        'System': 'VSC System',
        'Language': 'Language',

        // Purchasing
        'Procurement (Purchasing)': 'Procurement (Purchasing)',
        'Manage Purchase Orders and Landed Costs': 'Manage Purchase Orders and Landed Costs',
        'New PO': 'New PO',
        'Purchase Orders': 'Purchase Orders',
        'Reorder Suggestions': 'Reorder Suggestions',
        'Low Stock': 'Low Stock',
        'PO #': 'PO #',
        'Supplier': 'Supplier',
        'Status': 'Status',
        'Expect Date': 'Expect Date',
        'Total Cost': 'Total Cost',
        'Actions': 'Actions',
        'Product': 'Product',
        'Current Stock': 'Current Stock',
        'Min Level': 'Min Level',
        'Suggested Order': 'Suggested Order',
        'Action': 'Action',
        'Scanning inventory...': 'Scanning inventory...',
        'All Stock Levels Healthy': 'All Stock Levels Healthy',
        'No items are below minimum stock level.': 'No items are below minimum stock level.',
        'Loading orders...': 'Loading orders...',
        'No purchase orders found.': 'No purchase orders found.',
        'Search Supplier or PO #': 'Search Supplier or PO #',
        'All Status': 'All Status',
        'Draft': 'Draft',
        'Ordered': 'Ordered',
        'Shipping': 'Shipping',
        'Received': 'Received',
        'Completed': 'Completed',
        'Pending': 'Pending',
        'Processing': 'Processing',
        'Create PO': 'Create PO',
        'Unpaid': 'Unpaid',
        'Paid': 'Paid',
        'Deposit': 'Deposit',
        'Pay Back': 'Pay Back',
        'Inbound Shipments': 'Inbound Shipments',
        'Receiving': 'Receiving',

        // Inventory
        'Inventory Management': 'Inventory Management',
        'Manage stock, check-in/out, and track items': 'Manage stock, check-in/out, and track items',
        'Scan QR': 'Scan QR',
        'Check-out': 'Check-out',
        'Check-in Item': 'Check-in Item',
        'Stock Check Mode': 'Stock Check Mode',
        'Scan to audit inventory': 'Scan to audit inventory',
        'Search by QR, Product Name, Code...': 'Search by QR, Product Name, Code...',
        'Item / QR': 'Item / QR',
        'Location': 'Location',
        'Loading inventory...': 'Loading inventory...',
        'No Inventory Items Found': 'No Inventory Items Found',
        'Check-in items to get started': 'Check-in items to get started',
        'In Stock': 'In Stock',
        'in_stock': 'In Stock',
        'sold': 'Sold',
        'lost': 'Lost',
        'Item Journey Tracking': 'Item Journey Tracking',
        'Close': 'Close',
        'Mark as Lost': 'Mark as Lost',
        'View QR': 'View QR',
        'View History': 'View History',
        'Confirm Mark Lost': 'Are you sure you want to mark item {qr} as LOST?\nThis will remove it from stock count.',
        'Item marked as lost': 'Item marked as lost',
        'Failed to mark item as lost': 'Failed to mark item as lost',

        // Stock Audit
        'Stock Audit Mode': 'Stock Audit Mode',
        'Scan items to verify current stock levels.': 'Scan items to verify current stock levels.',
        'Progress': 'Progress',
        'Scan QR Code here...': 'Scan QR Code here...',
        'ENTER': 'ENTER',
        'OK - COUNTED': 'OK - COUNTED',
        'WARNING - DUPLICATE': 'WARNING - DUPLICATE',
        'ERROR - UNKNOWN/WRONG': 'ERROR - UNKNOWN/WRONG',
        'Recent Scans': 'Recent Scans',
        'Scanned': 'Scanned',
        'Missing': 'Missing',
        'No items scanned yet.': 'No items scanned yet.',
        'All Clear!': 'All Clear!',
        'No items missing from stock.': 'No items missing from stock.',
        '* Click inside the box and use your scanner. Auto-focus enabled.': '* Click inside the box and use your scanner. Auto-focus enabled.',
        'Unknown': 'Unknown',
        'Item already scanned in this session.': 'Item already scanned in this session.',
        'Verified': 'Verified',
        'QR Code not found or not in Stock.': 'QR Code not found or not in Stock.',

        // Inventory Help Modal
        'Inventory System Guide': 'Inventory System Guide',
        'Receiving Items (Check-in)': 'Receiving Items (Check-in)',
        'Use this when new stock arrives.': 'Use this when new stock arrives.',
        'Scan a product or search by name.': 'Scan a product or search by name.',
        'If product has Variants (Color/Size), select the correct one.': 'If product has Variants (Color/Size), select the correct one.',
        'Box Count: If an item comes in multiple boxes (e.g. 1 Chandelier = 2 Boxes), enter the number of boxes. The system will track them individually.': 'Box Count: If an item comes in multiple boxes (e.g. 1 Chandelier = 2 Boxes), enter the number of boxes. The system will track them individually.',
        'Location: Specify where you are storing the item.': 'Location: Specify where you are storing the item.',
        'Multi-box Tracking': 'Multi-box Tracking',
        'Example: Item A (2 Boxes)': 'Example: Item A (2 Boxes)',
        'The system will generate 2 unique QR Codes:': 'The system will generate 2 unique QR Codes:',
        'You must stick these labels on the respective boxes.': 'You must stick these labels on the respective boxes.',
        'Dispensing Items (Check-out)': 'Dispensing Items (Check-out)',
        'To ensure nothing is missing, the system requires verification:': 'To ensure nothing is missing, the system requires verification:',
        'For single-box items: Scan once to verify.': 'For single-box items: Scan once to verify.',
        'For Multi-box items: You must scan ALL boxes belonging to that set.': 'For Multi-box items: You must scan ALL boxes belonging to that set.',
        'Only when all boxes are green can you confirm the check-out.': 'Only when all boxes are green can you confirm the check-out.',
        'Understood': 'Understood'
    },
    th: {
        'Dashboard': 'แดชบอร์ด',
        'Order Entry': 'บันทึกออเดอร์',
        'Order Entry By SA': 'บันทึกออเดอร์',
        'Orders List': 'รายการออเดอร์',
        'Products': 'สินค้า',
        'Inventory': 'คลังสินค้า',
        'Purchasing': 'จัดซื้อ',
        'Finance': 'การเงิน',
        'Quotations': 'ใบเสนอราคา',
        'Quality Control': 'ตรวจสอบคุณภาพ (QC)',
        'Customers': 'ลูกค้า',
        'Team': 'ทีมงาน',
        'Jobs': 'งานติดตั้ง',
        'Mobile': 'โมบายล์',
        'Reports': 'รายงาน',
        'Settings': 'ตั้งค่า',
        'Switch Account': 'สลับบัญชี',
        'Logout': 'ออกจากระบบ',
        'System': 'ระบบ VSC',
        'Language': 'ภาษา',

        // Purchasing
        'Procurement (Purchasing)': 'จัดซื้อ (Purchasing)',
        'Manage Purchase Orders and Landed Costs': 'จัดการใบสั่งซื้อและต้นทุนนำเข้า',
        'New PO': 'สร้างใบสั่งซื้อใหม่',
        'Purchase Orders': 'รายการสั่งซื้อ',
        'Reorder Suggestions': 'แนะนำสั่งซื้อเพิ่ม',
        'Low Stock': 'สินค้าใกล้หมด',
        'PO #': 'เลขที่ใบสั่งซื้อ',
        'Supplier': 'ผู้ผลิต/ร้านค้า',
        'Status': 'สถานะ',
        'Expect Date': 'วันที่คาดว่าจะได้รับ',
        'Total Cost': 'ยอดรวม',
        'Actions': 'จัดการ',
        'Product': 'สินค้า',
        'Current Stock': 'สต็อกปัจจุบัน',
        'Min Level': 'จุดสั่งซื้อต่ำสุด',
        'Suggested Order': 'จำนวนที่แนะนำ',
        'Action': 'ดำเนินการ',
        'Scanning inventory...': 'กำลังสแกนคลังสินค้า...',
        'All Stock Levels Healthy': 'ระดับสต็อกปกติทั้งหมด',
        'No items are below minimum stock level.': 'ไม่มีสินค้าที่ต่ำกว่าจุดสั่งซื้อ',
        'Loading orders...': 'กำลังโหลดข้อมูล...',
        'No purchase orders found.': 'ไม่พบรายการสั่งซื้อ',
        'Search Supplier or PO #': 'ค้นหาผู้ผลิต หรือ เลขที่ใบสั่งซื้อ',
        'All Status': 'ทุกสถานะ',
        'Draft': 'แบบร่าง',
        'Ordered': 'สั่งซื้อแล้ว',
        'Shipping': 'ขนส่ง',
        'Received': 'ได้รับของแล้ว',
        'Completed': 'เสร็จสมบูรณ์',
        'Pending': 'รอดำเนินการ',
        'Processing': 'กำลังดำเนินการ',
        'Create PO': 'ออกใบสั่งซื้อ',
        'Unpaid': 'ยังไม่จ่าย',
        'Paid': 'จ่ายแล้ว',
        'Deposit': 'มัดจำ',
        'Pay Back': 'จ่ายคืน',
        'Inbound Shipments': 'ชิปปิ้ง (นำเข้า)',
        'Receiving': 'รับสินค้าเข้า (Receiving)',

        // Inventory
        'Inventory Management': 'จัดการคลังสินค้า',
        'Manage stock, check-in/out, and track items': 'จัดการสต็อก เช็คอิน/เช็คเอาท์ และติดตามสถานะ',
        'Scan QR': 'สแกน QR',
        'Check-out': 'เบิกสินค้าออก',
        'Check-in Item': 'รับสินค้าเข้า',
        'Stock Check Mode': 'โหมดนับสต็อก',
        'Scan to audit inventory': 'สแกนเพื่อนับจำนวนสินค้าจริง',
        'Search by QR, Product Name, Code...': 'ค้นหาด้วย QR, ชื่อสินค้า, หรือรหัส...',
        'Item / QR': 'รหัส QR',
        'Location': 'ตำแหน่งจัดเก็บ',
        'Loading inventory...': 'กำลังโหลดข้อมูลคลังสินค้า...',
        'No Inventory Items Found': 'ไม่พบสินค้าในคลัง',
        'Check-in items to get started': 'เริ่มรับข้อมูลสินค้าเข้าสู่ระบบ',
        'In Stock': 'มีสินค้า',
        'in_stock': 'มีสินค้า',
        'sold': 'ขายแล้ว',
        'lost': 'สูญหาย',
        'Item Journey Tracking': 'ติดตามเส้นทางสินค้า',
        'Close': 'ปิด',
        'Mark as Lost': 'ระบุว่าสูญหาย',
        'View QR': 'ดู QR Code',
        'View History': 'ดูประวัติ',
        'Confirm Mark Lost': 'คุณแน่ใจหรือไม่ว่าต้องการระบุสินค้า {qr} ว่าสูญหาย?\nสินค้านี้จะถูกตัดออกจากสต็อก',
        'Item marked as lost': 'ระบุสินค้าว่าสูญหายเรียบร้อยแล้ว',
        'Failed to mark item as lost': 'เกิดข้อผิดพลาดในการระบุสินค้าว่าสูญหาย',

        // Stock Audit
        'Stock Audit Mode': 'โหมดตรวจสอบสต็อก',
        'Scan items to verify current stock levels.': 'สแกนสินค้าเพื่อตรวจสอบยอดสต็อกปัจจุบัน',
        'Progress': 'ความคืบหน้า',
        'Scan QR Code here...': 'สแกน QR Code ที่นี่...',
        'ENTER': 'ตกลง',
        'OK - COUNTED': 'ถูกต้อง - นับแล้ว',
        'WARNING - DUPLICATE': 'แจ้งเตือน - ซ้ำ',
        'ERROR - UNKNOWN/WRONG': 'ผิดพลาด - ไม่พบ/ผิดรายการ',
        'Recent Scans': 'รายการที่สแกนล่าสุด',
        'Scanned': 'สแกนแล้ว',
        'Missing': 'ขาดหาย',
        'No items scanned yet.': 'ยังไม่มีรายการที่สแกน',
        'All Clear!': 'ครบถ้วน!',
        'No items missing from stock.': 'ไม่มีสินค้าขาดหายจากสต็อก',
        '* Click inside the box and use your scanner. Auto-focus enabled.': '* คลิกในช่องและใช้เครื่องสแกน (โฟกัสอัตโนมัติ)',
        'Unknown': 'ไม่ระบุ',
        'Item already scanned in this session.': 'สินค้านี้ถูกสแกนไปแล้วในรอบนี้',
        'Verified': 'ตรวจสอบแล้ว',
        'QR Code not found or not in Stock.': 'ไม่พบรหัส QR หรือไม่ได้อยู่ในสต็อก',

        // Inventory Help Modal
        'Inventory System Guide': 'คู่มือระบบคลังสินค้า',
        'Receiving Items (Check-in)': 'การรับสินค้าเข้า (Check-in)',
        'Use this when new stock arrives.': 'ใช้เมนูนี้เมื่อมีสินค้าใหม่มาส่ง',
        'Scan a product or search by name.': 'สแกนสินค้าหรือค้นหาจากชื่อ',
        'If product has Variants (Color/Size), select the correct one.': 'หากสินค้ามีตัวเลือก (สี/ไซส์) กรุณาเลือกให้ถูกต้อง',
        'Box Count: If an item comes in multiple boxes (e.g. 1 Chandelier = 2 Boxes), enter the number of boxes. The system will track them individually.': 'จำนวนกล่อง: หากสินค้า 1 ชิ้นมีหลายกล่อง (เช่น โคมไฟ 1 ชุด มี 2 กล่อง) ให้ระบุจำนวนกล่อง ระบบจะติดตามแยกรายกล่อง',
        'Location: Specify where you are storing the item.': 'สถานที่จัดเก็บ: ระบุตำแหน่งที่นำสินค้าไปวาง',
        'Multi-box Tracking': 'การติดตามสินค้ารายกล่อง (Multi-box)',
        'Example: Item A (2 Boxes)': 'ตัวอย่าง: สินค้า A (2 กล่อง)',
        'The system will generate 2 unique QR Codes:': 'ระบบจะสร้าง QR Code 2 อันที่ไม่ซ้ำกัน:',
        'You must stick these labels on the respective boxes.': 'คุณต้องติดสติกเกอร์ QR Code นี้ลงบนกล่องแต่ละใบให้ถูกต้อง',
        'Dispensing Items (Check-out)': 'การเบิกสินค้าออก (Check-out)',
        'To ensure nothing is missing, the system requires verification:': 'เพื่อป้องกันของหาย ระบบต้องมีการตรวจสอบก่อนเบิก:',
        'For single-box items: Scan once to verify.': 'สินค้ากล่องเดียว: สแกนครั้งเดียวเพื่อยืนยัน',
        'For Multi-box items: You must scan ALL boxes belonging to that set.': 'สินค้าหลายกล่อง: ต้องสแกน QR ของ "ทุกกล่อง" ในชุดนั้นให้ครบ',
        'Only when all boxes are green can you confirm the check-out.': 'เมื่อขึ้นสีเขียวครบทุกกล่องแล้ว จึงจะกดยืนยันการเบิกได้',
        'Understood': 'รับทราบ/เข้าใจแล้ว'
    }
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('app_language');
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'th' : 'en';
        setLanguage(newLang);
        localStorage.setItem('app_language', newLang);
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
