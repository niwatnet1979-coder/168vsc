import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

// Mock Data (Same as in customers.js plus extra details)
const MOCK_CUSTOMERS = [
    {
        id: 1,
        name: 'บริษัท เทคโนโลยี จำกัด',
        phone: '02-123-4567',
        email: 'info@techno.com',
        line: '@techno',
        facebook: 'facebook.com/techno',
        instagram: '@techno_official',
        mediaSource: 'Facebook',
        mediaSourceOther: '',
        contact1: { name: 'สมชาย ใจดี', phone: '081-234-5678' },
        contact2: { name: 'สมหญิง รักงาน', phone: '082-345-6789' },
        // Extra Data for Tabs
        taxInvoice: {
            taxId: '1234567890123',
            branch: 'สำนักงานใหญ่',
            address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
            phone: '02-123-4567'
        },
        savedAddresses: [
            { name: 'สำนักงานใหญ่', address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110', mapLink: 'https://maps.google.com/?q=13.7,100.5' },
            { name: 'สาขาบางนา', address: '456 ถ.บางนา-ตราด แขวงบางนา เขตบางนา กทม. 10260', mapLink: 'https://maps.google.com/?q=13.6,100.6' }
        ],
        orders: [
            { id: 'ORD-001', date: '2023-01-15', items: 'ติดตั้งกล้องวงจรปิด 4 จุด', total: 15000, status: 'Completed' },
            { id: 'ORD-005', date: '2023-03-20', items: 'ซ่อมบำรุงระบบ', total: 3500, status: 'Completed' }
        ]
    },
    {
        id: 2,
        name: 'ร้านค้าปลีก ABC',
        phone: '02-234-5678',
        email: 'abc@retail.com',
        line: '@abcretail',
        facebook: 'facebook.com/abcretail',
        instagram: '@abc_retail',
        mediaSource: 'Google',
        mediaSourceOther: '',
        contact1: { name: 'วิชัย สุขใจ', phone: '083-456-7890' },
        contact2: { name: 'สุดา แสงจันทร์', phone: '084-567-8901' },
        taxInvoice: {
            taxId: '9876543210987',
            branch: 'สาขา 1',
            address: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310',
            phone: '02-234-5678'
        },
        savedAddresses: [
            { name: 'หน้าร้าน', address: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310', mapLink: 'https://maps.google.com/?q=13.75,100.55' }
        ],
        orders: [
            { id: 'ORD-002', date: '2023-02-10', items: 'ติดตั้งระบบกันขโมย', total: 25000, status: 'Processing' }
        ]
    },
    // ... (Other items would be similar, using generic data for now if id matches)
]

// Helper to get customer by ID (with fallback for IDs 3-10)
const getCustomerById = (id) => {
    const customer = MOCK_CUSTOMERS.find(c => c.id === parseInt(id))
    if (customer) return customer

    // Fallback for other IDs to show something
    return {
        id: parseInt(id),
        name: `ลูกค้าตัวอย่าง ${id}`,
        phone: '08x-xxx-xxxx',
        email: `customer${id}@example.com`,
        line: `@customer${id}`,
        facebook: '',
        instagram: '',
        mediaSource: 'N/A',
        contact1: { name: '-', phone: '-' },
        contact2: { name: '-', phone: '-' },
        taxInvoice: { taxId: '-', branch: '-', address: '-', phone: '-' },
        savedAddresses: [],
        orders: []
    }
}

export default function CustomerDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [customer, setCustomer] = useState(null)
    const [activeTab, setActiveTab] = useState('customer') // customer, tax, address, orders

    useEffect(() => {
        if (id) {
            setCustomer(getCustomerById(id))
        }
    }, [id])

    if (!customer) return <div className="p-8">Loading...</div>

    return (
        <>
            <Head>
                <title>{customer.name} - รายละเอียดลูกค้า</title>
            </Head>

            <div className="detail-page">
                <header className="page-header">
                    <button className="btn-back" onClick={() => router.push('/customers')}>
                        ← กลับหน้ารายชื่อ
                    </button>
                    <h1>{customer.name}</h1>
                    <div className="customer-meta">
                        <span>📞 {customer.phone}</span>
                        {customer.email && <span>📧 {customer.email}</span>}
                    </div>
                </header>

                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
                            onClick={() => setActiveTab('customer')}
                        >
                            ข้อมูลลูกค้า (Customer)
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'tax' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tax')}
                        >
                            ข้อมูลใบกำกับภาษี (Tax Invoice)
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'address' ? 'active' : ''}`}
                            onClick={() => setActiveTab('address')}
                        >
                            สถานที่ติดตั้ง (Install Address)
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            รายการสินค้า (Order Items)
                        </button>
                    </div>

                    <div className="tab-content">
                        {/* 1. Customer Info Tab */}
                        {activeTab === 'customer' && (
                            <div className="info-grid">
                                <div className="info-group">
                                    <label>ชื่อลูกค้า / บริษัท</label>
                                    <div className="value">{customer.name}</div>
                                </div>
                                <div className="info-group">
                                    <label>เบอร์โทรศัพท์</label>
                                    <div className="value">{customer.phone}</div>
                                </div>
                                <div className="info-group">
                                    <label>อีเมล</label>
                                    <div className="value">{customer.email || '-'}</div>
                                </div>
                                <div className="info-group">
                                    <label>LINE ID</label>
                                    <div className="value">{customer.line || '-'}</div>
                                </div>
                                <div className="info-group">
                                    <label>Facebook</label>
                                    <div className="value">{customer.facebook || '-'}</div>
                                </div>
                                <div className="info-group">
                                    <label>Instagram</label>
                                    <div className="value">{customer.instagram || '-'}</div>
                                </div>
                                <div className="info-group">
                                    <label>สื่อที่ลูกค้าเห็น</label>
                                    <div className="value">
                                        {customer.mediaSource === 'อื่นๆระบุ' ? customer.mediaSourceOther : customer.mediaSource}
                                    </div>
                                </div>
                                <div className="divider"></div>
                                <div className="info-group">
                                    <label>ผู้ติดต่อ 1</label>
                                    <div className="value">{customer.contact1.name} ({customer.contact1.phone})</div>
                                </div>
                                <div className="info-group">
                                    <label>ผู้ติดต่อ 2</label>
                                    <div className="value">{customer.contact2.name} ({customer.contact2.phone})</div>
                                </div>
                            </div>
                        )}

                        {/* 2. Tax Invoice Tab */}
                        {activeTab === 'tax' && (
                            <div className="info-grid">
                                <div className="info-group">
                                    <label>เลขประจำตัวผู้เสียภาษี</label>
                                    <div className="value">{customer.taxInvoice.taxId}</div>
                                </div>
                                <div className="info-group">
                                    <label>สาขา</label>
                                    <div className="value">{customer.taxInvoice.branch}</div>
                                </div>
                                <div className="info-group full-width">
                                    <label>ที่อยู่ใบกำกับภาษี</label>
                                    <div className="value">{customer.taxInvoice.address}</div>
                                </div>
                                <div className="info-group">
                                    <label>เบอร์โทรศัพท์</label>
                                    <div className="value">{customer.taxInvoice.phone}</div>
                                </div>
                            </div>
                        )}

                        {/* 3. Address Tab */}
                        {activeTab === 'address' && (
                            <div className="address-list">
                                {customer.savedAddresses.length > 0 ? (
                                    customer.savedAddresses.map((addr, i) => (
                                        <div key={i} className="address-card">
                                            <h3>📍 {addr.name}</h3>
                                            <p>{addr.address}</p>
                                            {addr.mapLink && (
                                                <a href={addr.mapLink} target="_blank" rel="noopener noreferrer" className="map-link">
                                                    ดูแผนที่ Google Maps
                                                </a>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-state">ไม่มีข้อมูลสถานที่ติดตั้งที่บันทึกไว้</div>
                                )}
                            </div>
                        )}

                        {/* 4. Orders Tab */}
                        {activeTab === 'orders' && (
                            <div className="orders-list">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>วันที่</th>
                                            <th>รายการ</th>
                                            <th>ยอดรวม</th>
                                            <th>สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customer.orders.length > 0 ? (
                                            customer.orders.map((order, i) => (
                                                <tr key={i}>
                                                    <td>{order.id}</td>
                                                    <td>{order.date}</td>
                                                    <td>{order.items}</td>
                                                    <td>{order.total.toLocaleString()} บาท</td>
                                                    <td>
                                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center">ไม่มีประวัติการสั่งซื้อ</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    .detail-page {
                        min-height: 100vh;
                        background: #f5f7fa;
                        padding: 24px;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .page-header {
                        background: white;
                        padding: 24px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        margin-bottom: 24px;
                    }
                    .btn-back {
                        background: none;
                        border: none;
                        color: #666;
                        cursor: pointer;
                        font-size: 14px;
                        padding: 0;
                        margin-bottom: 12px;
                    }
                    .btn-back:hover {
                        color: #0070f3;
                        text-decoration: underline;
                    }
                    .page-header h1 {
                        margin: 0 0 8px 0;
                        font-size: 28px;
                        color: #1a202c;
                    }
                    .customer-meta {
                        display: flex;
                        gap: 16px;
                        color: #4a5568;
                        font-size: 15px;
                    }
                    .tabs-container {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        overflow: hidden;
                        min-height: 500px;
                    }
                    .tabs-header {
                        display: flex;
                        border-bottom: 1px solid #edf2f7;
                        background: #f8fafc;
                    }
                    .tab-btn {
                        padding: 16px 24px;
                        background: none;
                        border: none;
                        border-bottom: 3px solid transparent;
                        font-size: 15px;
                        font-weight: 600;
                        color: #718096;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .tab-btn:hover {
                        color: #2d3748;
                        background: #edf2f7;
                    }
                    .tab-btn.active {
                        color: #0070f3;
                        border-bottom-color: #0070f3;
                        background: white;
                    }
                    .tab-content {
                        padding: 32px;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 24px;
                    }
                    .info-group {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .info-group.full-width {
                        grid-column: 1 / -1;
                    }
                    .info-group label {
                        font-size: 13px;
                        color: #718096;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .info-group .value {
                        font-size: 16px;
                        color: #2d3748;
                        font-weight: 500;
                        padding: 8px 12px;
                        background: #f7fafc;
                        border-radius: 6px;
                        border: 1px solid #edf2f7;
                    }
                    .divider {
                        grid-column: 1 / -1;
                        height: 1px;
                        background: #edf2f7;
                        margin: 8px 0;
                    }
                    .address-list {
                        display: grid;
                        gap: 16px;
                    }
                    .address-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 20px;
                        background: #fff;
                    }
                    .address-card h3 {
                        margin: 0 0 8px 0;
                        font-size: 18px;
                        color: #2d3748;
                    }
                    .address-card p {
                        margin: 0 0 12px 0;
                        color: #4a5568;
                        line-height: 1.5;
                    }
                    .map-link {
                        color: #0070f3;
                        text-decoration: none;
                        font-size: 14px;
                        display: inline-flex;
                        align-items: center;
                    }
                    .map-link:hover {
                        text-decoration: underline;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .data-table th {
                        text-align: left;
                        padding: 12px;
                        background: #f7fafc;
                        border-bottom: 2px solid #edf2f7;
                        color: #4a5568;
                        font-weight: 600;
                    }
                    .data-table td {
                        padding: 12px;
                        border-bottom: 1px solid #edf2f7;
                        color: #2d3748;
                    }
                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    .status-badge.completed {
                        background: #c6f6d5;
                        color: #22543d;
                    }
                    .status-badge.processing {
                        background: #feebc8;
                        color: #744210;
                    }
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #a0aec0;
                    }
                    .text-center {
                        text-align: center;
                    }
                `}</style>
            </div>
        </>
    )
}
