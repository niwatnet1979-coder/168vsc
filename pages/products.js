import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import MOCK_PRODUCTS from '../products_data_v3.json'
import * as XLSX from 'xlsx'

export default function ProductManagement() {
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [currentProduct, setCurrentProduct] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' })

    // Load products from LocalStorage on mount
    useEffect(() => {
        const savedProducts = localStorage.getItem('products_data_v3')
        if (savedProducts) {
            setProducts(JSON.parse(savedProducts))
        } else {
            // Use new parsed data as fallback and init
            setProducts(MOCK_PRODUCTS)
            localStorage.setItem('products_data_v3', JSON.stringify(MOCK_PRODUCTS))
        }
    }, [])

    // Save to LocalStorage whenever products change
    useEffect(() => {
        if (products.length > 0) {
            localStorage.setItem('products_data_v3', JSON.stringify(products))
        }
    }, [products])

    // Sort function
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }

    // Filter and Sort products
    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            p.id.toLowerCase().includes(term) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
            (p.description && p.description.toLowerCase().includes(term)) ||
            (p.material && p.material.toLowerCase().includes(term)) ||
            (p.color && p.color.toLowerCase().includes(term)) ||
            (p.crystalColor && p.crystalColor.toLowerCase().includes(term)) ||
            (p.bulbType && p.bulbType.toLowerCase().includes(term)) ||
            (p.length && p.length.toString().includes(term)) ||
            (p.width && p.width.toString().includes(term)) ||
            (p.height && p.height.toString().includes(term)) ||
            (p.light && p.light.toLowerCase().includes(term)) ||
            (p.remote && p.remote.toLowerCase().includes(term))
        );
    }).sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    })

    const handleExportExcel = () => {
        // Prepare data for export
        const dataToExport = filteredProducts.map(p => ({
            'รหัสสินค้า': p.id,
            'ประเภทหลัก': p.category,
            'ประเภทย่อย': p.subcategory,
            'ราคา': p.price,
            'คงเหลือ': p.stock,
            'ยาว (cm)': p.length,
            'กว้าง (cm)': p.width,
            'สูง (cm)': p.height,
            'วัสดุ': p.material,
            'สีโครงสร้าง': p.color,
            'สีคริสตัล': p.crystalColor,
            'หลอดไฟ': p.bulbType,
            'แสงไฟ': p.light,
            'รีโมท': p.remote,
            'ยี่ห้อ': p.brand,
            'ผู้จำหน่าย': p.supplier,
            'การรับประกัน': p.warranty,
            'หมายเหตุ': p.description
        }))

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(dataToExport)

        // Create workbook
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Products")

        // Save file
        XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    const handleDelete = (id) => {
        if (confirm('ยืนยันการลบสินค้า?')) {
            const updatedProducts = products.filter(p => p.id !== id)
            setProducts(updatedProducts)
        }
    }

    const handleEdit = (product) => {
        setCurrentProduct({ ...product })
        setShowModal(true)
    }

    // Smart SKU Logic
    const CATEGORY_PREFIXES = {
        'โคมไฟระย้า': 'AA',
        'โคมไฟผนัง': 'WL',
        'โคมไฟเพดาน': 'CL',
        'โคมไฟตั้งพื้น': 'FL',
        'โคมไฟตั้งโต๊ะ': 'TL',
        'ดาวน์ไลท์': 'DL',
        'หลอดไฟ': 'BB',
        'อุปกรณ์': 'AC',
        'อื่นๆ': 'OT'
    }

    const COLOR_CODES = {
        'ทอง': 'GLD',
        'เงิน': 'SLV',
        'ดำ': 'BLK',
        'ขาว': 'WHT',
        'โรสโกลด์': 'RGD',
        'เทา': 'GRY',
        'ทองแดง': 'CPR',
        'น้ำตาล': 'BRN',
        'ใส': 'CLR',
        'คละสี': 'MIX',
        'เขียว': 'GRN',
        'น้ำเงิน': 'BLU',
        'แดง': 'RED',
        'เหลือง': 'YLW',
        'ส้ม': 'ORG',
        'ชมพู': 'PNK',
        'ม่วง': 'PRP',
        'ครีม': 'CRM'
    }

    const [isAutoId, setIsAutoId] = useState(false)
    const [genCategory, setGenCategory] = useState('โคมไฟระย้า')
    const [genL, setGenL] = useState('')
    const [genW, setGenW] = useState('')
    const [genH, setGenH] = useState('')
    const [genColor, setGenColor] = useState('ทอง')
    const [nextRunningNum, setNextRunningNum] = useState('')

    // Calculate next running number when category changes
    useEffect(() => {
        if (isAutoId && showModal) {
            const prefix = CATEGORY_PREFIXES[genCategory] || 'XX';

            // Find max number for this prefix
            let maxNum = 0;
            products.forEach(p => {
                if (p.baseCode && p.baseCode.startsWith(prefix)) {
                    // Extract number part (e.g., AA035 -> 35)
                    const numPart = parseInt(p.baseCode.replace(prefix, ''), 10);
                    if (!isNaN(numPart) && numPart > maxNum) {
                        maxNum = numPart;
                    }
                }
            });

            // Format next number (e.g., 36 -> 036)
            const nextNum = (maxNum + 1).toString().padStart(3, '0');
            setNextRunningNum(nextNum);
        }
    }, [genCategory, isAutoId, showModal, products])

    // Update ID when generator inputs change
    useEffect(() => {
        if (isAutoId) {
            const prefix = CATEGORY_PREFIXES[genCategory] || 'XX';
            const colorCode = COLOR_CODES[genColor] || 'OTH';

            // Format: CODE-COLOR-L-W-H
            // Example: AC025-GLD-100-50-30
            const lPart = genL ? `-${genL}` : '';
            const wPart = genW ? `-${genW}` : '';
            const hPart = genH ? `-${genH}` : '';

            const generatedId = `${prefix}${nextRunningNum}-${colorCode}${lPart}${wPart}${hPart}`;

            setCurrentProduct(prev => ({
                ...prev,
                id: generatedId,
                category: genCategory,
                color: genColor,
                length: genL,
                width: genW,
                height: genH,
                // Also update baseCode for internal tracking
                baseCode: `${prefix}${nextRunningNum}`
            }));
        }
    }, [nextRunningNum, genL, genW, genH, genColor, genCategory, isAutoId])

    const handleAdd = () => {
        setCurrentProduct({
            id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
            brand: '', warranty: '', supplier: '',
            length: '', width: '', height: '',
            material: '', color: '', crystalColor: '',
            bulbType: '', light: '', remote: '', images: []
        })
        setIsAutoId(false) // Reset auto mode
        setShowModal(true)
    }

    const handleSave = (e) => {
        e.preventDefault()

        if (!currentProduct.id) {
            alert('กรุณากรอกรหัสสินค้า')
            return
        }

        const existingIndex = products.findIndex(p => p.id === currentProduct.id)

        if (existingIndex >= 0) {
            // Update existing product
            const updatedProducts = [...products]
            updatedProducts[existingIndex] = currentProduct
            setProducts(updatedProducts)
        } else {
            // Add new product
            setProducts([...products, currentProduct])
        }

        setShowModal(false)
        setCurrentProduct(null)
    }

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }

    return (
        <>
            <Head>
                <title>จัดการสินค้า - Product Management</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="product-page">
                <header className="page-header">
                    <div className="header-content">
                        <h1>📦 จัดการสินค้า (Product Management)</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" onClick={handleExportExcel}>📥 Export Excel</button>
                        <Link href="/" className="btn-back-white">← กลับหน้าหลัก</Link>
                        <button className="btn-primary" onClick={handleAdd}>+ เพิ่มสินค้าใหม่</button>
                    </div>
                </header>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="🔍 ค้นหารหัสสินค้า, ชื่อ, หรือประเภท..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="table-container">
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th style={{ width: 60 }}>รูปภาพ</th>
                                <th onClick={() => requestSort('id')} style={{ cursor: 'pointer' }}>
                                    รหัสสินค้า {getSortIcon('id')}
                                </th>
                                <th onClick={() => requestSort('category')} style={{ cursor: 'pointer' }}>
                                    ข้อมูลสินค้า {getSortIcon('category')}
                                </th>
                                <th className="text-right" style={{ width: 100, cursor: 'pointer' }} onClick={() => requestSort('price')}>
                                    ราคา {getSortIcon('price')}
                                </th>
                                <th className="text-right" style={{ width: 100, cursor: 'pointer' }} onClick={() => requestSort('stock')}>
                                    คงเหลือ {getSortIcon('stock')}
                                </th>
                                <th className="text-center" style={{ width: 80 }}>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product, index) => {
                                    // Smart product info display
                                    const productInfo = [
                                        product.category,
                                        product.subcategory,
                                        product.material,
                                        // Dimensions
                                        (product.length || product.width || product.height)
                                            ? `${product.length || '-'}×${product.width || '-'}×${product.height || '-'} cm`
                                            : null,
                                        // Color
                                        product.color ? `สี${product.color}` : null,
                                        product.crystalColor ? `คริสตัล${product.crystalColor}` : null,
                                        // Lighting
                                        product.bulbType,
                                        product.light ? `แสง${product.light}` : null,
                                        product.remote ? `รีโมท${product.remote}` : null
                                    ].filter(Boolean).join(' • ');

                                    return (
                                        <tr key={product.id} className="hover-row">
                                            <td className="text-center">{index + 1}</td>
                                            <td>
                                                <div style={{
                                                    width: 50,
                                                    height: 50,
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 4,
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#f7fafc'
                                                }}>
                                                    {(product.images && product.images[0]) ? (
                                                        <img src={product.images[0]} alt={product.id} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span style={{ fontSize: 10, color: '#cbd5e0' }}>No Image</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="font-mono">
                                                <Link href={`/products/${product.id}`} className="product-link">
                                                    {product.id}
                                                </Link>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#4a5568' }}>
                                                    {productInfo || '-'}
                                                </div>
                                                {product.description && (
                                                    <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>
                                                        {product.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-right" style={{ fontWeight: 500 }}>
                                                ฿{product.price?.toLocaleString() || 0}
                                            </td>
                                            <td className="text-right">
                                                <span style={{
                                                    color: product.stock > 0 ? '#38a169' : '#e53e3e',
                                                    fontWeight: 500
                                                }}>
                                                    {product.stock || 0}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn-icon" onClick={() => handleEdit(product)} title="แก้ไข">
                                                    ✏️
                                                </button>
                                                <button className="btn-icon" onClick={() => handleDelete(product.id)} title="ลบ">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        ไม่พบสินค้า
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modal for Add/Edit */}
                {showModal && currentProduct && (
                    <div className="modal-overlay">
                        <div className="modal" style={{ maxWidth: '800px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h2 style={{ margin: 0 }}>{products.some(p => p.id === currentProduct.id) ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
                                {!products.some(p => p.id === currentProduct.id) && (
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ebf8ff', padding: '8px 12px', borderRadius: 6 }}
                                        title="สร้างรหัสอัตโนมัติจาก: [หมวดหมู่][เลขรัน]-[สี]-[ยาว]-[กว้าง]-[สูง] เช่น AC025-GLD-100-50-30"
                                    >
                                        <input
                                            type="checkbox"
                                            id="auto-gen"
                                            checked={isAutoId}
                                            onChange={(e) => setIsAutoId(e.target.checked)}
                                            style={{ width: 'auto', margin: 0 }}
                                        />
                                        <label htmlFor="auto-gen" style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#2b6cb0', cursor: 'pointer' }}>
                                            ✨ ระบบช่วยสร้างรหัสอัตโนมัติ
                                        </label>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSave}>
                                {/* Smart SKU Generator UI */}
                                {isAutoId && (
                                    <div style={{
                                        background: '#f0fff4',
                                        border: '1px solid #c6f6d5',
                                        borderRadius: 8,
                                        padding: 16,
                                        marginBottom: 24
                                    }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#2f855a', marginBottom: 12 }}>
                                            🤖 ตัวช่วยสร้างรหัส (Smart Generator)
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 8 }}>
                                            <div>
                                                <label style={{ fontSize: 12, color: '#4a5568' }}>หมวดหมู่</label>
                                                <select
                                                    value={genCategory}
                                                    onChange={(e) => setGenCategory(e.target.value)}
                                                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e0' }}
                                                >
                                                    {Object.keys(CATEGORY_PREFIXES).map(cat => (
                                                        <option key={cat} value={cat}>{cat} ({CATEGORY_PREFIXES[cat]})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, color: '#4a5568' }}>สี</label>
                                                <select
                                                    value={genColor}
                                                    onChange={(e) => setGenColor(e.target.value)}
                                                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e0' }}
                                                >
                                                    {Object.keys(COLOR_CODES).map(col => (
                                                        <option key={col} value={col}>{col}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, color: '#4a5568' }}>ยาว (L)</label>
                                                <input
                                                    type="text"
                                                    value={genL}
                                                    onChange={(e) => setGenL(e.target.value)}
                                                    placeholder="cm"
                                                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e0' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, color: '#4a5568' }}>กว้าง (W)</label>
                                                <input
                                                    type="text"
                                                    value={genW}
                                                    onChange={(e) => setGenW(e.target.value)}
                                                    placeholder="cm"
                                                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e0' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 12, color: '#4a5568' }}>สูง (H)</label>
                                                <input
                                                    type="text"
                                                    value={genH}
                                                    onChange={(e) => setGenH(e.target.value)}
                                                    placeholder="cm"
                                                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #cbd5e0' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                                            <span style={{ fontSize: 13, color: '#718096' }}>รหัสที่จะได้: </span>
                                            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#2f855a', fontFamily: 'monospace' }}>
                                                {CATEGORY_PREFIXES[genCategory]}{nextRunningNum}-{COLOR_CODES[genColor]}{genL ? `-${genL}` : ''}{genW ? `-${genW}` : ''}{genH ? `-${genH}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Product Images - 4 images in single row */}
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', marginBottom: 12, fontWeight: 500, fontSize: 14 }}>รูปภาพสินค้า (สูงสุด 4 รูป)</label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                                        gap: 8,
                                        maxWidth: 600,
                                        margin: '0 auto'
                                    }}>
                                        {[0, 1, 2, 3].map((index) => {
                                            const images = currentProduct.images || [];
                                            const image = images[index];

                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        width: '100%',
                                                        height: 100,
                                                        border: '2px dashed #cbd5e0',
                                                        borderRadius: 8,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        background: '#f7fafc'
                                                    }}
                                                >
                                                    {image ? (
                                                        <>
                                                            <img src={image} alt={`Product ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = [...(currentProduct.images || [])];
                                                                    newImages[index] = null;
                                                                    setCurrentProduct({ ...currentProduct, images: newImages.filter(Boolean) });
                                                                }}
                                                                style={{
                                                                    position: 'absolute', top: 2, right: 2,
                                                                    background: 'rgba(255,255,255,0.9)', border: 'none',
                                                                    borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
                                                                    color: '#e53e3e', fontWeight: 'bold', fontSize: 14,
                                                                    lineHeight: '20px', padding: 0
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: 11 }}>
                                                            <div style={{ fontSize: 20, marginBottom: 2 }}>+</div>
                                                            <div>รูป {index + 1}</div>
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', top: 0, left: 0 }}
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    const newImages = [...(currentProduct.images || [])];
                                                                    newImages[index] = reader.result;
                                                                    setCurrentProduct({ ...currentProduct, images: newImages });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#718096', marginTop: 6, textAlign: 'center' }}>คลิกที่ช่องเพื่ออัปโหลดรูปภาพ</div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>รหัสสินค้า *</label>
                                        <input
                                            type="text"
                                            value={currentProduct.id || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, id: e.target.value })}
                                            required
                                            placeholder="เช่น AA035-50-BLUE-WARM"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>ประเภทหลัก (Category) *</label>
                                        <input
                                            type="text"
                                            value={currentProduct.category || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                            list="list-category"
                                            placeholder="เช่น โคมไฟระย้า, โคมไฟกริ่ง"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ประเภทย่อย (Subcategory)</label>
                                        <input
                                            type="text"
                                            value={currentProduct.subcategory || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, subcategory: e.target.value })}
                                            list="list-subcategory"
                                            placeholder="เช่น LAVA, วงแหวนคริสตัล"
                                        />
                                    </div>
                                </div>

                                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <div className="form-group">
                                        <label>ยาว (cm)</label>
                                        <input type="text" value={currentProduct.length || ''} onChange={e => setCurrentProduct({ ...currentProduct, length: e.target.value })} placeholder="ความยาว" />
                                    </div>
                                    <div className="form-group">
                                        <label>กว้าง (cm)</label>
                                        <input type="text" value={currentProduct.width || ''} onChange={e => setCurrentProduct({ ...currentProduct, width: e.target.value })} placeholder="ความกว้าง" />
                                    </div>
                                    <div className="form-group">
                                        <label>สูง (cm)</label>
                                        <input type="text" value={currentProduct.height || ''} onChange={e => setCurrentProduct({ ...currentProduct, height: e.target.value })} placeholder="ความสูง" />
                                    </div>
                                </div>

                                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <div className="form-group">
                                        <label>วัสดุ</label>
                                        <input type="text" value={currentProduct.material || ''} onChange={e => setCurrentProduct({ ...currentProduct, material: e.target.value })} list="list-material" placeholder="เช่น แก้ว, คริสตัล" />
                                    </div>
                                    <div className="form-group">
                                        <label>สีโครงสร้าง</label>
                                        <input type="text" value={currentProduct.color || ''} onChange={e => setCurrentProduct({ ...currentProduct, color: e.target.value })} list="list-color" placeholder="เช่น ทอง, ดำ" />
                                    </div>
                                    <div className="form-group">
                                        <label>สีคริสตัล</label>
                                        <input type="text" value={currentProduct.crystalColor || ''} onChange={e => setCurrentProduct({ ...currentProduct, crystalColor: e.target.value })} list="list-crystalColor" placeholder="เช่น ใส, ชา" />
                                    </div>
                                </div>

                                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <div className="form-group">
                                        <label>หลอดไฟแบบ</label>
                                        <input type="text" value={currentProduct.bulbType || ''} onChange={e => setCurrentProduct({ ...currentProduct, bulbType: e.target.value })} list="list-bulbType" placeholder="เช่น E27, E14, LED" />
                                    </div>
                                    <div className="form-group">
                                        <label>แสงไฟ</label>
                                        <input type="text" value={currentProduct.light || ''} onChange={e => setCurrentProduct({ ...currentProduct, light: e.target.value })} list="list-light" placeholder="เช่น Warm, 3 แสง" />
                                    </div>
                                    <div className="form-group">
                                        <label>รีโมท</label>
                                        <input type="text" value={currentProduct.remote || ''} onChange={e => setCurrentProduct({ ...currentProduct, remote: e.target.value })} list="list-remote" placeholder="มี / ไม่มี" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>ราคา (บาท)</label>
                                        <input
                                            type="number"
                                            value={currentProduct.price || 0}
                                            onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>จำนวนคงเหลือ</label>
                                        <input
                                            type="number"
                                            value={currentProduct.stock || 0}
                                            onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>ยี่ห้อ (Brand)</label>
                                        <input
                                            type="text"
                                            value={currentProduct.brand || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, brand: e.target.value })}
                                            list="list-brand"
                                            placeholder="ยี่ห้อสินค้า"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ผู้จำหน่าย (Supplier)</label>
                                        <input
                                            type="text"
                                            value={currentProduct.supplier || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, supplier: e.target.value })}
                                            list="list-supplier"
                                            placeholder="ชื่อผู้จำหน่าย"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>การรับประกัน</label>
                                    <input
                                        type="text"
                                        value={currentProduct.warranty || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, warranty: e.target.value })}
                                        placeholder="เช่น 1 ปี, 2 ปี"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>หมายเหตุ</label>
                                    <textarea
                                        value={currentProduct.description || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                        rows="3"
                                        placeholder="รายละเอียดเพิ่มเติม"
                                    ></textarea>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
                                    <button type="submit" className="btn-primary">บันทึก</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Datalists */}
                <datalist id="list-category">
                    {[...new Set(products.map(p => p.category).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-subcategory">
                    {[...new Set(products.map(p => p.subcategory).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-brand">
                    {[...new Set(products.map(p => p.brand).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-supplier">
                    {[...new Set(products.map(p => p.supplier).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-material">
                    {[...new Set(products.map(p => p.material).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-color">
                    {[...new Set(products.map(p => p.color).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-crystalColor">
                    {[...new Set(products.map(p => p.crystalColor).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-bulbType">
                    {[...new Set(products.map(p => p.bulbType).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-light">
                    {[...new Set(products.map(p => p.light).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>
                <datalist id="list-remote">
                    {[...new Set(products.map(p => p.remote).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
                </datalist>

                <style jsx>{`
                    .product-page {
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
                    }
                    .header-content h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #1a202c;
                    }
                    .btn-back {
                        color: #718096;
                        text-decoration: none;
                        font-size: 14px;
                    }
                    .btn-back:hover {
                        text-decoration: underline;
                    }
                    .btn-primary {
                        background: #0070f3;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                    }
                    .btn-primary:hover {
                        background: #0060df;
                    }
                    .btn-back-white {
                        background: white;
                        color: #4a5568;
                        border: 1px solid #e2e8f0;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        text-decoration: none;
                        display: inline-block;
                        transition: all 0.2s;
                    }
                    .btn-back-white:hover {
                        background: #f7fafc;
                        border-color: #cbd5e0;
                    }
                    .search-bar {
                        margin-bottom: 24px;
                    }
                    .search-bar input {
                        width: 100%;
                        padding: 12px 16px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 16px;
                    }
                    .table-container {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        overflow: hidden;
                    }
                    .product-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .product-table th {
                        background: #f7fafc;
                        padding: 12px 16px;
                        text-align: left;
                        font-size: 13px;
                        font-weight: 600;
                        color: #4a5568;
                        border-bottom: 2px solid #edf2f7;
                    }
                    .product-table td {
                        padding: 12px 16px;
                        border-bottom: 1px solid #edf2f7;
                        color: #2d3748;
                        font-size: 14px;
                    }
                    .font-mono { font-family: monospace; }
                    .font-bold { font-weight: 600; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .text-muted { color: #718096; font-size: 13px; }
                    .type-badge {
                        background: #edf2f7;
                        color: #4a5568;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                    }
                    .btn-icon {
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 16px;
                        padding: 4px;
                    }
                    .btn-icon:hover { transform: scale(1.1); }
                    .empty-state { padding: 32px; color: #a0aec0; }
                    
                    /* Modal */
                    .modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                    }
                    .modal {
                        background: white;
                        padding: 24px;
                        border-radius: 8px;
                        width: 100%;
                        max-width: 800px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        max-height: 90vh;
                        overflow-y: auto;
                    }
                    .modal h2 { margin-top: 0; }
                    .form-group { margin-bottom: 16px; }
                    .form-group label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 14px; }
                    .form-group input, .form-group textarea {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        box-sizing: border-box;
                    }
                    .form-row { 
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px; 
                    }
                    .modal-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        margin-top: 24px;
                    }
                    .btn-secondary {
                        background: #edf2f7;
                        color: #4a5568;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .btn-secondary:hover { background: #e2e8f0; }
                    
                    .product-link {
                        color: #0070f3;
                        text-decoration: none;
                        font-weight: 600;
                    }
                    .product-link:hover {
                        text-decoration: underline;
                    }
                    .product-link.text-dark {
                        color: #2d3748;
                    }
                    .product-link.text-dark:hover {
                        color: #0070f3;
                    }
                    .hover-row {
                        transition: background-color 0.2s;
                    }
                    .hover-row:hover {
                        background: #f7fafc;
                    }
                `}</style>
            </div>
        </>
    )
}
