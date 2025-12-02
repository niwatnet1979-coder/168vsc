import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import { MOCK_CUSTOMERS_DATA } from '../lib/mockData'
import {
    Search,
    UserPlus,
    Edit2,
    Trash2,
    Users,
    Phone,
    Mail,
    Globe,
    MessageCircle,
    Facebook,
    Instagram,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCcw
} from 'lucide-react'

export default function CustomersPage() {
    const [customers, setCustomers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Initial Form State
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
        // Tax Invoice Info
        taxCompanyName: '',
        taxId: '',
        taxAddress: '',
        // Shipping Address
        shippingAddress: '',
        shippingProvince: '',
        shippingPostalCode: ''
    }
    const [formData, setFormData] = useState(initialFormState)

    // Load data
    useEffect(() => {
        const savedData = localStorage.getItem('customers_data')
        if (savedData) {
            setCustomers(JSON.parse(savedData))
        } else {
            setCustomers(MOCK_CUSTOMERS_DATA)
            localStorage.setItem('customers_data', JSON.stringify(MOCK_CUSTOMERS_DATA))
        }
    }, [])

    // Save data
    useEffect(() => {
        if (customers.length > 0) {
            localStorage.setItem('customers_data', JSON.stringify(customers))
        }
    }, [customers])

    const handleAdd = () => {
        setEditingCustomer(null)
        setFormData(initialFormState)
        setShowModal(true)
    }

    const handleEdit = (customer) => {
        setEditingCustomer(customer)
        setFormData({ ...initialFormState, ...customer })
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
            setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...formData, id: c.id } : c))
        } else {
            const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1
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
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Pagination
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <AppLayout>
            <Head>
                <title>จัดการลูกค้า (Customers) - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Users className="text-primary-600" size={32} />
                            จัดการลูกค้า (Customers)
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการรายชื่อลูกค้าและประวัติการติดต่อ</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                if (confirm('คุณต้องการรีเซ็ตข้อมูลลูกค้าเป็นค่าเริ่มต้นหรือไม่? ข้อมูลที่แก้ไขจะหายไปทั้งหมด')) {
                                    localStorage.removeItem('customers_data');
                                    setCustomers(MOCK_CUSTOMERS_DATA);
                                    alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
                                    window.location.reload();
                                }
                            }}
                            className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2 font-medium"
                        >
                            <RotateCcw size={18} />
                            รีเซ็ต
                        </button>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                        >
                            <UserPlus size={18} />
                            เพิ่มลูกค้าใหม่
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหา ชื่อ, เบอร์โทร, อีเมล..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ชื่อลูกค้า/บริษัท</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">เบอร์โทรศัพท์</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ช่องทางติดต่อ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ผู้ติดต่อ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สื่อที่เห็น</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedCustomers.length > 0 ? (
                                    paginatedCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-secondary-900">{customer.name}</span>
                                                    {customer.email && (
                                                        <span className="text-xs text-secondary-500 flex items-center gap-1 mt-1">
                                                            <Mail size={12} /> {customer.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-secondary-700">
                                                    <Phone size={14} className="text-secondary-400" />
                                                    {customer.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    {customer.line && (
                                                        <span className="p-1.5 bg-[#06c755]/10 text-[#06c755] rounded-lg" title={`Line: ${customer.line}`}>
                                                            <MessageCircle size={16} />
                                                        </span>
                                                    )}
                                                    {customer.facebook && (
                                                        <span className="p-1.5 bg-[#1877f2]/10 text-[#1877f2] rounded-lg" title={`FB: ${customer.facebook}`}>
                                                            <Facebook size={16} />
                                                        </span>
                                                    )}
                                                    {customer.instagram && (
                                                        <span className="p-1.5 bg-[#e4405f]/10 text-[#e4405f] rounded-lg" title={`IG: ${customer.instagram}`}>
                                                            <Instagram size={16} />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-600">
                                                    {customer.contact1?.name ? (
                                                        <div className="flex flex-col">
                                                            <span>{customer.contact1.name}</span>
                                                            <span className="text-xs text-secondary-400">{customer.contact1.phone}</span>
                                                        </div>
                                                    ) : '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                                                    {customer.mediaSource === 'อื่นๆระบุ' ? customer.mediaSourceOther : (customer.mediaSource || '-')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(customer.id)}
                                                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-secondary-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={48} className="text-secondary-300 mb-4" />
                                                <p className="text-lg font-medium text-secondary-900">ไม่พบข้อมูลลูกค้า</p>
                                                <p className="text-sm text-secondary-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มลูกค้าใหม่</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between bg-secondary-50">
                            <div className="text-sm text-secondary-600">
                                แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} จาก {filteredCustomers.length} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-secondary-300 rounded-lg text-secondary-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-medium text-secondary-700 px-2">
                                    หน้า {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-secondary-300 rounded-lg text-secondary-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
                            <h3 className="text-xl font-bold text-secondary-900">
                                {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อลูกค้า / บริษัท <span className="text-danger-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => handleFormChange('name', e.target.value)}
                                        placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">เบอร์โทรศัพท์ <span className="text-danger-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => handleFormChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">อีเมล</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleFormChange('email', e.target.value)}
                                        placeholder="example@email.com"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div className="sm:col-span-2 border-t border-secondary-200 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-secondary-900 mb-3">ช่องทางติดต่อ Social Media</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">LINE ID</label>
                                            <div className="relative">
                                                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-[#06c755]" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.line}
                                                    onChange={e => handleFormChange('line', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">Facebook</label>
                                            <div className="relative">
                                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1877f2]" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.facebook}
                                                    onChange={e => handleFormChange('facebook', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">Instagram</label>
                                            <div className="relative">
                                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e4405f]" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.instagram}
                                                    onChange={e => handleFormChange('instagram', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 border-t border-secondary-200 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-secondary-900 mb-3">ข้อมูลผู้ติดต่อเพิ่มเติม</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ผู้ติดต่อ 1 (ชื่อ)</label>
                                            <input
                                                type="text"
                                                value={formData.contact1.name}
                                                onChange={e => handleFormChange('name', e.target.value, 'contact1')}
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ผู้ติดต่อ 1 (เบอร์โทร)</label>
                                            <input
                                                type="text"
                                                value={formData.contact1.phone}
                                                onChange={e => handleFormChange('phone', e.target.value, 'contact1')}
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ผู้ติดต่อ 2 (ชื่อ)</label>
                                            <input
                                                type="text"
                                                value={formData.contact2.name}
                                                onChange={e => handleFormChange('name', e.target.value, 'contact2')}
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ผู้ติดต่อ 2 (เบอร์โทร)</label>
                                            <input
                                                type="text"
                                                value={formData.contact2.phone}
                                                onChange={e => handleFormChange('phone', e.target.value, 'contact2')}
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 border-t border-secondary-200 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-secondary-900 mb-3">ข้อมูลใบกำกับภาษี</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ชื่อบริษัท (สำหรับใบกำกับภาษี)</label>
                                            <input
                                                type="text"
                                                value={formData.taxCompanyName}
                                                onChange={e => handleFormChange('taxCompanyName', e.target.value)}
                                                placeholder="ชื่อบริษัท จำกัด"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                                            <input
                                                type="text"
                                                value={formData.taxId}
                                                onChange={e => handleFormChange('taxId', e.target.value)}
                                                placeholder="0-0000-00000-00-0"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ที่อยู่ใบกำกับภาษี</label>
                                            <input
                                                type="text"
                                                value={formData.taxAddress}
                                                onChange={e => handleFormChange('taxAddress', e.target.value)}
                                                placeholder="ที่อยู่สำหรับออกใบกำกับภาษี"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 border-t border-secondary-200 pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-secondary-900 mb-3">ข้อมูลจัดส่ง</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">ที่อยู่จัดส่ง</label>
                                            <textarea
                                                value={formData.shippingAddress}
                                                onChange={e => handleFormChange('shippingAddress', e.target.value)}
                                                placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ"
                                                rows="2"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">จังหวัด</label>
                                            <input
                                                type="text"
                                                value={formData.shippingProvince}
                                                onChange={e => handleFormChange('shippingProvince', e.target.value)}
                                                placeholder="กรุงเทพมหานคร"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-secondary-600 mb-1">รหัสไปรษณีย์</label>
                                            <input
                                                type="text"
                                                value={formData.shippingPostalCode}
                                                onChange={e => handleFormChange('shippingPostalCode', e.target.value)}
                                                placeholder="10000"
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 border-t border-secondary-200 pt-4 mt-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">สื่อที่ลูกค้าเห็น</label>
                                            <select
                                                value={formData.mediaSource}
                                                onChange={e => handleFormChange('mediaSource', e.target.value)}
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1">ระบุสื่ออื่นๆ</label>
                                                <input
                                                    type="text"
                                                    value={formData.mediaSourceOther}
                                                    onChange={e => handleFormChange('mediaSourceOther', e.target.value)}
                                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3 bg-secondary-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-white transition-colors font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
