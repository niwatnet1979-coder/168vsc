import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { showConfirm, showSuccess, showError } from '../lib/sweetAlert'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import { formatDate } from '../lib/data/helpers'
import {
    Search,
    DollarSign,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Filter,
    ChevronLeft,
    ChevronRight,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    User
} from 'lucide-react'

// Tab Component
const TabButton = ({ active, onClick, children, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
            ? 'bg-primary-600 text-white shadow-md'
            : 'bg-white text-secondary-600 hover:bg-secondary-50 border border-secondary-200'
            }`}
    >
        {Icon && <Icon size={16} />}
        {children}
    </button>
)

import { useLanguage } from '../contexts/LanguageContext'
import PurchaseOrderModal from '../components/PurchaseOrderModal'
import ReimburseModal from '../components/ReimburseModal'
import PaymentModal from '../components/PaymentModal'

export default function FinancePage() {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('receivables')
    const [isLoading, setIsLoading] = useState(true)

    // Reimburse Modal State
    const [selectedReimbursePO, setSelectedReimbursePO] = useState(null)
    const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false)

    // Payment Modal State
    const [selectedPaymentPO, setSelectedPaymentPO] = useState(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

    // Data States
    const [receivables, setReceivables] = useState([])
    const [payables, setPayables] = useState([])
    const [reimbursements, setReimbursements] = useState([])

    // Filter States
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all') // for receivables/payables
    const [reimburseStatus, setReimburseStatus] = useState('pending') // pending | history
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Modal State
    const [selectedPO, setSelectedPO] = useState(null)
    const [isPOModalOpen, setIsPOModalOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [activeTab, reimburseStatus])

    const loadData = async () => {
        setIsLoading(true)
        setSearchTerm('')
        setFilterStatus('all')
        setCurrentPage(1)

        try {
            if (activeTab === 'receivables') {
                await loadReceivables()
            } else if (activeTab === 'payables') {
                await loadPayables()
            } else if (activeTab === 'reimbursement') {
                await loadReimbursements()
            }
        } catch (error) {
            console.error("Error loading finance data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // ... loadReceivables ...

    const loadPayables = async () => {
        const pos = await DataManager.getPayablePurchaseOrders() || []
        const mapped = pos.map(po => {
            const totalTHB = Number(po.total_landed_cost) || 0

            // Logic for 'paid' amount calculation based on status/payment logs
            let paidAmount = 0
            if (po.paid_amount !== undefined && po.paid_amount !== null) {
                paidAmount = Number(po.paid_amount)
            } else if (po.payment_status === 'paid') {
                paidAmount = totalTHB
            } else if (po.payment_status === 'partial') {
                paidAmount = totalTHB / 2 // Fallback approximation
            }

            const outstanding = totalTHB - paidAmount

            return {
                id: po.id,
                date: formatDate(po.created_at),
                supplier: po.supplier_name,
                total: totalTHB,
                paid: paidAmount,
                outstanding: outstanding,
                status: po.payment_status,
                dueDateStr: formatDate(po.expected_date),
                currency: po.currency,
                originalCost: po.shipping_origin
            }
        })
        setPayables(mapped)
    }

    // ... loadReimbursements, getStats ...

    // Copy existing functions ...
    const loadReceivables = async () => {
        const orders = await DataManager.getOrders()
        const calculated = orders.map(order => {
            const total = Number(order.totalAmount) || 0
            const deposit = Number(order.deposit) || 0
            const additionalPaid = Array.isArray(order.payments)
                ? order.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                : 0
            const paid = deposit + additionalPaid
            const outstanding = total - paid

            let status = 'Unpaid'
            if (outstanding <= 0 && total > 0) status = 'Paid'
            else if (paid > 0) status = 'Partial'

            const orderDate = new Date(order.orderDate || order.createdAt)
            const dueDate = new Date(orderDate)
            dueDate.setDate(dueDate.getDate() + 7)

            return {
                id: order.id,
                date: formatDate(orderDate),
                customer: order.customerName || 'Unknown',
                total, deposit, paid, outstanding: Math.max(0, outstanding),
                status,
                dueDate: dueDate,
                dueDateStr: formatDate(dueDate),
                rawDate: orderDate
            }
        }).sort((a, b) => b.rawDate - a.rawDate)
        setReceivables(calculated)
    }

    const loadReimbursements = async () => {
        let queue = []
        if (reimburseStatus === 'pending') {
            queue = await DataManager.getReimbursementQueue() || []
        } else {
            queue = await DataManager.getReimbursementHistory() || []
        }

        const mapped = queue.map(po => ({
            id: po.id,
            date: formatDate(po.payment_date || po.created_at),
            payer: po.payer_name,
            amount: Number(po.total_landed_cost) || 0,
            note: po.remarks || `Reimburse for PO #${po.external_ref_no || po.id.slice(0, 6)}`,
            status: po.is_reimbursed ? 'Reimbursed' : 'pending',
            reimbursedDate: formatDate(po.reimbursed_date),
            slipUrl: po.reimbursed_slip_url
        }))
        setReimbursements(mapped)
    }

    const getStats = () => {
        if (activeTab === 'receivables') {
            return {
                totalRevenue: receivables.reduce((s, i) => s + i.total, 0),
                received: receivables.reduce((s, i) => s + i.paid, 0),
                outstanding: receivables.reduce((s, i) => s + i.outstanding, 0),
                labelRevenue: 'ยอดขายรวม',
                labelReceived: 'รับแล้ว',
                labelOutstanding: 'ค้างรับ'
            }
        } else if (activeTab === 'payables') {
            return {
                totalRevenue: payables.reduce((s, i) => s + i.total, 0),
                received: payables.reduce((s, i) => s + i.paid, 0),
                outstanding: payables.reduce((s, i) => s + i.outstanding, 0),
                labelRevenue: 'ยอดซื้อรวม',
                labelReceived: 'จ่ายแล้ว',
                labelOutstanding: 'ค้างจ่าย'
            }
        } else {
            return {
                totalRevenue: reimbursements.reduce((s, i) => s + i.amount, 0),
                received: 0,
                outstanding: reimbursements.reduce((s, i) => s + i.amount, 0),
                labelRevenue: 'ยอดเบิกทั้งหมด',
                labelReceived: '-',
                labelOutstanding: 'รอจ่ายคืน'
            }
        }
    }
    const stats = getStats()

    const getData = () => {
        if (activeTab === 'receivables') return receivables
        if (activeTab === 'payables') return payables
        return reimbursements
    }

    const currentData = getData().filter(item => {
        const lowerSearch = searchTerm.toLowerCase()
        const matchesSearch =
            (item.id && item.id.toLowerCase().includes(lowerSearch)) ||
            (item.customer && item.customer.toLowerCase().includes(lowerSearch)) ||
            (item.supplier && item.supplier.toLowerCase().includes(lowerSearch)) ||
            (item.payer && item.payer.toLowerCase().includes(lowerSearch))

        if (!matchesSearch) return false

        if (filterStatus === 'all') return true
        if (activeTab === 'receivables') {
            if (filterStatus === 'paid') return item.status === 'Paid'
            if (filterStatus === 'unpaid') return item.status === 'Unpaid'
            if (filterStatus === 'partial') return item.status === 'Partial'
            if (filterStatus === 'overdue') return item.outstanding > 0 && item.dueDate < new Date()
        }
        if (activeTab === 'payables') {
            if (filterStatus === 'paid') return item.status === 'paid'
            if (filterStatus === 'unpaid') return item.status === 'unpaid'
            if (filterStatus === 'unpaid') return item.status === 'unpaid'
            if (filterStatus === 'deposit') return item.status === 'partial'
            if (filterStatus === 'paid') return item.status === 'paid'
        }
        return true
    })

    const totalPages = Math.ceil(currentData.length / itemsPerPage)
    const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    // ... (in handleReimburse)
    const handleReimburse = (item) => {
        setSelectedReimbursePO(item)
        setIsReimburseModalOpen(true)
    }

    const handleReimburseSuccess = () => {
        loadReimbursements()
    }

    const handleRevert = async (id) => {
        const result = await showConfirm({
            title: 'ยกเลิกสถานะคืนเงิน?',
            text: "รายการนี้จะกลับไปอยู่ที่ 'Pending' (รอจ่ายคืน)",
            icon: 'warning',
            confirmButtonText: 'ใช่, ยกเลิก',
            cancelButtonText: 'ไม่',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6'
        })

        if (result.isConfirmed) {
            const success = await DataManager.revertReimbursement(id)
            if (success) {
                await showSuccess({
                    title: 'เรียบร้อย',
                    text: 'รายการถูกย้ายกลับไปที่ Pending แล้ว'
                })
                loadReimbursements()
            } else {
                await showError({
                    title: 'ผิดพลาด',
                    text: 'ไม่สามารถทำรายการได้'
                })
            }
        }
    }

    const handleViewPO = async (id) => {
        // Fetch full PO details including items
        const fullPO = await DataManager.getPurchaseOrderById(id)
        if (fullPO) {
            setSelectedPO(fullPO)
            setIsPOModalOpen(true)
        }
    }

    const handlePOSave = () => {
        loadData() // Refresh list
    }

    const handlePay = (item) => {
        setSelectedPaymentPO(item)
        setIsPaymentModalOpen(true)
    }

    return (
        <AppLayout>
            <Head>
                <title>การเงิน - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header & Tabs */}
                {/* ... existing header code ... */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Wallet className="text-primary-600" size={32} />
                            การเงิน (Finance)
                        </h1>
                        <p className="text-secondary-500 mt-1">บริหารจัดการกระแสเงินสด รับ-จ่าย</p>
                    </div>

                    <div className="flex bg-secondary-100/50 p-1.5 rounded-xl self-start md:self-auto">
                        <TabButton
                            active={activeTab === 'receivables'}
                            onClick={() => setActiveTab('receivables')}
                            icon={ArrowDownLeft}
                        >
                            รายรับ (Receivables)
                        </TabButton>
                        <TabButton
                            active={activeTab === 'payables'}
                            onClick={() => setActiveTab('payables')}
                            icon={ArrowUpRight}
                        >
                            รายจ่าย (Payables)
                        </TabButton>
                        <TabButton
                            active={activeTab === 'reimbursement'}
                            onClick={() => setActiveTab('reimbursement')}
                            icon={User}
                        >
                            เบิกจ่าย (Reimburse)
                        </TabButton>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="stats-card">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-secondary-600 font-medium">{stats.labelRevenue}</span>
                        </div>
                        <div className="text-2xl font-bold text-secondary-900">฿{stats.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="stats-card">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-success-50 rounded-lg text-success-600">
                                <CheckCircle size={20} />
                            </div>
                            <span className="text-secondary-600 font-medium">{stats.labelReceived}</span>
                        </div>
                        <div className="text-2xl font-bold text-success-700">฿{stats.received.toLocaleString()}</div>
                    </div>
                    <div className="stats-card">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-danger-50 rounded-lg text-danger-600">
                                <AlertCircle size={20} />
                            </div>
                            <span className="text-secondary-600 font-medium">{stats.labelOutstanding}</span>
                        </div>
                        <div className="text-2xl font-bold text-danger-700">฿{stats.outstanding.toLocaleString()}</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-secondary-200 shadow-sm">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {activeTab !== 'reimbursement' ? (
                        <div className="flex gap-2">
                            {['all', 'unpaid', 'deposit', 'paid'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterStatus === s ? 'bg-primary-100 text-primary-700' : 'text-secondary-500 hover:bg-secondary-50'}`}>
                                    {s === 'all' ? t('All Status') : t(s.charAt(0).toUpperCase() + s.slice(1))}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setReimburseStatus('pending')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reimburseStatus === 'pending' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setReimburseStatus('history')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${reimburseStatus === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                History
                            </button>
                        </div>
                    )}
                </div>

                {/* Table Data */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">
                                        {activeTab === 'receivables' ? 'Customer' : (activeTab === 'payables' ? 'Supplier' : 'Payer')}
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase">Total</th>
                                    {activeTab !== 'reimbursement' && <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase">Paid</th>}
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase">Outstanding</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase">Status</th>
                                    {activeTab === 'reimbursement' && reimburseStatus === 'history' && (
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase">Paid Date</th>
                                    )}
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {paginatedData.map(item => (
                                    <tr key={item.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-primary-600">
                                            {activeTab === 'payables' ? (
                                                <button onClick={() => handleViewPO(item.id)} className="hover:underline text-left">
                                                    {item.id.length > 8 ? '#' + item.id.slice(0, 8) : '#' + item.id}
                                                </button>
                                            ) : (
                                                <span>{item.id.length > 8 ? '#' + item.id.slice(0, 8) : '#' + item.id}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-secondary-600">{item.date}</td>
                                        <td className="px-6 py-4 font-medium text-secondary-900">
                                            {item.customer || item.supplier || item.payer}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">฿{(item.total ?? item.amount ?? 0).toLocaleString()}</td>
                                        {activeTab !== 'reimbursement' && (
                                            <td className="px-6 py-4 text-right text-success-600">฿{item.paid.toLocaleString()}</td>
                                        )}
                                        <td className="px-6 py-4 text-right font-bold text-danger-600">
                                            {item.outstanding > 0 || (activeTab === 'reimbursement') ? `฿${(item.outstanding || item.amount).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                ${item.status === 'Paid' || item.status === 'paid' || item.status === 'Reimbursed' ? 'bg-success-100 text-success-700'
                                                    : item.status === 'pending' ? 'bg-warning-100 text-warning-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        {activeTab === 'reimbursement' && reimburseStatus === 'history' && (
                                            <td className="px-6 py-4 text-center text-sm text-secondary-600 bg-gray-50/50">
                                                {item.reimbursedDate}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            {activeTab === 'receivables' && (
                                                <Link href={`/order?id=${item.id}`} className="text-primary-600 hover:underline text-sm">View</Link>
                                            )}
                                            {activeTab === 'payables' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleViewPO(item.id)} className="text-secondary-500 hover:text-secondary-700 text-sm">
                                                        View
                                                    </button>
                                                    {item.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handlePay(item)}
                                                            className="px-3 py-1 bg-primary-600 text-white text-xs rounded shadow hover:bg-primary-700"
                                                        >
                                                            Pay
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {activeTab === 'reimbursement' && (
                                                item.status === 'pending' ? (
                                                    <button
                                                        onClick={() => handleReimburse(item)}
                                                        className="px-3 py-1 bg-primary-600 text-white text-xs rounded shadow hover:bg-primary-700">
                                                        {t('Pay Back')}
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2 justify-center items-center">
                                                        {item.slipUrl ? (
                                                            <a
                                                                href={item.slipUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="px-2 py-1 bg-white border border-secondary-300 text-secondary-600 text-xs rounded hover:bg-secondary-50 flex items-center gap-1"
                                                                title="View Slip"
                                                            >
                                                                <FileText size={14} />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-300">-</span>
                                                        )}
                                                        <button
                                                            onClick={() => handleRevert(item.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Undo / Delete from History"
                                                        >
                                                            <AlertCircle size={16} />
                                                        </button>
                                                    </div>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {paginatedData.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-secondary-500">No records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <PurchaseOrderModal
                isOpen={isPOModalOpen}
                onClose={() => setIsPOModalOpen(false)}
                onSave={handlePOSave}
                initialItem={selectedPO}
            />

            <ReimburseModal
                isOpen={isReimburseModalOpen}
                onClose={() => setIsReimburseModalOpen(false)}
                poData={selectedReimbursePO}
                onSuccess={handleReimburseSuccess}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                poData={selectedPaymentPO}
                onSuccess={() => loadData()}
            />

            <style jsx>{`
                .stats-card {
                    @apply bg-white p-4 rounded-xl border border-secondary-200 shadow-sm;
                }
            `}</style>
        </AppLayout >
    )
}
