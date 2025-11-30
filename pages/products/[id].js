import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

// Mock Data (Should be shared)
const MOCK_PRODUCTS = [
    {
        id: 'CAM-001',
        name: 'กล้องวงจรปิด HD',
        type: 'กล้องวงจรปิด',
        price: 3500,
        cost: 2500,
        description: 'ความละเอียด 1080p, กันน้ำ, Night Vision',
        stock: 50,
        brand: 'Hikvision',
        warranty: '2 ปี',
        supplier: 'บจก. ซีเคียวริตี้',
        images: ['/placeholder-camera.jpg'],
        transactions: [
            { date: '2023-11-20', type: 'IN', qty: 20, ref: 'PO-231101' },
            { date: '2023-11-25', type: 'OUT', qty: 4, ref: 'ORD-001' },
            { date: '2023-12-01', type: 'OUT', qty: 2, ref: 'ORD-005' }
        ]
    },
    {
        id: 'LED-BULB-09',
        name: 'หลอดไฟ LED 9W',
        type: 'หลอดไฟ',
        price: 150,
        cost: 80,
        description: 'แสง Daylight, ขั้ว E27, ประหยัดไฟ 80%',
        stock: 200,
        brand: 'Philips',
        warranty: '1 ปี',
        supplier: 'บจก. ไลท์ติ้ง',
        images: [],
        transactions: []
    }
]

