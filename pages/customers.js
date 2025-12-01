import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { MOCK_CUSTOMERS_DATA } from '../lib/mockData'

export default function CustomersPage() {
    const [customers, setCustomers] = useState(MOCK_CUSTOMERS_DATA)

    // Load data from LocalStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('customers_data')
        if (savedData) {
            setCustomers(JSON.parse(savedData))
        }
    }, [])

    // Save data to LocalStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('customers_data', JSON.stringify(customers))
    }, [customers])

    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        line: '',
        facebook: '',
        instagram: '',
        mediaSource: '',
        mediaSourceOther: '',
        contact1: { name: '', phone: '' },
        contact2: { name: '', phone: '' }
    })

    const handleAdd = () => {
        setEditingCustomer(null)
        setFormData({
            name: '',
            phone: '',
            email: '',
            line: '',
            facebook: '',
            instagram: '',
            mediaSource: '',
            mediaSourceOther: '',
            contact1: { name: '', phone: '' },
            contact2: { name: '', phone: '' }
        })
        setShowModal(true)
    }

    const handleEdit = (customer) => {
        setEditingCustomer(customer)
        setFormData({ ...customer })
        setShowModal(true)
    }

    const handleDelete = (id) => {
        if (confirm('คุณต้องการลบข้อมูลลูกค้านี้หรือไม่?')) {
            setCustomers(customers.filter(c => c.id !== id))
        }
    }

    const handleSave = () => {
        if (!formData.name || !formData.phone) {
            alert('กรุณากรอกชื่อและเบอร์โทรศัพท์')
            return
        }

        if (editingCustomer) {
            // Update existing
            setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...formData, id: c.id } : c))
        } else {
            // Add new
            const newId = Math.max(...customers.map(c => c.id), 0) + 1
            setCustomers([...customers, { ...formData, id: newId }])
        }
        setShowModal(false)
    }

    const handleFormChange = (field, value, parent = null) => {
        if (parent) {
            setFormData({
                ...formData,
                [parent]: { ...formData[parent], [field]: value }
            })
        } else {
            setFormData({ ...formData, [field]: value })
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Icons
    const SearchIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    )

    const BackIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
    )

    const DeleteIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
    )

    return (
        <>
            <Head>
                <title>จัดการข้อมูลลูกค้า - Customer Management</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="page-container">
                <header className="page-header">
                    <div className="header-left">
                        <Link href="/" className="btn-back-circle">
                            <BackIcon />
                        </Link>
                        <h1>จัดการข้อมูลลูกค้า (Customer Management)</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => {
                                if (confirm('คุณต้องการรีเซ็ตข้อมูลลูกค้าเป็นค่าเริ่มต้นหรือไม่? ข้อมูลที่แก้ไขจะหายไปทั้งหมด')) {
                                    localStorage.removeItem('customers_data');
                                    setCustomers(MOCK_CUSTOMERS_DATA);
                                    alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
                                }
                            }}
                            className="btn-secondary"
                            style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                        >
                            ↻ รีเซ็ตข้อมูล
                        </button>
                        <Link href="/customers/new" className="btn-primary">+ เพิ่มลูกค้าใหม่</Link>
                    </div>
                </header>

                <main className="main-content">
                    <div className="search-container">
                        <div className="search-wrapper">
                            <div className="search-icon">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหา ชื่อ, เบอร์โทร, อีเมล..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="table-card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ชื่อลูกค้า/บริษัท</th>
                                    <th>เบอร์โทรศัพท์</th>
                                    <th>อีเมล</th>
                                    <th>LINE ID</th>
                                    <th>สื่อที่เห็น</th>
                                    <th>ผู้ติดต่อ 1</th>
                                    <th>ผู้ติดต่อ 2</th>
                                    <th>สั่งซื้อล่าสุด</th>
                                    <th style={{ textAlign: 'right' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer, index) => (
                                    <tr key={customer.id}>
                                        <td><span className="text-id">{index + 1}</span></td>
                                        <td>
                                            <Link href={`/customers/${customer.id}`} className="customer-name-link">
                                                {customer.name}
                                            </Link>
                                        </td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.line}</td>
                                        <td>
                                            {customer.mediaSource === 'อื่นๆระบุ'
                                                ? customer.mediaSourceOther
                                                : customer.mediaSource}
                                        </td>
                                        <td>
                                            {customer.contact1.name && (
                                                <div className="contact-info">
                                                    <div>{customer.contact1.name}</div>
                                                    <small>{customer.contact1.phone}</small>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {customer.contact2.name && (
                                                <div className="contact-info">
                                                    <div>{customer.contact2.name}</div>
                                                    <small>{customer.contact2.phone}</small>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {customer.lastOrder || '-'}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={() => handleDelete(customer.id)} title="ลบ">
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCustomers.length === 0 && (
                            <div className="empty-state">ไม่พบข้อมูลลูกค้า</div>
                        )}
                    </div>
                </main>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h3>
                                <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>ชื่อลูกค้า / บริษัท *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => handleFormChange('name', e.target.value)}
                                            placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>เบอร์โทรศัพท์ *</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => handleFormChange('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>อีเมล</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => handleFormChange('email', e.target.value)}
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>LINE ID</label>
                                        <input
                                            type="text"
                                            value={formData.line}
                                            onChange={e => handleFormChange('line', e.target.value)}
                                            placeholder="@lineid"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Facebook</label>
                                        <input
                                            type="text"
                                            value={formData.facebook}
                                            onChange={e => handleFormChange('facebook', e.target.value)}
                                            placeholder="facebook.com/..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Instagram</label>
                                        <input
                                            type="text"
                                            value={formData.instagram}
                                            onChange={e => handleFormChange('instagram', e.target.value)}
                                            placeholder="@instagram"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>สื่อที่ลูกค้าเห็น</label>
                                        <select
                                            value={formData.mediaSource}
                                            onChange={e => handleFormChange('mediaSource', e.target.value)}
                                        >
                                            <option value="">-- เลือกสื่อ --</option>
                                            <option value="Facebook">Facebook</option>
                                            <option value="Line@">Line@</option>
                                            <option value="Google">Google</option>
                                            <option value="เพื่อนแนะนำ">เพื่อนแนะนำ</option>
                                            <option value="อื่นๆระบุ">อื่นๆระบุ</option>
                                        </select>
                                    </div>
                                    {formData.mediaSource === 'อื่นๆระบุ' && (
                                        <div className="form-group">
                                            <label>ระบุสื่ออื่นๆ</label>
                                            <input
                                                type="text"
                                                value={formData.mediaSourceOther}
                                                onChange={e => handleFormChange('mediaSourceOther', e.target.value)}
                                                placeholder="โปรดระบุ..."
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>ผู้ติดต่อ 1</label>
                                        <input
                                            type="text"
                                            value={formData.contact1.name}
                                            onChange={e => handleFormChange('name', e.target.value, 'contact1')}
                                            placeholder="ชื่อ"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>เบอร์โทร</label>
                                        <input
                                            type="text"
                                            value={formData.contact1.phone}
                                            onChange={e => handleFormChange('phone', e.target.value, 'contact1')}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ผู้ติดต่อ 2</label>
                                        <input
                                            type="text"
                                            value={formData.contact2.name}
                                            onChange={e => handleFormChange('name', e.target.value, 'contact2')}
                                            placeholder="ชื่อ"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>เบอร์โทร</label>
                                        <input
                                            type="text"
                                            value={formData.contact2.phone}
                                            onChange={e => handleFormChange('phone', e.target.value, 'contact2')}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
                                <button className="btn-primary" onClick={handleSave}>บันทึก</button>
                            </div>
                        </div>
                    </div>
                )}

                <style jsx>{`
                    .page-container {
                        min-height: 100vh;
                        background-color: #f8f9fa;
                        font-family: 'Sarabun', sans-serif;
                        padding: 24px 40px;
                    }
                    .page-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                    }
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .btn-back-circle {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: white;
                        border: 1px solid #e2e8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #4a5568;
                        transition: all 0.2s;
                    }
                    .btn-back-circle:hover {
                        background: #f7fafc;
                        border-color: #cbd5e0;
                    }
                    .page-header h1 {
                        font-size: 24px;
                        color: #1a202c;
                        margin: 0;
                        font-weight: 600;
                    }
                    .btn-primary {
                        background: #2563eb;
                        color: white;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
                    }
                    .btn-primary:hover {
                        background: #1d4ed8;
                    }

                    /* Search */
                    .search-container {
                        margin-bottom: 24px;
                    }
                    .search-wrapper {
                        position: relative;
                        width: 100%;
                    }
                    .search-icon {
                        position: absolute;
                        left: 16px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #9ca3af;
                        display: flex;
                    }
                    .search-input {
                        width: 100%;
                        padding: 14px 16px 14px 48px;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        font-size: 15px;
                        background: white;
                        transition: all 0.2s;
                    }
                    .search-input:focus {
                        outline: none;
                        border-color: #2563eb;
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    }

                    /* Table */
                    .table-card {
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .data-table th {
                        background: white;
                        padding: 16px 24px;
                        text-align: left;
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .data-table td {
                        padding: 20px 24px;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 14px;
                        color: #334155;
                        vertical-align: top;
                    }
                    .data-table tr:last-child td {
                        border-bottom: none;
                    }
                    .data-table tr:hover {
                        background: #f8fafc;
                    }
                    .text-id {
                        font-family: monospace;
                        color: #475569;
                        font-weight: 500;
                    }
                    .customer-name-link {
                        color: #2563eb;
                        text-decoration: none;
                        font-weight: 600;
                        transition: color 0.2s;
                    }
                    .customer-name-link:hover {
                        color: #1d4ed8;
                        text-decoration: underline;
                    }
                    .contact-info small {
                        display: block;
                        color: #64748b;
                        margin-top: 2px;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    }
                    .btn-icon {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .btn-icon:hover {
                        background: #f1f5f9;
                    }
                    .empty-state {
                        padding: 60px;
                        text-align: center;
                        color: #94a3b8;
                    }

                    /* Modal */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        backdrop-filter: blur(2px);
                    }
                    .modal-content {
                        background: white;
                        border-radius: 16px;
                        width: 700px;
                        max-width: 90%;
                        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                        max-height: 90vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .modal-header {
                        padding: 20px 24px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 18px;
                        color: #1a202c;
                        font-weight: 600;
                    }
                    .btn-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        color: #94a3b8;
                        cursor: pointer;
                        padding: 0;
                        line-height: 1;
                    }
                    .modal-body {
                        padding: 24px;
                        overflow-y: auto;
                    }
                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }
                    .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                    }
                    .form-group.full-width {
                        grid-column: span 2;
                    }
                    .form-group label {
                        font-size: 13px;
                        font-weight: 500;
                        color: #64748b;
                    }
                    .form-group input, .form-group select {
                        padding: 10px 12px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        transition: all 0.2s;
                    }
                    .form-group input:focus, .form-group select:focus {
                        outline: none;
                        border-color: #2563eb;
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    }
                    .modal-footer {
                        padding: 20px 24px;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        background: #f8fafc;
                        border-radius: 0 0 16px 16px;
                    }
                    .btn-secondary {
                        background: white;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-secondary:hover {
                        background: #f1f5f9;
                        border-color: #cbd5e0;
                    }
                `}</style>
            </div>
        </>
    )
}
