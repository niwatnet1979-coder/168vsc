import { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import PurchaseOrderModal from '../components/PurchaseOrderModal'
import {
    ShoppingBag,
    Plus,
    Search,
    Filter,
    FileText,
    Truck,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

export default function PurchasingPage() {
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [viewMode, setViewMode] = useState('orders') // 'orders' | 'suggestions'
    const [suggestions, setSuggestions] = useState([])

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
                <title>Purchasing - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <ShoppingBag className="text-primary-600" />
                            Procurement (Purchasing)
                        </h1>
                        <p className="text-secondary-500 text-sm">Manage Purchase Orders and Landed Costs</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        New PO
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
                    Purchase Orders
                </button>
                <button
                    onClick={() => setViewMode('suggestions')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors
                            ${viewMode === 'suggestions'
                            ? 'border-primary-600 text-primary-700'
                            : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                >
                    <span>Reorder Suggestions</span>
                    <span className="bg-danger-100 text-danger-700 text-xs px-1.5 py-0.5 rounded-full">
                        Low Stock
                    </span>
                </button>
            </div>

            {viewMode === 'suggestions' ? (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-warning-50 border-b border-warning-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase">Product</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase text-center">Current Stock</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase text-center">Min Level</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase text-center">Suggested Order</th>
                                <th className="px-6 py-3 text-xs font-semibold text-warning-800 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200">
                            {isLoading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-secondary-500">Scanning inventory...</td></tr>
                            ) : suggestions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-secondary-500">
                                        <div className="flex flex-col items-center">
                                            <CheckCircle size={48} className="text-success-500 mb-2" />
                                            <p className="text-secondary-900 font-medium">All Stock Levels Healthy</p>
                                            <p className="text-sm">No items are below minimum stock level.</p>
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
                                                    <div className="font-medium text-secondary-900">{item.name}</div>
                                                    <div className="text-xs text-secondary-500">{item.code}</div>
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
                                            <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded-lg font-medium">
                                                +{item.reorder_qty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline"
                                            >
                                                Create PO
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
                                placeholder="Search Supplier or PO #"
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
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="ordered">Ordered</option>
                            <option value="shipping">Shipping</option>
                            <option value="received">Received</option>
                        </select>
                    </div>

                    {/* List */}
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-secondary-500 uppercase">PO #</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-secondary-500 uppercase">Supplier</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-secondary-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-secondary-500 uppercase">Expect Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-secondary-500 uppercase text-right">Total Cost</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-secondary-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-secondary-500">
                                            Loading orders...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-secondary-500">
                                            No purchase orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((po) => (
                                        <tr key={po.id} className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-secondary-900">
                                                {po.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 text-sm text-secondary-900 font-medium">
                                                {po.supplier_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                                                    {po.status ? po.status.toUpperCase() : 'DRAFT'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-secondary-600">
                                                {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-secondary-900 font-mono text-right">
                                                {po.total_landed_cost > 0 ? (
                                                    <span>฿{po.total_landed_cost.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-secondary-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-secondary-600">
                                                <button
                                                    onClick={() => window.location.href = `/purchasing/${po.id}`}
                                                    className="text-primary-600 hover:text-primary-800 font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <PurchaseOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={() => {
                    setShowCreateModal(false)
                    loadOrders()
                }}
            />
        </AppLayout >
    )
}
