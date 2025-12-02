import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../../components/AppLayout'
import {
    ArrowLeft,
    Save,
    User,
    Phone,
    Mail,
    MessageCircle,
    Facebook,
    Instagram,
    FileText,
    MapPin,
    Plus,
    Trash2,
    Building2,
    Home
} from 'lucide-react'

export default function NewCustomerPage() {
    const router = useRouter()
    const { returnUrl } = router.query
    const [activeTab, setActiveTab] = useState('customer')

    // Customer Info
    const [customerData, setCustomerData] = useState({
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

    // Tax Invoice Info (Multiple)
    const [taxInvoices, setTaxInvoices] = useState([
        { id: 1, companyName: '', taxId: '', address: '' }
    ])

    // Installation/Delivery Addresses (Multiple)
    const [addresses, setAddresses] = useState([
        { id: 1, label: '', address: '', province: '', postalCode: '', contactName: '', contactPhone: '' }
    ])

    // Add Tax Invoice
    const addTaxInvoice = () => {
        const newId = taxInvoices.length > 0 ? Math.max(...taxInvoices.map(t => t.id)) + 1 : 1
        setTaxInvoices([...taxInvoices, { id: newId, companyName: '', taxId: '', address: '' }])
    }

    // Remove Tax Invoice
    const removeTaxInvoice = (id) => {
        if (taxInvoices.length > 1) {
            setTaxInvoices(taxInvoices.filter(t => t.id !== id))
        }
    }

    // Update Tax Invoice
    const updateTaxInvoice = (id, field, value) => {
        setTaxInvoices(taxInvoices.map(t => t.id === id ? { ...t, [field]: value } : t))
    }

    // Add Address
    const addAddress = () => {
        const newId = addresses.length > 0 ? Math.max(...addresses.map(a => a.id)) + 1 : 1
        setAddresses([...addresses, { id: newId, label: '', address: '', province: '', postalCode: '', contactName: '', contactPhone: '' }])
    }

    // Remove Address
    const removeAddress = (id) => {
        if (addresses.length > 1) {
            setAddresses(addresses.filter(a => a.id !== id))
        }
    }

    // Update Address
    const updateAddress = (id, field, value) => {
        setAddresses(addresses.map(a => a.id === id ? { ...a, [field]: value } : a))
    }

    // Save Customer
    const handleSave = () => {
        if (!customerData.name || !customerData.phone) {
            alert('กรุณากรอกชื่อและเบอร์โทรศัพท์')
            return
        }

        // Load existing customers
        const existingCustomers = JSON.parse(localStorage.getItem('customers_data') || '[]')
        const newId = existingCustomers.length > 0 ? Math.max(...existingCustomers.map(c => c.id)) + 1 : 1

        // Prepare new customer data
        const newCustomer = {
            id: newId,
            ...customerData,
            taxInvoices: taxInvoices.filter(t => t.companyName || t.taxId || t.address),
            addresses: addresses.filter(a => a.address || a.label)
        }

        // Save to localStorage
        const updatedCustomers = [...existingCustomers, newCustomer]
        localStorage.setItem('customers_data', JSON.stringify(updatedCustomers))

        // Redirect
        if (returnUrl) {
            router.push(returnUrl)
        } else {
            router.push('/customers')
        }
    }

    const tabs = [
        { id: 'customer', label: 'ข้อมูลลูกค้า (Customer)', icon: User },
        { id: 'tax', label: 'ข้อมูลใบกำกับภาษี (Tax Invoice)', icon: FileText },
        { id: 'address', label: 'ที่อยู่ติดตั้ง/จัดส่ง (Installation/Delivery Address)', icon: MapPin }
    ]

    return (
        <AppLayout>
            <Head>
                <title>เพิ่มลูกค้าใหม่ - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={returnUrl || '/customers'}
                            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} className="text-secondary-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-secondary-900">เพิ่มลูกค้าใหม่</h1>
                            <p className="text-secondary-500 mt-1">กรอกข้อมูลลูกค้าใหม่ในระบบ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={returnUrl || '/customers'}
                            className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
                        >
                            ยกเลิก
                        </Link>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2"
                        >
                            <Save size={18} />
                            บันทึก
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="border-b border-secondary-200">
                        <div className="flex overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                                : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Tab 1: Customer Info */}
                        {activeTab === 'customer' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                                            ชื่อลูกค้า / บริษัท <span className="text-danger-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={customerData.name}
                                            onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                                            placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                            className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                                            เบอร์โทรศัพท์ <span className="text-danger-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                            <input
                                                type="text"
                                                value={customerData.phone}
                                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                                placeholder="02-610-8000"
                                                className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-2">อีเมล</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                            <input
                                                type="email"
                                                value={customerData.email}
                                                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                                placeholder="contact@siamparagon.co.th"
                                                className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-secondary-200 pt-6">
                                    <h3 className="text-sm font-bold text-secondary-900 mb-4">ช่องทางติดต่อ Social Media</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-2">LINE ID</label>
                                            <div className="relative">
                                                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-[#06c755]" size={16} />
                                                <input
                                                    type="text"
                                                    value={customerData.line}
                                                    onChange={(e) => setCustomerData({ ...customerData, line: e.target.value })}
                                                    placeholder="@siamparagon"
                                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-2">Facebook</label>
                                            <div className="relative">
                                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1877f2]" size={16} />
                                                <input
                                                    type="text"
                                                    value={customerData.facebook}
                                                    onChange={(e) => setCustomerData({ ...customerData, facebook: e.target.value })}
                                                    placeholder="Siam Paragon"
                                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-2">Instagram</label>
                                            <div className="relative">
                                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e4405f]" size={16} />
                                                <input
                                                    type="text"
                                                    value={customerData.instagram}
                                                    onChange={(e) => setCustomerData({ ...customerData, instagram: e.target.value })}
                                                    placeholder="siamparagonshoppingcenter"
                                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-secondary-200 pt-6">
                                    <h3 className="text-sm font-bold text-secondary-900 mb-4">ผู้ติดต่อเพิ่มเติม</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-medium text-secondary-600">ผู้ติดต่อ 1 (ชื่อ)</label>
                                            <input
                                                type="text"
                                                value={customerData.contact1.name}
                                                onChange={(e) => setCustomerData({
                                                    ...customerData,
                                                    contact1: { ...customerData.contact1, name: e.target.value }
                                                })}
                                                placeholder="คุณสมชาย (จัดซื้อ)"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-medium text-secondary-600">ผู้ติดต่อ 1 (เบอร์โทร)</label>
                                            <input
                                                type="text"
                                                value={customerData.contact1.phone}
                                                onChange={(e) => setCustomerData({
                                                    ...customerData,
                                                    contact1: { ...customerData.contact1, phone: e.target.value }
                                                })}
                                                placeholder="081-111-1111"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-medium text-secondary-600">ผู้ติดต่อ 2 (ชื่อ)</label>
                                            <input
                                                type="text"
                                                value={customerData.contact2.name}
                                                onChange={(e) => setCustomerData({
                                                    ...customerData,
                                                    contact2: { ...customerData.contact2, name: e.target.value }
                                                })}
                                                placeholder="คุณมีนา (บัญชี)"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-medium text-secondary-600">ผู้ติดต่อ 2 (เบอร์โทร)</label>
                                            <input
                                                type="text"
                                                value={customerData.contact2.phone}
                                                onChange={(e) => setCustomerData({
                                                    ...customerData,
                                                    contact2: { ...customerData.contact2, phone: e.target.value }
                                                })}
                                                placeholder="082-222-2222"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-secondary-200 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">สื่อที่ลูกค้าเห็น</label>
                                            <select
                                                value={customerData.mediaSource}
                                                onChange={(e) => setCustomerData({ ...customerData, mediaSource: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            >
                                                <option value="">-- เลือกสื่อ --</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Line@">Line@</option>
                                                <option value="Google">Google</option>
                                                <option value="เพื่อนแนะนำ">เพื่อนแนะนำ</option>
                                                <option value="อื่นๆระบุ">อื่นๆระบุ</option>
                                            </select>
                                        </div>
                                        {customerData.mediaSource === 'อื่นๆระบุ' && (
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">ระบุสื่ออื่นๆ</label>
                                                <input
                                                    type="text"
                                                    value={customerData.mediaSourceOther}
                                                    onChange={(e) => setCustomerData({ ...customerData, mediaSourceOther: e.target.value })}
                                                    className="w-full px-3 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Tax Invoice */}
                        {activeTab === 'tax' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-secondary-900">ข้อมูลใบกำกับภาษี</h3>
                                    <button
                                        onClick={addTaxInvoice}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium text-sm"
                                    >
                                        <Plus size={16} />
                                        เพิ่มข้อมูลใบกำกับภาษี
                                    </button>
                                </div>

                                {taxInvoices.map((tax, index) => (
                                    <div key={tax.id} className="p-6 border-2 border-secondary-200 rounded-xl bg-secondary-50 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="text-primary-600" size={20} />
                                                <h4 className="font-bold text-secondary-900">ใบกำกับภาษี #{index + 1}</h4>
                                            </div>
                                            {taxInvoices.length > 1 && (
                                                <button
                                                    onClick={() => removeTaxInvoice(tax.id)}
                                                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">ชื่อบริษัท</label>
                                                <input
                                                    type="text"
                                                    value={tax.companyName}
                                                    onChange={(e) => updateTaxInvoice(tax.id, 'companyName', e.target.value)}
                                                    placeholder="บริษัท สยามพารากอน จำกัด"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">เลขประจำตัวผู้เสียภาษี</label>
                                                <input
                                                    type="text"
                                                    value={tax.taxId}
                                                    onChange={(e) => updateTaxInvoice(tax.id, 'taxId', e.target.value)}
                                                    placeholder="0-1055-48148-53-1"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">ที่อยู่ใบกำกับภาษี</label>
                                                <input
                                                    type="text"
                                                    value={tax.address}
                                                    onChange={(e) => updateTaxInvoice(tax.id, 'address', e.target.value)}
                                                    placeholder="991 ถนนพระราม 1 ปทุมวัน กรุงเทพฯ 10330"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tab 3: Addresses */}
                        {activeTab === 'address' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-secondary-900">ที่อยู่ติดตั้ง/จัดส่ง</h3>
                                    <button
                                        onClick={addAddress}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium text-sm"
                                    >
                                        <Plus size={16} />
                                        เพิ่มที่อยู่
                                    </button>
                                </div>

                                {addresses.map((addr, index) => (
                                    <div key={addr.id} className="p-6 border-2 border-secondary-200 rounded-xl bg-secondary-50 relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Home className="text-primary-600" size={20} />
                                                <h4 className="font-bold text-secondary-900">ที่อยู่ #{index + 1}</h4>
                                            </div>
                                            {addresses.length > 1 && (
                                                <button
                                                    onClick={() => removeAddress(addr.id)}
                                                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">ชื่อที่อยู่ (Label)</label>
                                                <input
                                                    type="text"
                                                    value={addr.label}
                                                    onChange={(e) => updateAddress(addr.id, 'label', e.target.value)}
                                                    placeholder="สำนักงานใหญ่, โกดัง, สาขา 1, ฯลฯ"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">ที่อยู่</label>
                                                <textarea
                                                    value={addr.address}
                                                    onChange={(e) => updateAddress(addr.id, 'address', e.target.value)}
                                                    placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ"
                                                    rows="2"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">จังหวัด</label>
                                                <input
                                                    type="text"
                                                    value={addr.province}
                                                    onChange={(e) => updateAddress(addr.id, 'province', e.target.value)}
                                                    placeholder="กรุงเทพมหานคร"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">รหัสไปรษณีย์</label>
                                                <input
                                                    type="text"
                                                    value={addr.postalCode}
                                                    onChange={(e) => updateAddress(addr.id, 'postalCode', e.target.value)}
                                                    placeholder="10330"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">ชื่อผู้ติดต่อ</label>
                                                <input
                                                    type="text"
                                                    value={addr.contactName}
                                                    onChange={(e) => updateAddress(addr.id, 'contactName', e.target.value)}
                                                    placeholder="คุณสมชาย"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">เบอร์ติดต่อ</label>
                                                <input
                                                    type="text"
                                                    value={addr.contactPhone}
                                                    onChange={(e) => updateAddress(addr.id, 'contactPhone', e.target.value)}
                                                    placeholder="081-111-1111"
                                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
