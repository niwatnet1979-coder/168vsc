
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function CustomersPage() {
    const [customers, setCustomers] = useState([
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
            contact2: { name: 'สมหญิง รักงาน', phone: '082-345-6789' }
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
            contact2: { name: 'สุดา แสงจันทร์', phone: '084-567-8901' }
        },
        {
            id: 3,
            name: 'บริษัท การค้าสากล จำกัด',
            phone: '02-345-6789',
            email: 'contact@international.co.th',
            line: '@intltrade',
            facebook: '',
            instagram: '',
            mediaSource: 'เพื่อนแนะนำ',
            mediaSourceOther: '',
            contact1: { name: 'ประยุทธ์ มั่นคง', phone: '085-678-9012' },
            contact2: { name: 'อรุณี สว่างไสว', phone: '086-789-0123' }
        },
        {
            id: 4,
            name: 'ห้างหุ้นส่วน ดีไซน์ครีเอทีฟ',
            phone: '02-456-7890',
            email: 'hello@designcreative.com',
            line: '@designcreate',
            facebook: 'facebook.com/designcreative',
            instagram: '@design_creative',
            mediaSource: 'Line@',
            mediaSourceOther: '',
            contact1: { name: 'ชัยวัฒน์ สร้างสรรค์', phone: '087-890-1234' },
            contact2: { name: 'พิมพ์ใจ งามสง่า', phone: '088-901-2345' }
        },
        {
            id: 5,
            name: 'คุณสมศักดิ์ เจริญสุข',
            phone: '089-012-3456',
            email: 'somsak@email.com',
            line: '@somsak',
            facebook: '',
            instagram: '@somsak_personal',
            mediaSource: 'อื่นๆระบุ',
            mediaSourceOther: 'ป้ายโฆษณา',
            contact1: { name: 'สมศักดิ์ เจริญสุข', phone: '089-012-3456' },
            contact2: { name: '', phone: '' }
        },
        {
            id: 6,
            name: 'บริษัท อาหารและเครื่องดื่ม จำกัด',
            phone: '02-567-8901',
            email: 'info@foodbev.co.th',
            line: '@foodbeverage',
            facebook: 'facebook.com/foodbeverage',
            instagram: '@food_beverage_th',
            mediaSource: 'Facebook',
            mediaSourceOther: '',
            contact1: { name: 'นภา สุขสันต์', phone: '090-123-4567' },
            contact2: { name: 'ธนา เจริญทรัพย์', phone: '091-234-5678' }
        },
        {
            id: 7,
            name: 'ร้านเฟอร์นิเจอร์โมเดิร์น',
            phone: '02-678-9012',
            email: 'modern@furniture.com',
            line: '@modernfurniture',
            facebook: 'facebook.com/modernfurniture',
            instagram: '@modern_furniture',
            mediaSource: 'Google',
            mediaSourceOther: '',
            contact1: { name: 'สุรชัย ดีงาม', phone: '092-345-6789' },
            contact2: { name: 'มาลี สวยงาม', phone: '093-456-7890' }
        },
        {
            id: 8,
            name: 'บริษัท ก่อสร้างและพัฒนา จำกัด',
            phone: '02-789-0123',
            email: 'construction@develop.co.th',
            line: '@construct',
            facebook: '',
            instagram: '',
            mediaSource: 'เพื่อนแนะนำ',
            mediaSourceOther: '',
            contact1: { name: 'วิทยา แข็งแรง', phone: '094-567-8901' },
            contact2: { name: 'สมบูรณ์ มั่นคง', phone: '095-678-9012' }
        },
        {
            id: 9,
            name: 'คุณสุภาพร ใจดี',
            phone: '096-789-0123',
            email: 'supaporn@gmail.com',
            line: '@supaporn',
            facebook: 'facebook.com/supaporn',
            instagram: '@supaporn_shop',
            mediaSource: 'Line@',
            mediaSourceOther: '',
            contact1: { name: 'สุภาพร ใจดี', phone: '096-789-0123' },
            contact2: { name: '', phone: '' }
        },
        {
            id: 10,
            name: 'บริษัท เทคโนโลยีสารสนเทศ จำกัด',
            phone: '02-890-1234',
            email: 'it@technology.co.th',
            line: '@ittech',
            facebook: 'facebook.com/ittechnology',
            instagram: '@it_technology',
            mediaSource: 'อื่นๆระบุ',
            mediaSourceOther: 'TikTok',
            contact1: { name: 'ธีระ เทคโนโลยี', phone: '097-890-1234' },
            contact2: { name: 'ปิยะ ดิจิทัล', phone: '098-901-2345' }
        }
    ])

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

    return (
        <>
            <Head>
                <title>จัดการข้อมูลลูกค้า - Customer Management</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600&display=swap" rel="stylesheet" />
            </Head>

            <div className="customers-page">
                <header className="page-header">
                    <h1>จัดการข้อมูลลูกค้า (Customer Management)</h1>
                    <div className="header-actions">
                        <input
                            type="text"
                            placeholder="ค้นหา ชื่อ, เบอร์โทร, อีเมล..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button className="btn-primary" onClick={handleAdd}>+ เพิ่มลูกค้าใหม่</button>
                    </div>
                </header>

                <div className="table-container">
                    <table className="customers-table">
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
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer, index) => (
                                <tr key={customer.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Link href={`/customers/${customer.id}`} className="customer-name-link">
                                            <strong>{customer.name}</strong>
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
                                            <div>
                                                <div>{customer.contact1.name}</div>
                                                <small style={{ color: '#666' }}>{customer.contact1.phone}</small>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {customer.contact2.name && (
                                            <div>
                                                <div>{customer.contact2.name}</div>
                                                <small style={{ color: '#666' }}>{customer.contact2.phone}</small>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-edit" onClick={() => handleEdit(customer)}>แก้ไข</button>
                                            <button className="btn-delete" onClick={() => handleDelete(customer.id)}>ลบ</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <div className="no-data">ไม่พบข้อมูลลูกค้า</div>
                    )}
                </div>

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
                    .customers-page {
                        min-height: 100vh;
                        background: #f5f7fa;
                        padding: 24px;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .page-header {
                        background: white;
                        padding: 20px 24px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .page-header h1 {
                        margin: 0;
                        font-size: 24px;
                        color: #1a202c;
                    }
                    .header-actions {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                    }
                    .search-input {
                        padding: 8px 16px;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        font-size: 14px;
                        width: 300px;
                    }
                    .search-input:focus {
                        outline: none;
                        border-color: #0070f3;
                    }
                    .btn-primary {
                        background: #0070f3;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    .btn-primary:hover {
                        background: #0051cc;
                    }
                    .btn-secondary {
                        background: #fff;
                        color: #666;
                        border: 1px solid #ddd;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    .btn-secondary:hover {
                        background: #f7fafc;
                    }
                    .table-container {
                        background: white;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        overflow: hidden;
                        overflow-x: auto;
                    }
                    .customers-table {
                        width: 100%;
                        border-collapse: collapse;
                        min-width: 1000px;
                    }
                    .customers-table th {
                        background: #f7fafc;
                        padding: 12px;
                        text-align: left;
                        font-size: 13px;
                        font-weight: 600;
                        color: #4a5568;
                        border-bottom: 2px solid #edf2f7;
                        white-space: nowrap;
                    }
                    .customers-table td {
                        padding: 12px;
                        border-bottom: 1px solid #edf2f7;
                        font-size: 14px;
                        vertical-align: top;
                    }
                    .customers-table tr:hover {
                        background: #f7fafc;
                    }
                    .customer-name-link {
                        color: #0070f3;
                        text-decoration: none;
                        cursor: pointer;
                    }
                    .customer-name-link:hover {
                        text-decoration: underline;
                    }
                    .action-buttons {
                        display: flex;
                        gap: 8px;
                    }
                    .btn-edit {
                        background: #0070f3;
                        color: white;
                        border: none;
                        padding: 4px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .btn-edit:hover {
                        background: #0051cc;
                    }
                    .btn-delete {
                        background: #e53e3e;
                        color: white;
                        border: none;
                        padding: 4px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    }
                    .btn-delete:hover {
                        background: #c53030;
                    }
                    .no-data {
                        text-align: center;
                        padding: 40px;
                        color: #a0aec0;
                        font-size: 16px;
                    }
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
                    }
                    .modal-content {
                        background: white;
                        border-radius: 8px;
                        width: 700px;
                        max-width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        display: flex;
                        flex-direction: column;
                    }
                    .modal-header {
                        padding: 16px 24px;
                        border-bottom: 1px solid #edf2f7;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 18px;
                        color: #2d3748;
                    }
                    .btn-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #a0aec0;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .btn-close:hover {
                        color: #4a5568;
                    }
                    .modal-body {
                        padding: 24px;
                    }
                    .modal-footer {
                        padding: 16px 24px;
                        border-top: 1px solid #edf2f7;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                    }
                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    }
                    .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }
                    .form-group.full-width {
                        grid-column: 1 / -1;
                    }
                    .form-group label {
                        font-size: 13px;
                        font-weight: 500;
                        color: #4a5568;
                    }
                    .form-group input,
                    .form-group select {
                        padding: 8px 12px;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        font-size: 14px;
                        font-family: inherit;
                    }
                    .form-group input:focus,
                    .form-group select:focus {
                        outline: none;
                        border-color: #0070f3;
                    }
                `}</style>
            </div>
        </>
    )
}

