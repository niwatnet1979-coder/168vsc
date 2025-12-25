import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import CustomerModal from '../components/CustomerModal'
import { DataManager } from '../lib/dataManager'
import ConfirmDialog from '../components/ConfirmDialog'
import { supabase } from '../lib/supabaseClient'

import {
    Search,
    UserPlus,
    Edit2,
    Trash2,
    Users,
    Phone,
    Mail,
    MessageCircle,
    Facebook,
    Instagram,
    ChevronLeft,
    ChevronRight,
    X,
    RotateCcw,
    User,
    FileText,
    MapPin,
    Plus,
    Building2,
    Home,
    Menu
} from 'lucide-react'

export default function CustomersPage() {
    const [customers, setCustomers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState('customer')
    const itemsPerPage = 10
    const [isLoading, setIsLoading] = useState(true)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [customerToDelete, setCustomerToDelete] = useState(null)

    // Helper function to extract coordinates from Google Maps link
    const extractCoordinatesFromLink = (link) => {
        if (!link) return null

        // Pattern 1: https://maps.google.com/?q=13.7563,100.5018
        const pattern1 = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
        const match1 = link.match(pattern1)
        if (match1) {
            return { lat: parseFloat(match1[1]), lon: parseFloat(match1[2]) }
        }

        // Pattern 2: https://www.google.com/maps/@13.7563,100.5018,17z
        const pattern2 = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
        const match2 = link.match(pattern2)
        if (match2) {
            return { lat: parseFloat(match2[1]), lon: parseFloat(match2[2]) }
        }

        // Pattern 3: https://www.google.com/maps/place/.../@13.7563,100.5018
        const pattern3 = /@(-?\d+\.?\d*),(-?\d+\.?\d*),/
        const match3 = link.match(pattern3)
        if (match3) {
            return { lat: parseFloat(match3[1]), lon: parseFloat(match3[2]) }
        }

        return null
    }

    // Calculate distance using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Shop coordinates (from mockData.js)
    const SHOP_LAT = 13.9647757
    const SHOP_LON = 100.6203268


    // Load data from Supabase
    const loadCustomers = async () => {
        setIsLoading(true)
        try {
            console.log('Fetching customers...')
            const data = await DataManager.getCustomers()
            console.log('Customers fetched:', data?.length)
            setCustomers(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error loading customers:', error)
            setCustomers([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadCustomers()

        // Realtime subscription for automatic data sync across all customer tables
        const channel = supabase
            .channel('customers-realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                (payload) => {
                    console.log('🔄 Customer changed:', payload.eventType)
                    loadCustomers()
                }
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'customer_addresses' },
                (payload) => {
                    console.log('🔄 Address changed:', payload.eventType)
                    loadCustomers()
                }
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'customer_contacts' },
                (payload) => {
                    console.log('🔄 Contact changed:', payload.eventType)
                    loadCustomers()
                }
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'customer_tax_invoices' },
                (payload) => {
                    console.log('🔄 Tax invoice changed:', payload.eventType)
                    loadCustomers()
                }
            )
            .subscribe()

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleAdd = () => {
        setEditingCustomer(null)
        setActiveTab('customer')
        setShowModal(true)
    }

    const handleEdit = (customer) => {
        setEditingCustomer(customer)
        setActiveTab('customer')
        setShowModal(true)
    }

    const handleDelete = (id) => {
        setCustomerToDelete(id)
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false)
        if (!customerToDelete) return

        const success = await DataManager.deleteCustomer(customerToDelete)
        if (success) {
            setCustomers(customers.filter(c => c.id !== customerToDelete))
        } else {
            alert('ไม่สามารถลบข้อมูลได้')
        }
        setCustomerToDelete(null)
    }

    // handleSave is now handled in CustomerModal's onSave prop which calls this implicitly?
    // No, CustomerModal calls onSave prop passed to it.
    // In previous code:
    /*
    <CustomerModal
        onSave={(savedCustomer) => { ... logic ... }}
    />
    */

    const filteredCustomers = customers.filter(c => {
        const term = searchTerm.toLowerCase()
        return (
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.phone && c.phone.toLowerCase().includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term))
        )
    })

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                    <Users className="text-primary-600" size={28} />
                                    จัดการลูกค้า
                                </h1>
                                <p className="text-sm text-secondary-500 mt-1">ทั้งหมด {filteredCustomers.length} รายการ</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Removed Reset Data button as it's no longer relevant for Supabase/Production */}
                            <button
                                onClick={handleAdd}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                            >
                                <UserPlus size={18} />
                                เพิ่มลูกค้าใหม่
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>จัดการลูกค้า - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, เบอร์โทร, หรืออีเมล..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                        className="w-full pl-11 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">ชื่อลูกค้า</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">เบอร์โทร</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">Social</th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-700 uppercase">สื่อ</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-secondary-700 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-secondary-500">
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : paginatedCustomers.length > 0 ? (
                                    paginatedCustomers.map((customer, index) => (
                                        <tr key={customer.id} className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-secondary-900">{customer.name}</div>
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
                                                    {customer.phone || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    {(customer.line || customer.lineId) && (
                                                        <span className="p-1.5 bg-[#06c755]/10 text-[#06c755] rounded-lg" title={`Line: ${customer.line || customer.lineId}`}>
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


            {/* Customer Modal */}
            <CustomerModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                customer={editingCustomer}
                onSave={async (savedCustomer) => {
                    // Prepare data for DataManager
                    const customerPayload = { ...savedCustomer }
                    if (editingCustomer) {
                        customerPayload.id = editingCustomer.id
                    }

                    const result = await DataManager.saveCustomer(customerPayload)

                    if (result) {
                        // Reload customers to get complete data with relations
                        await loadCustomers()
                        setShowModal(false)
                        setEditingCustomer(null)
                    } else {
                        alert('บันทึกไม่สำเร็จ กรุณาลองใหม่')
                    }
                }}
            />

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="ยืนยันการลบลูกค้า"
                message="คุณต้องการลบข้อมูลลูกค้านี้หรือไม่?"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setShowDeleteConfirm(false)
                    setCustomerToDelete(null)
                }}
            />
        </AppLayout>
    )
}
