import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Trash2, RotateCcw, UserPlus } from 'lucide-react'
import AppLayout from '../components/AppLayout'
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

    return (
        <AppLayout>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-secondary-900">จัดการข้อมูลลูกค้า</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (confirm('คุณต้องการรีเซ็ตข้อมูลลูกค้าเป็นค่าเริ่มต้นหรือไม่? ข้อมูลที่แก้ไขจะหายไปทั้งหมด')) {
                                localStorage.removeItem('customers_data');
                                setCustomers(MOCK_CUSTOMERS_DATA);
                                alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
                    >
                        <RotateCcw size={18} />
                        รีเซ็ตข้อมูล
                    </button>
                    <Link
                        href="/customers/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                    >
                        <UserPlus size={18} />
                        เพิ่มลูกค้าใหม่
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหา ชื่อ, เบอร์โทร, อีเมล..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-secondary-50 border-b border-secondary-200">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">#</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ชื่อลูกค้า/บริษัท</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">เบอร์โทรศัพท์</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">อีเมล</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">LINE ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สื่อที่เห็น</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ผู้ติดต่อ 1</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ผู้ติดต่อ 2</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">สั่งซื้อล่าสุด</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {filteredCustomers.map((customer, index) => (
                                <tr key={customer.id} className="hover:bg-secondary-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-secondary-500 font-mono">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/customers/${customer.id}`}
                                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            {customer.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-secondary-700">{customer.phone}</td>
                                    <td className="px-6 py-4 text-sm text-secondary-700">{customer.email}</td>
                                    <td className="px-6 py-4 text-sm text-secondary-700">{customer.line}</td>
                                    <td className="px-6 py-4 text-sm text-secondary-700">
                                        {customer.mediaSource === 'อื่นๆระบุ'
                                            ? customer.mediaSourceOther
                                            : customer.mediaSource}
                                    </td>
                                    <td className="px-6 py-4">
                                        {customer.contact1.name && (
                                            <div>
                                                <div className="text-sm text-secondary-900">{customer.contact1.name}</div>
                                                <div className="text-xs text-secondary-500 mt-0.5">{customer.contact1.phone}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {customer.contact2.name && (
                                            <div>
                                                <div className="text-sm text-secondary-900">{customer.contact2.name}</div>
                                                <div className="text-xs text-secondary-500 mt-0.5">{customer.contact2.phone}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-secondary-700">
                                        {customer.lastOrder || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCustomers.length === 0 && (
                    <div className="py-16 text-center text-secondary-400">ไม่พบข้อมูลลูกค้า</div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-secondary-900">
                                {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-secondary-400 hover:text-secondary-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                        ชื่อลูกค้า / บริษัท *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => handleFormChange('name', e.target.value)}
                                        placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                        เบอร์โทรศัพท์ *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => handleFormChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">อีเมล</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleFormChange('email', e.target.value)}
                                        placeholder="example@email.com"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">LINE ID</label>
                                    <input
                                        type="text"
                                        value={formData.line}
                                        onChange={e => handleFormChange('line', e.target.value)}
                                        placeholder="@lineid"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">Facebook</label>
                                    <input
                                        type="text"
                                        value={formData.facebook}
                                        onChange={e => handleFormChange('facebook', e.target.value)}
                                        placeholder="facebook.com/..."
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">Instagram</label>
                                    <input
                                        type="text"
                                        value={formData.instagram}
                                        onChange={e => handleFormChange('instagram', e.target.value)}
                                        placeholder="@instagram"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">สื่อที่ลูกค้าเห็น</label>
                                    <select
                                        value={formData.mediaSource}
                                        onChange={e => handleFormChange('mediaSource', e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
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
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">ระบุสื่ออื่นๆ</label>
                                        <input
                                            type="text"
                                            value={formData.mediaSourceOther}
                                            onChange={e => handleFormChange('mediaSourceOther', e.target.value)}
                                            placeholder="โปรดระบุ..."
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">ผู้ติดต่อ 1 - ชื่อ</label>
                                    <input
                                        type="text"
                                        value={formData.contact1.name}
                                        onChange={e => handleFormChange('name', e.target.value, 'contact1')}
                                        placeholder="ชื่อ"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">ผู้ติดต่อ 1 - เบอร์โทร</label>
                                    <input
                                        type="text"
                                        value={formData.contact1.phone}
                                        onChange={e => handleFormChange('phone', e.target.value, 'contact1')}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">ผู้ติดต่อ 2 - ชื่อ</label>
                                    <input
                                        type="text"
                                        value={formData.contact2.name}
                                        onChange={e => handleFormChange('name', e.target.value, 'contact2')}
                                        placeholder="ชื่อ"
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">ผู้ติดต่อ 2 - เบอร์โทร</label>
                                    <input
                                        type="text"
                                        value={formData.contact2.phone}
                                        onChange={e => handleFormChange('phone', e.target.value, 'contact2')}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-end gap-3 bg-secondary-50 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
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
