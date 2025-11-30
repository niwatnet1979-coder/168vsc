import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function NewCustomerPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('customer') // customer, tax, address, orders

    // Initial Empty State
    const initialFormState = {
        name: '',
        phone: '',
        email: '',
        line: '',
        facebook: '',
        instagram: '',
        mediaSource: '',
        mediaSourceOther: '',
        contact1: { name: '', phone: '' },
        contact2: { name: '', phone: '' },
        taxInvoices: [],
        savedAddresses: [],
        orders: []
    }

    const [formData, setFormData] = useState(initialFormState)

    const handleSave = () => {
        if (!formData.name) {
            alert('กรุณากรอกชื่อลูกค้า/บริษัท')
            return
        }

        // Load existing customers
        const savedData = localStorage.getItem('customers_data')
        let customers = savedData ? JSON.parse(savedData) : []

        // Generate new ID
        const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1

        // Add new customer
        const newCustomer = { ...formData, id: newId }
        customers.push(newCustomer)

        // Save to LocalStorage
        localStorage.setItem('customers_data', JSON.stringify(customers))

        alert('บันทึกข้อมูลลูกค้าเรียบร้อย')
        router.push('/customers')
    }

    const handleChange = (field, value, parent = null) => {
        if (parent) {
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [field]: value
                }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }))
        }
    }

    const handleAddTaxInvoice = () => {
        setFormData(prev => ({
            ...prev,
            taxInvoices: [
                ...(prev.taxInvoices || []),
                {
                    companyName: '',
                    taxId: '',
                    branch: '',
                    address: '',
                    phone: '',
                    email: '',
                    deliveryAddress: ''
                }
            ]
        }))
    }

    const handleRemoveTaxInvoice = (index) => {
        const newTaxInvoices = [...formData.taxInvoices]
        newTaxInvoices.splice(index, 1)
        setFormData(prev => ({
            ...prev,
            taxInvoices: newTaxInvoices
        }))
    }

    const handleAddAddress = () => {
        setFormData(prev => ({
            ...prev,
            savedAddresses: [
                ...(prev.savedAddresses || []),
                {
                    name: '',
                    address: '',
                    mapLink: '',
                    inspector1: '',
                    inspector1Phone: '',
                    inspector2: '',
                    inspector2Phone: ''
                }
            ]
        }))
    }

    const handleRemoveAddress = (index) => {
        const newAddresses = [...formData.savedAddresses]
        newAddresses.splice(index, 1)
        setFormData(prev => ({
            ...prev,
            savedAddresses: newAddresses
        }))
    }

    return (
        <>
            <Head>
                <title>เพิ่มลูกค้าใหม่ - 168APP</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="detail-page">
                <header className="page-header">
                    <button className="btn-back" onClick={() => router.push('/customers')}>
                        ← กลับหน้ารายชื่อ
                    </button>
                    <h1>เพิ่มลูกค้าใหม่</h1>
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
                            สถานที่ติดตั้ง/จัดส่ง (Installation/Delivery Address)
                        </button>
                        {/* Note: Order Items tab is hidden for new customer creation as there are no orders yet */}
                    </div>

                    <div className="tab-content">
                        {/* 1. Customer Info Tab */}
                        {activeTab === 'customer' && (
                            <>
                                <div className="tab-actions">
                                    <button className="btn-cancel" onClick={() => router.push('/customers')}>ยกเลิก</button>
                                    <button className="btn-save" onClick={handleSave}>บันทึก</button>
                                </div>
                                <div className="content-card">
                                    <div className="info-grid">
                                        <div className="info-group span-2">
                                            <label>ชื่อลูกค้า / บริษัท *</label>
                                            <input
                                                className="edit-input"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>เบอร์โทรศัพท์</label>
                                            <input
                                                className="edit-input"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>อีเมล</label>
                                            <input
                                                className="edit-input"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>LINE ID</label>
                                            <input
                                                className="edit-input"
                                                value={formData.line}
                                                onChange={(e) => handleChange('line', e.target.value)}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>Facebook</label>
                                            <input
                                                className="edit-input"
                                                value={formData.facebook}
                                                onChange={(e) => handleChange('facebook', e.target.value)}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>Instagram</label>
                                            <input
                                                className="edit-input"
                                                value={formData.instagram}
                                                onChange={(e) => handleChange('instagram', e.target.value)}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>สื่อที่ลูกค้าเห็น</label>
                                            <select
                                                className="edit-input"
                                                value={formData.mediaSource}
                                                onChange={(e) => handleChange('mediaSource', e.target.value)}
                                            >
                                                <option value="">-- เลือกสื่อ --</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Google">Google</option>
                                                <option value="Line@">Line@</option>
                                                <option value="TikTok">TikTok</option>
                                                <option value="เพื่อนแนะนำ">เพื่อนแนะนำ</option>
                                                <option value="ป้ายโฆษณา">ป้ายโฆษณา</option>
                                                <option value="อื่นๆระบุ">อื่นๆ ระบุ</option>
                                            </select>
                                        </div>
                                        {formData.mediaSource === 'อื่นๆระบุ' && (
                                            <div className="info-group">
                                                <label>ระบุสื่ออื่นๆ</label>
                                                <input
                                                    className="edit-input"
                                                    value={formData.mediaSourceOther}
                                                    onChange={(e) => handleChange('mediaSourceOther', e.target.value)}
                                                />
                                            </div>
                                        )}
                                        <div className="divider"></div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 1 (ชื่อ)</label>
                                            <input
                                                className="edit-input"
                                                value={formData.contact1?.name}
                                                onChange={(e) => handleChange('name', e.target.value, 'contact1')}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 1 (เบอร์โทร)</label>
                                            <input
                                                className="edit-input"
                                                value={formData.contact1?.phone}
                                                onChange={(e) => handleChange('phone', e.target.value, 'contact1')}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 2 (ชื่อ)</label>
                                            <input
                                                className="edit-input"
                                                value={formData.contact2?.name}
                                                onChange={(e) => handleChange('name', e.target.value, 'contact2')}
                                            />
                                        </div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 2 (เบอร์โทร)</label>
                                            <input
                                                className="edit-input"
                                                value={formData.contact2?.phone}
                                                onChange={(e) => handleChange('phone', e.target.value, 'contact2')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 2. Tax Invoice Tab */}
                        {activeTab === 'tax' && (
                            <>
                                <div className="tab-actions">
                                    <button className="btn-add-tab" onClick={handleAddTaxInvoice}>+ เพิ่มข้อมูล</button>
                                    <button className="btn-cancel" onClick={() => router.push('/customers')}>ยกเลิก</button>
                                    <button className="btn-save" onClick={handleSave}>บันทึก</button>
                                </div>
                                <div className="tax-list">
                                    {formData.taxInvoices?.map((tax, i) => (
                                        <div key={i} className="tax-card">
                                            <div className="card-header">
                                                <h3>ข้อมูลชุดที่ {i + 1}</h3>
                                                <button className="btn-remove" onClick={() => handleRemoveTaxInvoice(i)}>ลบ</button>
                                            </div>
                                            <div className="info-grid">
                                                <div className="info-group span-2">
                                                    <label>ชื่อบริษัท (Company Name)</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.companyName}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], companyName: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>เลขประจำตัวผู้เสียภาษี</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.taxId}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], taxId: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>สาขา</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.branch}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], branch: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>เบอร์โทรศัพท์</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.phone}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], phone: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>อีเมล</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.email}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], email: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group span-2">
                                                    <label>ที่อยู่ใบกำกับภาษี</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.address}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], address: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group span-2">
                                                    <label>ที่อยู่จัดส่ง (Delivery Address)</label>
                                                    <input
                                                        className="edit-input"
                                                        value={tax.deliveryAddress}
                                                        onChange={(e) => {
                                                            const newTaxInvoices = [...formData.taxInvoices];
                                                            newTaxInvoices[i] = { ...newTaxInvoices[i], deliveryAddress: e.target.value };
                                                            setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!formData.taxInvoices || formData.taxInvoices.length === 0) && (
                                        <div className="empty-state">กดปุ่ม "+ เพิ่มข้อมูล" เพื่อเพิ่มใบกำกับภาษี</div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 3. Address Tab */}
                        {activeTab === 'address' && (
                            <>
                                <div className="tab-actions">
                                    <button className="btn-add-tab" onClick={handleAddAddress}>+ เพิ่มข้อมูล</button>
                                    <button className="btn-cancel" onClick={() => router.push('/customers')}>ยกเลิก</button>
                                    <button className="btn-save" onClick={handleSave}>บันทึก</button>
                                </div>
                                <div className="address-list">
                                    {formData.savedAddresses?.map((addr, i) => (
                                        <div key={i} className="content-card">
                                            <div className="card-header">
                                                <h3>สถานที่ {i + 1}</h3>
                                                <button className="btn-remove" onClick={() => handleRemoveAddress(i)}>ลบ</button>
                                            </div>
                                            <div className="info-grid">
                                                <div className="info-group">
                                                    <label>ชื่อสถานที่ (Location Name)</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.name}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], name: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group span-2">
                                                    <label>ที่อยู่ (Address)</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.address}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], address: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>Google Maps Link</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.mapLink}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], mapLink: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                                <div className="divider"></div>
                                                <div className="info-group">
                                                    <label>ผู้ตรวจงาน 1</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.inspector1}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], inspector1: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>เบอร์โทร</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.inspector1Phone}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], inspector1Phone: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>ผู้ตรวจงาน 2</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.inspector2}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], inspector2: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                                <div className="info-group">
                                                    <label>เบอร์โทร</label>
                                                    <input
                                                        className="edit-input"
                                                        value={addr.inspector2Phone}
                                                        onChange={(e) => {
                                                            const newAddresses = [...formData.savedAddresses];
                                                            newAddresses[i] = { ...newAddresses[i], inspector2Phone: e.target.value };
                                                            setFormData({ ...formData, savedAddresses: newAddresses });
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!formData.savedAddresses || formData.savedAddresses.length === 0) && (
                                        <div className="empty-state">กดปุ่ม "+ เพิ่มข้อมูล" เพื่อเพิ่มสถานที่ติดตั้ง/จัดส่ง</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <style jsx>{`
                    .detail-page {
                        min-height: 100vh;
                        background-color: #f8f9fa;
                        font-family: 'Sarabun', sans-serif;
                        padding: 24px 40px;
                    }
                    .page-header {
                        background: white;
                        padding: 24px 32px;
                        border-radius: 12px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        margin-bottom: 24px;
                    }
                    .btn-back {
                        background: none;
                        border: none;
                        color: #64748b;
                        font-size: 14px;
                        cursor: pointer;
                        padding: 0;
                        margin-bottom: 12px;
                        font-weight: 500;
                    }
                    .btn-back:hover {
                        color: #334155;
                        text-decoration: underline;
                    }
                    .page-header h1 {
                        margin: 0;
                        font-size: 28px;
                        color: #1a202c;
                    }
                    
                    /* Tabs */
                    .tabs-container {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        overflow: hidden;
                        min-height: 600px;
                    }
                    .tabs-header {
                        display: flex;
                        border-bottom: 1px solid #e2e8f0;
                        background: #f8fafc;
                    }
                    .tab-btn {
                        padding: 16px 24px;
                        background: none;
                        border: none;
                        border-bottom: 2px solid transparent;
                        font-size: 14px;
                        font-weight: 600;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .tab-btn.active {
                        color: #2563eb;
                        border-bottom-color: #2563eb;
                        background: white;
                    }
                    .tab-btn:hover:not(.active) {
                        background: #f1f5f9;
                        color: #334155;
                    }
                    
                    .tab-content {
                        padding: 32px;
                    }
                    .tab-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        margin-bottom: 24px;
                    }
                    
                    /* Buttons */
                    .btn-save {
                        background: #2563eb;
                        color: white;
                        border: none;
                        padding: 8px 20px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .btn-save:hover { background: #1d4ed8; }
                    
                    .btn-cancel {
                        background: white;
                        border: 1px solid #e2e8f0;
                        color: #64748b;
                        padding: 8px 20px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .btn-cancel:hover { background: #f1f5f9; }

                    .btn-add-tab {
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 8px 20px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    .btn-add-tab:hover { background: #059669; }

                    .btn-remove {
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 4px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                    }
                    
                    /* Content Card */
                    .content-card, .tax-card {
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 24px;
                        margin-bottom: 24px;
                    }
                    .card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 12px;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .card-header h3 {
                        margin: 0;
                        font-size: 16px;
                        color: #1e293b;
                    }

                    /* Grid Layout */
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
                    .info-group.span-2 {
                        grid-column: span 2;
                    }
                    .info-group label {
                        font-size: 13px;
                        font-weight: 500;
                        color: #64748b;
                    }
                    .value {
                        font-size: 15px;
                        color: #1e293b;
                        padding: 8px 0;
                        font-weight: 500;
                    }
                    .edit-input {
                        padding: 10px 12px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        width: 100%;
                    }
                    .edit-input:focus {
                        outline: none;
                        border-color: #2563eb;
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    }
                    .divider {
                        grid-column: 1 / -1;
                        height: 1px;
                        background: #e2e8f0;
                        margin: 8px 0;
                    }
                    .empty-state {
                        text-align: center;
                        padding: 40px;
                        color: #94a3b8;
                        background: #f8fafc;
                        border-radius: 12px;
                        border: 2px dashed #e2e8f0;
                    }
                `}</style>
            </div>
        </>
    )
}
