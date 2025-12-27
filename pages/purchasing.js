import { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import PurchaseOrderModal from '../components/PurchaseOrderModal'
import { useLanguage } from '../contexts/LanguageContext'
import {
    ShoppingBag,
    Plus,
    Search,
    Filter,
    FileText,
    Truck,
    CheckCircle,
    AlertCircle,
    Box,
    Palette,
    Gem,
    Trash2
} from 'lucide-react'
import { showConfirm, showSuccess, showError } from '../lib/sweetAlert'

export default function PurchasingPage() {
    const { t } = useLanguage()
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [viewMode, setViewMode] = useState('orders')
    const [suggestions, setSuggestions] = useState([])
    const [selectedSuggestion, setSelectedSuggestion] = useState(null)

    useEffect(() => {
        if (viewMode === 'orders') {
            loadOrders()
        } else {
            loadSuggestions()
        }
    }, [viewMode])

    const loadSuggestions = async () => {
        setIsLoading(true)
        const data = await DataManager.getLowStockItems()
        setSuggestions(data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadOrders()
    }, [])

    const loadOrders = async () => {
        setIsLoading(true)
        const data = await DataManager.getPurchaseOrders()
        setOrders(data)
        setIsLoading(false)
    }

    const handleDeletePO = async (poId) => {
        const result = await showConfirm({
            title: t('Confirm Delete PO'),
            text: t('Are you sure you want to delete this Purchase Order?'),
            confirmButtonText: t('Delete'),
            confirmButtonColor: '#d33'
        })

        if (result.isConfirmed) {
            try {
                const success = await DataManager.deletePurchaseOrder(poId)
                if (success) {
                    await showSuccess({ title: t('Deleted'), text: t('Purchase Order deleted successfully') })
                    loadOrders()
                } else {
                    throw new Error('Delete failed')
                }
            } catch (error) {
                showError({ title: t('Error'), text: t('Failed to delete Purchase Order') })
            }
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700'
            case 'ordered': return 'bg-blue-100 text-blue-700'
            case 'shipping': return 'bg-orange-100 text-orange-700'
            case 'received': return 'bg-purple-100 text-purple-700'
            case 'completed': return 'bg-green-100 text-green-700'
            default: return 'bg-gray-100 text-gray-500'
        }
    }

    const filteredOrders = orders.filter(po => {
        const matchesSearch =
            po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.id?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false
        if (filterStatus !== 'all' && po.status !== filterStatus) return false

        return true
    })

    return (
        <AppLayout>
            <Head>
                <title>{t('Purchasing')} - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <ShoppingBag className="text-primary-600" />
                            {t('Procurement (Purchasing)')}
                        </h1>
                        <p className="text-secondary-500 text-sm">{t('Manage Purchase Orders and Landed Costs')}</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        {t('New PO')}
                    </button>
                </div>

            </div>

            {/* Navbar/Tabs */}
            <div className="flex border-b border-secondary-200">
                <button
                    onClick={() => setViewMode('orders')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors
                            ${viewMode === 'orders'
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                >
                    {t('Purchase Orders')}
                </button>
                <button
                    onClick={() => setViewMode('suggestions')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors
                            ${viewMode === 'suggestions'
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                >
                    <span>{t('Reorder Suggestions')}</span>
                    <span className="bg-danger-100 text-danger-700 text-xs px-1.5 py-0.5 rounded-full">
                        {t('Low Stock')}
                    </span>
                </button>
            </div>

            {viewMode === 'suggestions' ? (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-warning-50 border-b border-warning-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase">{t('Product')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase text-center">{t('Current Stock')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase text-center">{t('Min Level')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase text-center">{t('Suggested Order')}</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase">{t('Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-secondary-500">{t('Scanning inventory...')}</td></tr>
                            ) : suggestions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-secondary-500">
                                        <div className="flex flex-col items-center">
                                            <CheckCircle size={48} className="text-success-500 mb-2" />
                                            <p className="text-secondary-900 font-medium">{t('All Stock Levels Healthy')}</p>
                                            <p className="text-sm">{t('No items are below minimum stock level.')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                suggestions.map(item => (
                                    <tr key={item.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-secondary-100 flex items-center justify-center shrink-0">
                                                    {item.image_url ?
                                                        <img src={item.image_url} className="w-full h-full object-cover rounded" />
                                                        : <ShoppingBag size={20} className="text-secondary-400" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="font-medium text-secondary-900 flex items-center gap-1.5 flex-wrap">
                                                        <span>{item.category && `${item.category.split(' ')[1] || item.category} `}{item.name}</span>

                                                        {item.variant_dims && (
                                                            <span className="flex items-center gap-0.5 ml-1 text-secondary-500 font-normal text-xs bg-secondary-100 px-1.5 py-0.5 rounded">
                                                                <Box size={12} /> {item.variant_dims}
                                                            </span>
                                                        )}
                                                        {item.variant_color && (
                                                            <span className="flex items-center gap-0.5 ml-1 text-secondary-500 font-normal text-xs bg-secondary-100 px-1.5 py-0.5 rounded">
                                                                <Palette size={12} /> {item.variant_color.split(' ').pop()}
                                                            </span>
                                                        )}
                                                        {item.variant_crystal && (
                                                            <span className="flex items-center gap-0.5 ml-1 text-secondary-500 font-normal text-xs bg-secondary-100 px-1.5 py-0.5 rounded">
                                                                <Gem size={12} /> {item.variant_crystal.split(' ').pop()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-secondary-500 mt-1 font-mono">{item.code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-danger-600">{item.current_stock}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-secondary-600">
                                            {item.min_stock_level}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium block">
                                                +{item.reorder_qty}
                                            </span>
                                            {item.allocated_qty > 0 && (
                                                <div className="text-[10px] text-secondary-500 mt-1">
                                                    ({t('Pending')}: {item.allocated_qty})
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedSuggestion(item)
                                                    setShowCreateModal(true)
                                                }}
                                                className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline"
                                            >
                                                {t('Create PO')}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                // Existing Orders List
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 text-secondary-400" size={20} />
                            <input
                                type="text"
                                placeholder={t('Search Supplier or PO #')}
                                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">{t('All Status')}</option>
                            <option value="draft">{t('Draft')}</option>
                            <option value="ordered">{t('Ordered')}</option>
                            <option value="shipping">{t('Shipping')}</option>
                            <option value="received">{t('Received')}</option>
                            <option value="completed">{t('Completed')}</option>
                        </select>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary-50 border-b border-secondary-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">PO #</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Supplier')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Date')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase">{t('Details')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase">{t('Total (THB)')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Payment')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Status')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {isLoading ? (
                                        <tr><td colSpan="8" className="px-6 py-8 text-center text-secondary-500">{t('Loading Orders...')}</td></tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-8 text-center text-secondary-500">{t('No orders found.')}</td></tr>
                                    ) : (
                                        filteredOrders.map(po => (
                                            <tr key={po.id} className="hover:bg-secondary-50">
                                                <td
                                                    className="px-6 py-4 font-mono text-primary-600 font-medium cursor-pointer hover:underline hover:text-primary-800"
                                                    onClick={() => {
                                                        setSelectedSuggestion(po)
                                                        setShowCreateModal(true)
                                                    }}
                                                >
                                                    #{po.id.slice(0, 8)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-secondary-900">{po.supplier_name}</div>
                                                    {po.external_ref_no && (
                                                        <div className="text-xs text-secondary-500">Ref: {po.external_ref_no}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-secondary-600 text-sm">
                                                    {new Date(po.created_at).toLocaleDateString('th-TH')}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm font-medium text-secondary-900">{po.items?.length || 0} items</div>
                                                    <div className="text-xs text-secondary-500">
                                                        Ship: {po.shipping_origin > 0 ? `+${(po.shipping_origin * (po.exchange_rate || 5)).toLocaleString()}` : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-secondary-900">
                                                    ฿{Number(po.total_landed_cost).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border
                                                        ${po.payment_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200'
                                                            : po.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                        {po.payment_status || 'unpaid'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                                                        {t(po.status.charAt(0).toUpperCase() + po.status.slice(1))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center flex gap-2 justify-center">
                                                    {po.status === 'shipping' && (
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('Receive this order?')) {
                                                                    const success = await DataManager.receivePurchaseOrder(po.id)
                                                                    if (success) loadOrders()
                                                                }
                                                            }}
                                                            className="p-1 hover:bg-purple-100 rounded text-purple-600" title="Receive Items">
                                                            <Box size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeletePO(po.id)}
                                                        className="p-1 hover:bg-red-100 rounded text-red-500">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <PurchaseOrderModal
                isOpen={showCreateModal}
                initialItem={selectedSuggestion}
                onClose={() => {
                    setShowCreateModal(false)
                    setSelectedSuggestion(null)
                }}
                onSave={() => {
                    setShowCreateModal(false)
                    setSelectedSuggestion(null)
                    loadOrders()
                }}
            />
        </AppLayout>
    )
}