export default function ProductDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [product, setProduct] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})

    useEffect(() => {
        if (id) {
            const found = MOCK_PRODUCTS.find(p => p.id === id)
            if (found) {
                setProduct(found)
                setEditForm(found)
            } else {
                // Mock for new/unknown product
                const newProduct = {
                    id: id,
                    name: 'สินค้าตัวอย่าง',
                    type: 'ทั่วไป',
                    price: '',
                    cost: '',
                    description: '',
                    stock: '',
                    brand: '',
                    warranty: '',
                    supplier: '',
                    transactions: []
                }
                setProduct(newProduct)
                setEditForm(newProduct)
            }
        }
    }, [id])

    const handleSave = () => {
        setProduct(editForm)
        setIsEditing(false)
        alert('บันทึกข้อมูลเรียบร้อย (Mockup)')
    }

    const handleChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }))
    }

    if (!product) return <div className="p-8">Loading...</div>

    return (
        <>
            <Head>
                <title>{product.name} - รายละเอียดสินค้า</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="product-detail-page">
                {/* Header */}
                <header className="page-header">
                    <div className="header-left">
                        <button className="btn-back" onClick={() => router.back()}>← กลับ</button>
                        <h1>{product.name}</h1>
                        <span className="product-id">#{product.id}</span>
                    </div>
                    <div className="header-actions">
                        {isEditing ? (
                            <>
                                <button className="btn-secondary" onClick={() => {
                                    setIsEditing(false)
                                    setEditForm(product)
                                }}>ยกเลิก</button>
                                <button className="btn-primary" onClick={handleSave}>บันทึก</button>
                            </>
                        ) : (
                            <button className="btn-primary" onClick={() => setIsEditing(true)}>แก้ไขข้อมูล</button>
                        )}
                    </div>
                </header>

                <div className="content-grid">
                    {/* Main Info */}
                    <div className="main-column">
                        <section className="card">
                            <h2>ข้อมูลทั่วไป</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>ชื่อสินค้า</label>
                                    {isEditing ? (
                                        <input
                                            value={editForm.name}
                                            onChange={e => handleChange('name', e.target.value)}
                                        />
                                    ) : (
                                        <div className="value">{product.name}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>รหัสสินค้า</label>
                                    <div className="value">{product.id}</div>
                                </div>
                                <div className="form-group">
                                    <label>ประเภท</label>
                                    {isEditing ? (
                                        <input
                                            value={editForm.type}
                                            onChange={e => handleChange('type', e.target.value)}
                                        />
                                    ) : (
                                        <div className="value">{product.type}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>ยี่ห้อ (Brand)</label>
                                    {isEditing ? (
                                        <input
                                            value={editForm.brand}
                                            onChange={e => handleChange('brand', e.target.value)}
                                        />
                                    ) : (
                                        <div className="value">{product.brand || '-'}</div>
                                    )}
                                </div>
                                <div className="form-group full-width">
                                    <label>รายละเอียด</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.description}
                                            onChange={e => handleChange('description', e.target.value)}
                                            rows={3}
                                        />
                                    ) : (
                                        <div className="value">{product.description || '-'}</div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="card">
                            <h2>ข้อมูลราคาและสต็อก</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>ราคาขาย</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editForm.price}
                                            onChange={e => handleChange('price', Number(e.target.value))}
                                        />
                                    ) : (
                                        <div className="value price">{product.price?.toLocaleString()} บาท</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>ราคาทุน</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editForm.cost}
                                            onChange={e => handleChange('cost', Number(e.target.value))}
                                        />
                                    ) : (
                                        <div className="value">{product.cost?.toLocaleString()} บาท</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>จำนวนคงเหลือ</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editForm.stock}
                                            onChange={e => handleChange('stock', Number(e.target.value))}
                                        />
                                    ) : (
                                        <div className="value stock">{product.stock}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>ผู้จำหน่าย (Supplier)</label>
                                    {isEditing ? (
                                        <input
                                            value={editForm.supplier}
                                            onChange={e => handleChange('supplier', e.target.value)}
                                        />
                                    ) : (
                                        <div className="value">{product.supplier || '-'}</div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>การรับประกัน</label>
                                    {isEditing ? (
                                        <input
                                            value={editForm.warranty}
                                            onChange={e => handleChange('warranty', e.target.value)}
                                        />
                                    ) : (
                                        <div className="value">{product.warranty || '-'}</div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="side-column">
                        <section className="card">
                            <h2>ความเคลื่อนไหวล่าสุด</h2>
                            <div className="transaction-list">
                                {product.transactions && product.transactions.length > 0 ? (
                                    product.transactions.map((t, i) => (
                                        <div key={i} className="transaction-item">
                                            <div className={`tx-icon ${t.type.toLowerCase()}`}>
                                                {t.type === 'IN' ? '↓' : '↑'}
                                            </div>
                                            <div className="tx-details">
                                                <div className="tx-ref">{t.ref}</div>
                                                <div className="tx-date">{t.date}</div>
                                            </div>
                                            <div className={`tx-qty ${t.type.toLowerCase()}`}>
                                                {t.type === 'IN' ? '+' : '-'}{t.qty}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-tx">ไม่มีรายการเคลื่อนไหว</div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <style jsx>{`
                    .product-detail-page {
                        min-height: 100vh;
                        background: #f5f7fa;
                        padding: 24px;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .page-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .btn-back {
                        background: none;
                        border: none;
                        color: #718096;
                        cursor: pointer;
                        font-size: 14px;
                        padding: 0;
                    }
                    .btn-back:hover { color: #2d3748; text-decoration: underline; }
                    h1 { margin: 0; font-size: 24px; color: #1a202c; }
                    .product-id {
                        background: #edf2f7;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 14px;
                        color: #4a5568;
                        font-family: monospace;
                    }
                    .header-actions {
                        display: flex;
                        gap: 12px;
                    }
                    .btn-primary {
                        background: #0070f3;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .btn-primary:hover { background: #0060df; }
                    .btn-secondary {
                        background: #edf2f7;
                        color: #4a5568;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .btn-secondary:hover { background: #e2e8f0; }

                    .content-grid {
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 24px;
                    }
                    @media (max-width: 768px) {
                        .content-grid { grid-template-columns: 1fr; }
                    }

                    .card {
                        background: white;
                        padding: 24px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        margin-bottom: 24px;
                    }
                    .card h2 {
                        margin: 0 0 20px 0;
                        font-size: 18px;
                        color: #2d3748;
                        border-bottom: 1px solid #edf2f7;
                        padding-bottom: 12px;
                    }

                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }
                    .form-group { display: flex; flex-direction: column; gap: 6px; }
                    .form-group.full-width { grid-column: 1 / -1; }
                    
                    label { font-size: 13px; color: #718096; font-weight: 500; }
                    .value { font-size: 15px; color: #2d3748; min-height: 24px; }
                    .value.price { font-weight: 700; color: #0070f3; }
                    .value.stock { font-weight: 700; }
                    
                    input, textarea {
                        padding: 8px 12px;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        font-family: inherit;
                        font-size: 15px;
                    }
                    input:focus, textarea:focus { outline: none; border-color: #0070f3; }

                    .transaction-list { display: flex; flex-direction: column; gap: 12px; }
                    .transaction-item {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 6px;
                    }
                    .tx-icon {
                        width: 32px; height: 32px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                    }
                    .tx-icon.in { background: #c6f6d5; color: #22543d; }
                    .tx-icon.out { background: #fed7d7; color: #742a2a; }
                    
                    .tx-details { flex: 1; }
                    .tx-ref { font-weight: 600; font-size: 14px; color: #2d3748; }
                    .tx-date { font-size: 12px; color: #718096; }
                    
                    .tx-qty { font-weight: 700; font-size: 14px; }
                    .tx-qty.in { color: #2f855a; }
                    .tx-qty.out { color: #c53030; }
                    
                    .empty-tx { text-align: center; color: #a0aec0; padding: 20px; font-style: italic; }
                `}</style>
            </div>
        </>
    )
}
