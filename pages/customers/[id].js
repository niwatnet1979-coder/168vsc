import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'

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
        taxInvoices: [
            {
                companyName: 'บริษัท เทคโนโลยี จำกัด',
                taxId: '1234567890123',
                branch: 'สำนักงานใหญ่',
                address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
                phone: '02-123-4567',
                email: 'account@techno.com',
                deliveryAddress: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110 (โกดังด้านหลัง)'
            }
        ],
        savedAddresses: [
            {
                name: 'บ้านพักอาศัย',
                address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
                mapLink: 'https://goo.gl/maps/xyz',
                inspector1: 'คุณสมชาย',
                inspector1Phone: '081-111-1111',
                inspector2: '-',
                inspector2Phone: '-'
            },
            {
                name: 'ออฟฟิศ',
                address: '456 ถ.สีลม แขวงสีลม เขตบางรัก กทม. 10500',
                mapLink: '',
                inspector1: '-',
                inspector1Phone: '-',
                inspector2: '-',
                inspector2Phone: '-'
            }
        ],
        orders: [
            {
                id: 'ORD-001',
                jobType: 'ติดตั้ง (Installation)',
                date: '2023-01-15',
                appointmentDate: '2023-01-20',
                team: 'ทีม A',
                inspector: 'คุณวิศวะ',
                items: 'ติดตั้งกล้องวงจรปิด 4 จุด',
                total: 15000,
                status: 'Completed'
            },
            {
                id: 'ORD-002',
                jobType: 'ซ่อมบำรุง (Maintenance)',
                date: '2023-02-10',
                appointmentDate: '2023-02-12',
                team: 'ทีม B',
                inspector: 'คุณช่างใหญ่',
                items: 'เปลี่ยนหลอดไฟ LED ทั้งอาคาร',
                total: 8500,
                status: 'Completed'
            },
            {
                id: 'ORD-003',
                jobType: 'ติดตั้ง (Installation)',
                date: '2023-03-05',
                appointmentDate: '2023-03-10',
                team: 'ทีม C',
                inspector: 'คุณสมชาย',
                items: 'ติดตั้งโคมไฟระย้า (Chandelier)',
                total: 45000,
                status: 'Completed'
            },
            {
                id: 'ORD-004',
                jobType: 'ส่งของ (Delivery Only)',
                date: '2023-04-20',
                appointmentDate: '2023-04-21',
                team: 'ขนส่งเอกชน',
                inspector: '-',
                items: 'หลอดไฟ Downlight 50 ชุด',
                total: 12500,
                status: 'Shipped'
            },
            {
                id: 'ORD-005',
                jobType: 'ติดตั้ง (Installation)',
                date: '2023-05-15',
                appointmentDate: '2023-05-20',
                team: 'ทีม A',
                inspector: 'คุณวิศวะ',
                items: 'ติดตั้งระบบไฟสวนหย่อม',
                total: 28000,
                status: 'Processing'
            },
            {
                id: 'ORD-006',
                jobType: 'ซ่อมบำรุง (Maintenance)',
                date: '2023-06-10',
                appointmentDate: '2023-06-12',
                team: 'ทีม B',
                inspector: 'คุณช่างใหญ่',
                items: 'ตรวจเช็คระบบไฟประจำปี',
                total: 5000,
                status: 'Pending'
            },
            {
                id: 'ORD-007',
                jobType: 'ติดตั้ง (Installation)',
                date: '2023-07-01',
                appointmentDate: '2023-07-05',
                team: 'ทีม C',
                inspector: 'คุณสมชาย',
                items: 'ติดตั้งไฟราง Track Light',
                total: 18900,
                status: 'Processing'
            },
            {
                id: 'ORD-008',
                jobType: 'ส่งของ (Delivery Only)',
                date: '2023-08-15',
                appointmentDate: '2023-08-16',
                team: 'ขนส่งบริษัท',
                inspector: '-',
                items: 'โคมไฟตั้งพื้น 10 ชุด',
                total: 35000,
                status: 'Shipped'
            },
            {
                id: 'ORD-009',
                jobType: 'รื้อถอน (Demolition)',
                date: '2023-09-10',
                appointmentDate: '2023-09-15',
                team: 'ทีม A',
                inspector: 'คุณวิศวะ',
                items: 'รื้อถอนโคมไฟเก่า',
                total: 4500,
                status: 'Completed'
            },
            {
                id: 'ORD-010',
                jobType: 'ติดตั้ง (Installation)',
                date: '2023-10-05',
                appointmentDate: '2023-10-10',
                team: 'ทีม B',
                inspector: 'คุณช่างใหญ่',
                items: 'ติดตั้งไฟ LED Strip Light ห้องประชุม',
                total: 22000,
                status: 'Pending'
            }
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
        taxInvoices: [
            {
                companyName: 'ร้านค้าปลีก ABC',
                taxId: '9876543210987',
                branch: 'สาขา 1',
                address: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310',
                phone: '02-234-5678',
                email: 'acc@retail.com',
                deliveryAddress: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310'
            }
        ],
        savedAddresses: [
            { name: 'หน้าร้าน', address: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310', mapLink: 'https://maps.google.com/?q=13.75,100.55', inspector1: '-', inspector1Phone: '-', inspector2: '-', inspector2Phone: '-' }
        ],
        orders: [
            {
                id: 'ORD-002',
                jobType: 'ติดตั้ง (Installation)',
                date: '2023-02-10',
                appointmentDate: '2023-02-15',
                team: 'ทีม C',
                inspector: 'คุณสมชาย',
                items: 'ติดตั้งระบบกันขโมย',
                total: 25000,
                status: 'Processing'
            }
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
        taxInvoices: [],
        savedAddresses: [],
        orders: []
    }
}

export default function CustomerDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [customer, setCustomer] = useState(null)
    const [activeTab, setActiveTab] = useState('customer') // customer, tax, address, orders

    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({})

    // Load customer data from LocalStorage
    useEffect(() => {
        if (id) {
            const savedData = localStorage.getItem('customers_data')
            let customers = savedData ? JSON.parse(savedData) : MOCK_CUSTOMERS

            const data = customers.find(c => c.id === parseInt(id))
            if (data) {
                setCustomer(data)
                setFormData(data)
            } else {
                // Fallback to mock data if not found
                const mockData = MOCK_CUSTOMERS.find(c => c.id === parseInt(id))
                if (mockData) {
                    setCustomer(mockData)
                    setFormData(mockData)
                }
            }
        }
    }, [id])

    // Handle Tab and Edit Mode from Query Params
    useEffect(() => {
        if (router.query.tab) {
            setActiveTab(router.query.tab)
        }
        // If coming from another page (returnUrl exists), automatically enter edit mode
        if (router.query.returnUrl) {
            setIsEditing(true)
        }
    }, [router.query.tab, router.query.returnUrl])

    const handleEdit = () => {
        setIsEditing(true)
        setFormData({ ...customer })
    }

    const handleCancel = () => {
        setIsEditing(false)
        setFormData({ ...customer })
    }

    const handleSave = () => {
        // Save to LocalStorage
        const savedData = localStorage.getItem('customers_data')
        let customers = savedData ? JSON.parse(savedData) : []

        const index = customers.findIndex(c => c.id === parseInt(id))
        if (index !== -1) {
            customers[index] = { ...formData }
        } else {
            customers.push({ ...formData, id: parseInt(id) })
        }

        localStorage.setItem('customers_data', JSON.stringify(customers))

        setCustomer({ ...formData })
        setIsEditing(false)
        alert('บันทึกข้อมูลเรียบร้อย')

        // Handle Return URL
        const { returnUrl } = router.query
        if (returnUrl) {
            router.push(returnUrl)
        }
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
        setIsEditing(true)
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

    if (!customer) return <div className="p-8">Loading...</div>

    const handleAddAddress = () => {
        setIsEditing(true)
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
                <title>{customer.name} - รายละเอียดลูกค้า</title>
            </Head>

            <div className="detail-page">
                <header className="page-header">
                    <button className="btn-back" onClick={() => {
                        const { returnUrl } = router.query
                        if (returnUrl) {
                            router.push(returnUrl)
                        } else {
                            router.push('/customers')
                        }
                    }}>
                        ← {router.query.returnUrl ? 'กลับไปหน้าก่อนหน้า' : 'กลับหน้ารายชื่อ'}
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
                            สถานที่ติดตั้ง/จัดส่ง (Installation/Delivery Address)
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
                            <>
                                <div className="tab-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="btn-cancel" onClick={handleCancel}>ยกเลิก</button>
                                            <button className="btn-save" onClick={handleSave}>บันทึก</button>
                                        </>
                                    ) : (
                                        <button className="btn-edit-tab" onClick={handleEdit}>✏️ แก้ไขข้อมูล</button>
                                    )}
                                </div>
                                <div className="content-card">
                                    <div className="info-grid">
                                        <div className="info-group span-2">
                                            <label>ชื่อลูกค้า / บริษัท</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.name}
                                                    onChange={(e) => handleChange('name', e.target.value)}
                                                />
                                            ) : (
                                                <div className="value">{customer.name}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>เบอร์โทรศัพท์</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                />
                                            ) : (
                                                <div className="value">{customer.phone}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>อีเมล</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                />
                                            ) : (
                                                <div className="value">{customer.email || '-'}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>LINE ID</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.line}
                                                    onChange={(e) => handleChange('line', e.target.value)}
                                                />
                                            ) : (
                                                <div className="value">{customer.line || '-'}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>Facebook</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.facebook}
                                                    onChange={(e) => handleChange('facebook', e.target.value)}
                                                />
                                            ) : (
                                                <div className="value">{customer.facebook || '-'}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>Instagram</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.instagram}
                                                    onChange={(e) => handleChange('instagram', e.target.value)}
                                                />
                                            ) : (
                                                <div className="value">{customer.instagram || '-'}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>สื่อที่ลูกค้าเห็น</label>
                                            {isEditing ? (
                                                <select
                                                    className="edit-input"
                                                    value={formData.mediaSource}
                                                    onChange={(e) => handleChange('mediaSource', e.target.value)}
                                                >
                                                    <option value="Facebook">Facebook</option>
                                                    <option value="Google">Google</option>
                                                    <option value="Line@">Line@</option>
                                                    <option value="TikTok">TikTok</option>
                                                    <option value="เพื่อนแนะนำ">เพื่อนแนะนำ</option>
                                                    <option value="ป้ายโฆษณา">ป้ายโฆษณา</option>
                                                    <option value="อื่นๆระบุ">อื่นๆ ระบุ</option>
                                                </select>
                                            ) : (
                                                <div className="value">
                                                    {customer.mediaSource === 'อื่นๆระบุ' ? customer.mediaSourceOther : customer.mediaSource}
                                                </div>
                                            )}
                                        </div>
                                        {isEditing && formData.mediaSource === 'อื่นๆระบุ' && (
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
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.contact1?.name}
                                                    onChange={(e) => handleChange('name', e.target.value, 'contact1')}
                                                />
                                            ) : (
                                                <div className="value">{customer.contact1.name}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 1 (เบอร์โทร)</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.contact1?.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value, 'contact1')}
                                                />
                                            ) : (
                                                <div className="value">{customer.contact1.phone}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 2 (ชื่อ)</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.contact2?.name}
                                                    onChange={(e) => handleChange('name', e.target.value, 'contact2')}
                                                />
                                            ) : (
                                                <div className="value">{customer.contact2.name}</div>
                                            )}
                                        </div>
                                        <div className="info-group">
                                            <label>ผู้ติดต่อ 2 (เบอร์โทร)</label>
                                            {isEditing ? (
                                                <input
                                                    className="edit-input"
                                                    value={formData.contact2?.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value, 'contact2')}
                                                />
                                            ) : (
                                                <div className="value">{customer.contact2.phone}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 2. Tax Invoice Tab */}
                        {activeTab === 'tax' && (
                            <>
                                <div className="tab-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="btn-add-tab" onClick={handleAddTaxInvoice}>+ เพิ่มข้อมูล</button>
                                            <button className="btn-cancel" onClick={handleCancel}>ยกเลิก</button>
                                            <button className="btn-save" onClick={handleSave}>บันทึก</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-edit-tab" onClick={handleEdit}>✏️ แก้ไขข้อมูล</button>
                                            <button className="btn-add-tab" onClick={handleAddTaxInvoice}>+ เพิ่มข้อมูล</button>
                                        </>
                                    )}
                                </div>
                                <div className="tax-list">
                                    {(isEditing ? formData.taxInvoices : customer.taxInvoices)?.map((tax, i) => (
                                        <div key={i} className="tax-card">
                                            {isEditing && (
                                                <div className="card-header">
                                                    <h3>ข้อมูลชุดที่ {i + 1}</h3>
                                                    <button className="btn-remove" onClick={() => handleRemoveTaxInvoice(i)}>ลบ</button>
                                                </div>
                                            )}
                                            <div className="info-grid">
                                                <div className="info-group span-2">
                                                    <label>ชื่อบริษัท (Company Name)</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.companyName}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], companyName: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.companyName || '-'}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>เลขประจำตัวผู้เสียภาษี</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.taxId}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], taxId: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.taxId}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>สาขา</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.branch}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], branch: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.branch}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>เบอร์โทรศัพท์</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.phone}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], phone: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.phone}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>อีเมล</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.email}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], email: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.email || '-'}</div>
                                                    )}
                                                </div>
                                                <div className="info-group span-2">
                                                    <label>ที่อยู่ใบกำกับภาษี</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.address}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], address: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.address}</div>
                                                    )}
                                                </div>
                                                <div className="info-group span-2">
                                                    <label>ที่อยู่จัดส่ง (Delivery Address)</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={tax.deliveryAddress}
                                                            onChange={(e) => {
                                                                const newTaxInvoices = [...formData.taxInvoices];
                                                                newTaxInvoices[i] = { ...newTaxInvoices[i], deliveryAddress: e.target.value };
                                                                setFormData({ ...formData, taxInvoices: newTaxInvoices });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{tax.deliveryAddress || '-'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!customer.taxInvoices || customer.taxInvoices.length === 0) && !isEditing && (
                                        <div className="empty-state">ไม่มีข้อมูลใบกำกับภาษี</div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 3. Address Tab */}
                        {activeTab === 'address' && (
                            <>
                                <div className="tab-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="btn-add-tab" onClick={handleAddAddress}>+ เพิ่มข้อมูล</button>
                                            <button className="btn-cancel" onClick={handleCancel}>ยกเลิก</button>
                                            <button className="btn-save" onClick={handleSave}>บันทึก</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="btn-edit-tab" onClick={handleEdit}>✏️ แก้ไขข้อมูล</button>
                                            <button className="btn-add-tab" onClick={handleAddAddress}>+ เพิ่มข้อมูล</button>
                                        </>
                                    )}
                                </div>
                                <div className="address-list">
                                    {(isEditing ? formData.savedAddresses : customer.savedAddresses)?.map((addr, i) => (
                                        <div key={i} className="content-card">
                                            {isEditing && (
                                                <div className="card-header">
                                                    <h3>สถานที่ {i + 1}</h3>
                                                    <button className="btn-remove" onClick={() => handleRemoveAddress(i)}>ลบ</button>
                                                </div>
                                            )}
                                            <div className="info-grid">
                                                <div className="info-group">
                                                    <label>ชื่อสถานที่ (Location Name)</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.name}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], name: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{addr.name}</div>
                                                    )}
                                                </div>
                                                <div className="info-group span-2">
                                                    <label>ที่อยู่ (Address)</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.address}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], address: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{addr.address}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>Google Maps Link</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.mapLink}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], mapLink: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">
                                                            {addr.mapLink ? (
                                                                <a href={addr.mapLink} target="_blank" rel="noreferrer" className="map-link">
                                                                    เปิดแผนที่
                                                                </a>
                                                            ) : '-'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="divider"></div>
                                                <div className="info-group">
                                                    <label>ผู้ตรวจงาน 1</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.inspector1}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], inspector1: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{addr.inspector1 || '-'}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>เบอร์โทร 1</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.inspector1Phone}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], inspector1Phone: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{addr.inspector1Phone || '-'}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>ผู้ตรวจงาน 2</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.inspector2}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], inspector2: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{addr.inspector2 || '-'}</div>
                                                    )}
                                                </div>
                                                <div className="info-group">
                                                    <label>เบอร์โทร 2</label>
                                                    {isEditing ? (
                                                        <input
                                                            className="edit-input"
                                                            value={addr.inspector2Phone}
                                                            onChange={(e) => {
                                                                const newAddresses = [...formData.savedAddresses];
                                                                newAddresses[i] = { ...newAddresses[i], inspector2Phone: e.target.value };
                                                                setFormData({ ...formData, savedAddresses: newAddresses });
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="value">{addr.inspector2Phone || '-'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!customer.savedAddresses || customer.savedAddresses.length === 0) && !isEditing && (
                                        <div className="empty-state">ไม่มีข้อมูลสถานที่ติดตั้ง/จัดส่ง</div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 4. Orders Tab */}
                        {activeTab === 'orders' && (
                            <>
                                {/* No edit button for orders list */}
                                <div className="orders-list">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>ประเภทงาน</th>
                                                <th>วันที่สั่งซื้อ</th>
                                                <th>วันที่นัดหมาย</th>
                                                <th>ทีมช่าง</th>
                                                <th>ผู้ตรวจงาน</th>
                                                <th>รายการ</th>
                                                <th>ยอดรวม</th>
                                                <th>สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customer.orders && customer.orders.length > 0 ? (
                                                customer.orders.map((order, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td>
                                                            <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline font-medium">
                                                                {order.id}
                                                            </Link>
                                                        </td>
                                                        <td>{order.jobType}</td>
                                                        <td>{order.date}</td>
                                                        <td>{order.appointmentDate}</td>
                                                        <td>{order.team}</td>
                                                        <td>{order.inspector}</td>
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
                                                    <td colSpan="9" className="text-center">ไม่มีประวัติการสั่งซื้อ</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
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
                        flex: 1;
                        padding: 16px 24px;
                        background: none;
                        border: none;
                        border-bottom: 3px solid transparent;
                        font-size: 15px;
                        font-weight: 600;
                        color: #718096;
                        cursor: pointer;
                        transition: all 0.2s;
                        white-space: nowrap;
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
                        padding: 16px;
                    }
                    .info-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        align-items: flex-end;
                    }
                    .info-group {
                        flex: 1 1 calc(25% - 8px);
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                        min-width: 200px;
                    }
                    .info-group.full-width {
                        flex: 1 1 100%;
                        width: 100%;
                    }
                    .info-group.span-2 {
                        flex: 2 1 calc(50% - 8px);
                        min-width: 300px;
                    }
                    .info-group label {
                        font-size: 11px;
                        color: #718096;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        margin-left: 2px;
                    }
                    .info-group .value {
                        font-size: 13px;
                        color: #2d3748;
                        font-weight: 500;
                        padding: 4px 8px;
                        background: #f7fafc;
                        border-radius: 4px;
                        border: 1px solid #edf2f7;
                        min-height: 28px;
                        display: flex;
                        align-items: center;
                        line-height: 1.2;
                    }
                    .content-card {
                        background: #fff;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 12px;
                    }
                    .divider {
                        flex: 1 1 100%;
                        width: 100%;
                        height: 1px;
                        background: #edf2f7;
                        margin: 4px 0;
                    }
                    .address-list {
                        display: grid;
                        gap: 8px;
                    }
                    .address-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 12px;
                        background: #fff;
                    }
                    .address-card h3 {
                        margin: 0 0 2px 0;
                        font-size: 15px;
                        color: #2d3748;
                    }
                    .address-card p {
                        margin: 0 0 4px 0;
                        color: #4a5568;
                        line-height: 1.3;
                        font-size: 13px;
                    }
                    .map-link {
                        color: #0070f3;
                        text-decoration: none;
                        font-size: 12px;
                        display: inline-flex;
                        align-items: center;
                    }
                    .map-link:hover {
                        text-decoration: underline;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13px;
                    }
                    .data-table th {
                        text-align: left;
                        padding: 8px;
                        background: #f7fafc;
                        border-bottom: 2px solid #edf2f7;
                        color: #4a5568;
                        font-weight: 600;
                    }
                    .data-table td {
                        padding: 8px;
                        border-bottom: 1px solid #edf2f7;
                        color: #2d3748;
                    }
                    .status-badge {
                        padding: 2px 8px;
                        border-radius: 99px;
                        font-size: 11px;
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
                        padding: 24px;
                        color: #a0aec0;
                        font-size: 13px;
                    }
                    .text-center {
                        text-align: center;
                    }
                    .tab-actions {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 12px;
                        gap: 8px;
                    }
                    .btn-edit-tab {
                        background: #0070f3;
                        color: white;
                        border: none;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                        transition: all 0.2s;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .btn-edit-tab:hover {
                        background: #0060df;
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .btn-add-tab {
                        background: #38a169;
                        color: white;
                        border: none;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 12px;
                        transition: all 0.2s;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .btn-add-tab:hover {
                        background: #2f855a;
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .btn-save {
                        background: #38a169;
                        color: white;
                        border: none;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        margin-left: 4px;
                        font-size: 12px;
                    }
                    .btn-save:hover {
                        background: #2f855a;
                    }
                    .btn-cancel {
                        background: #e53e3e;
                        color: white;
                        border: none;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 12px;
                    }
                    .btn-cancel:hover {
                        background: #c53030;
                    }
                    .edit-input {
                        width: 100%;
                        padding: 4px 8px;
                        border: 1px solid #e2e8f0;
                        border-radius: 4px;
                        font-size: 13px;
                        color: #2d3748;
                        font-family: 'Sarabun', sans-serif;
                        height: 28px;
                    }
                    textarea.edit-input {
                        height: auto;
                        padding: 6px 8px;
                    }
                    .edit-input:focus {
                        outline: none;
                        border-color: #0070f3;
                        box-shadow: 0 0 0 3px rgba(0,112,243,0.1);
                    }
                    .mb-2 {
                        margin-bottom: 4px;
                    }
                    .font-bold {
                        font-weight: 600;
                    }
                    .tax-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .tax-card {
                        background: #fff;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        padding: 12px;
                        position: relative;
                    }
                    .card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 8px;
                        padding-bottom: 6px;
                        border-bottom: 1px solid #edf2f7;
                    }
                    .card-header h3 {
                        margin: 0;
                        font-size: 14px;
                        color: #2d3748;
                        font-weight: 600;
                    }
                    .btn-remove {
                        background: #fff;
                        color: #e53e3e;
                        border: 1px solid #e53e3e;
                        padding: 2px 6px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 10px;
                        transition: all 0.2s;
                    }
                    .btn-remove:hover {
                        background: #fff5f5;
                    }
                `}</style>
            </div >
        </>
    )
}
