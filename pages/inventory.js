import { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import InventoryCheckInModal from '../components/InventoryCheckInModal'
import InventoryCheckOutModal from '../components/InventoryCheckOutModal'
import QRDisplayModal from '../components/QRDisplayModal'
import TrackingTimeline from '../components/TrackingTimeline'
import StockCheckModal from '../components/StockCheckModal'
import QRScanner from '../components/QRScanner'
import { useLanguage } from '../contexts/LanguageContext'
import {
    Package,
    Search,
    Plus,
    Filter,
    QrCode,
    ArrowRightLeft,
    Box,
    MapPin,
    History,
    LogOut,
    X,
    AlertTriangle,
    ClipboardCheck
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'


export default function InventoryPage() {
    const { t } = useLanguage()
    const [items, setItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all') // all, in_stock, low_stock
    const [showCheckInModal, setShowCheckInModal] = useState(false)
    const [showCheckOutModal, setShowCheckOutModal] = useState(false)
    const [showQRModal, setShowQRModal] = useState(false)
    const [showTrackingModal, setShowTrackingModal] = useState(false)
    const [showStockCheckModal, setShowStockCheckModal] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [trackingEvents, setTrackingEvents] = useState([])
    const [showMarkLostConfirm, setShowMarkLostConfirm] = useState(false)
    const [itemToMarkLost, setItemToMarkLost] = useState(null)

    const handleScan = (code) => {
        setSearchTerm(code)
        setShowScanner(false)
    }

    useEffect(() => {
        loadInventory()
    }, [])

    const loadInventory = async () => {
        setIsLoading(true)
        const data = await DataManager.getInventoryItems()
        setItems(data)
        setIsLoading(false)
    }

    const handleTrackItem = async (item) => {
        setSelectedItem(item)
        // Optimistically show modal while loading? Or wait? 
        // Let's show modal and have it display loading state if needed, 
        // but for simplicity we fetch first.
        const history = await DataManager.getItemTrackingHistory(item.id)
        setTrackingEvents(history)
        setShowTrackingModal(true)
    }

    const handleViewQR = (item) => {
        setSelectedItem(item)
        setShowQRModal(true)
    }

    const handleMarkLost = (item) => {
        setItemToMarkLost(item)
        setShowMarkLostConfirm(true)
    }

    const handleConfirmMarkLost = async () => {
        setShowMarkLostConfirm(false)
        if (!itemToMarkLost) return

        const success = await DataManager.markItemLost(itemToMarkLost.id)
        if (success) {
            alert(t('Item marked as lost'))
            loadInventory()
        } else {
            alert(t('Failed to mark item as lost'))
        }
        setItemToMarkLost(null)
    }

    const filteredItems = items.filter(item => {
        const matchesSearch =
            item.qr_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.product?.code?.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (filter === 'in_stock') return item.status === 'in_stock'
        // Add more filters as needed

        return true
    })

    return (
        <AppLayout>
            <Head>
                <title>{t('Inventory')} (Stock) - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <Box className="text-primary-600" />
                            {t('Inventory Management')}
                        </h1>
                        <p className="text-secondary-500 text-sm">{t('Manage stock, check-in/out, and track items')}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors shadow-sm"
                        >
                            <QrCode size={20} />
                            {t('Scan QR')}
                        </button>
                        <button
                            onClick={() => setShowCheckOutModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 rounded-lg text-danger-600 hover:bg-danger-50 font-medium transition-colors shadow-sm"
                        >
                            <LogOut size={20} />
                            {t('Check-out')}
                        </button>
                        <button
                            onClick={() => setShowCheckInModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            {t('Check-in Item')}
                        </button>
                    </div>
                </div>

                {/* Main Actions Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowStockCheckModal(true)}
                        className="flex items-center justify-center gap-3 p-4 bg-white border border-secondary-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all group"
                    >
                        <div className="bg-primary-50 p-2 rounded-lg group-hover:bg-primary-100 transition-colors">
                            <ClipboardCheck className="text-primary-600" size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-secondary-900">{t('Stock Check Mode')}</h3>
                            <p className="text-xs text-secondary-500">{t('Scan to audit inventory')}</p>
                        </div>
                    </button>
                    {/* Placeholder for other stats or quick actions */}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder={t('Search by QR, Product Name, Code...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Inventory List */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-secondary-50 border-b border-secondary-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Item / QR')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Product')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Location')}</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Status')}</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-secondary-500">{t('Loading inventory...')}</td>
                                </tr>
                            ) : filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <QrCode size={16} className="text-secondary-400" />
                                                <span className="font-mono text-sm font-medium text-primary-600">{item.qr_code}</span>
                                            </div>
                                            <div className="text-xs text-secondary-400 mt-1">Lot: {item.lot_number || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-secondary-900">{item.product?.name}</div>
                                            <div className="text-xs text-secondary-500">{item.product?.code}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-sm text-secondary-600">
                                                <MapPin size={14} />
                                                {item.current_location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${item.status === 'in_stock' ? 'bg-success-100 text-success-700' :
                                                    item.status === 'sold' ? 'bg-secondary-100 text-secondary-700' :
                                                        'bg-warning-100 text-warning-700'}`}>
                                                {t(item.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleViewQR(item)}
                                                className="text-secondary-400 hover:text-primary-600 transition-colors mr-2"
                                                title={t('View QR')}
                                            >
                                                <QrCode size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleTrackItem(item)}
                                                className="text-secondary-400 hover:text-primary-600 transition-colors mr-2"
                                                title={t('View History')}
                                            >
                                                <History size={18} />
                                            </button>
                                            {item.status !== 'lost' && item.status !== 'sold' && (
                                                <button
                                                    onClick={() => handleMarkLost(item)}
                                                    className="text-secondary-400 hover:text-danger-600 transition-colors"
                                                    title={t('Mark as Lost')}
                                                >
                                                    <AlertTriangle size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-secondary-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Box size={48} className="text-secondary-300 mb-4" />
                                            <p className="text-lg font-medium text-secondary-900">{t('No Inventory Items Found')}</p>
                                            <p className="text-sm text-secondary-500 mt-1">{t('Check-in items to get started')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showCheckInModal && (
                <InventoryCheckInModal
                    isOpen={showCheckInModal}
                    onClose={() => setShowCheckInModal(false)}
                    onSuccess={loadInventory}
                />
            )}

            {showCheckOutModal && (
                <InventoryCheckOutModal
                    isOpen={showCheckOutModal}
                    onClose={() => setShowCheckOutModal(false)}
                    onSuccess={loadInventory}
                />
            )}

            <QRDisplayModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                qrCode={selectedItem?.qr_code || ''}
                productName={selectedItem?.product?.name || 'Unknown Product'}
                lotNumber={selectedItem?.lot_number}
            />

            {/* Tracking Modal */}
            {showTrackingModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-secondary-100 flex items-center justify-between bg-secondary-50 rounded-t-xl">
                            <div>
                                <h3 className="text-lg font-bold text-secondary-900">{t('Item Journey Tracking')}</h3>
                                <p className="text-secondary-500 text-sm font-mono mt-1">
                                    QR: {selectedItem?.qr_code}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowTrackingModal(false)}
                                className="text-secondary-400 hover:text-secondary-600 p-1 hover:bg-secondary-200 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <TrackingTimeline events={trackingEvents} />
                        </div>

                        <div className="p-4 border-t border-secondary-100 flex justify-end">
                            <button
                                onClick={() => setShowTrackingModal(false)}
                                className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 font-medium transition-colors"
                            >
                                {t('Close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <StockCheckModal
                isOpen={showStockCheckModal}
                onClose={() => setShowStockCheckModal(false)}
            />

            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <ConfirmDialog
                isOpen={showMarkLostConfirm}
                title={t('Confirm Mark Lost')}
                message={itemToMarkLost ? t('Confirm Mark Lost').replace('{qr}', itemToMarkLost.qr_code) : ''}
                onConfirm={handleConfirmMarkLost}
                onCancel={() => {
                    setShowMarkLostConfirm(false)
                    setItemToMarkLost(null)
                }}
            />
        </AppLayout>
    )
}
