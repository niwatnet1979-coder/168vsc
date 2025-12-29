import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import InventoryCheckInModal from '../components/InventoryCheckInModal'
import InventoryCheckOutModal from '../components/InventoryCheckOutModal'
import InventoryEditModal from '../components/InventoryEditModal' // Added
import InventoryHelpModal from '../components/InventoryHelpModal' // Added

import TrackingTimeline from '../components/TrackingTimeline'
import StockCheckModal from '../components/StockCheckModal'
import QRScanner from '../components/QRScanner'
import { useLanguage } from '../contexts/LanguageContext'
import PrintModal from '../components/PrintModal'
import EvidenceViewer from '../components/EvidenceViewer'
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
    ClipboardCheck,
    Trash2,
    Edit, // Added
    HelpCircle, // Added
    Printer, // Added
    BoxSelect, // Added
    Palette, // Added
    Diamond, // Added
    Gem, // Added
    Image as ImageIcon
} from 'lucide-react'
import { showConfirm, showSuccess, showError } from '../lib/sweetAlert'


export default function InventoryPage() {
    const { t } = useLanguage()
    const [items, setItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('all') // all, in_stock, low_stock
    const [showCheckInModal, setShowCheckInModal] = useState(false)
    const [showCheckOutModal, setShowCheckOutModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false) // Added
    const [showHelpModal, setShowHelpModal] = useState(false) // Added
    const [editingItem, setEditingItem] = useState(null) // Added

    const [showTrackingModal, setShowTrackingModal] = useState(false)
    const [showStockCheckModal, setShowStockCheckModal] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [trackingEvents, setTrackingEvents] = useState([])

    const [itemToPrint, setItemToPrint] = useState(null)
    const [viewingEvidenceItem, setViewingEvidenceItem] = useState(null)

    const onPrintClick = (item) => {
        setItemToPrint(item)
    }

    const handleEdit = (item) => { // Added
        setEditingItem(item)
        setShowEditModal(true)
    }

    const handleDelete = async (item) => { // Added
        const result = await showConfirm({
            title: t('Delete Item?'),
            text: `${t('Are you sure you want to delete')} ${item.product?.name} (${item.qr_code})? ${t('This cannot be undone.')}`,
            confirmButtonText: t('Delete'),
            confirmButtonColor: '#d33'
        })

        if (result.isConfirmed) {
            const success = await DataManager.deleteInventoryItem(item.id)
            if (success) {
                await showSuccess({ title: t('Deleted successfully') })
                loadInventory()
            } else {
                await showError({ title: t('Failed to delete item') })
            }
        }
    }


    const handleScan = (code) => {
        setSearchTerm(code)
        setShowScanner(false)
    }

    useEffect(() => {
        loadInventory()
    }, [])

    const loadInventory = async () => {
        setIsLoading(true)
        try {
            const data = await DataManager.getInventoryItems()
            setItems(data)
        } catch (error) {
            console.error(error)
            await showError({
                title: t('Error loading inventory'),
                text: error.message || 'Failed to fetch items'
            })
        } finally {
            setIsLoading(false)
        }
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



    const handleMarkLost = async (item) => {
        const result = await showConfirm({
            title: t('Confirm Mark Lost'),
            text: t('Confirm Mark Lost').replace('{qr}', item.qr_code),
            confirmButtonText: 'ยืนยัน',
            confirmButtonColor: '#d33'
        })

        if (!result.isConfirmed) return

        const success = await DataManager.markItemLost(item.id)
        if (success) {
            await showSuccess({ title: t('Item marked as lost') })
            loadInventory()
        } else {
            await showError({ title: t('Failed to mark item as lost') })
        }
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
                            <button
                                onClick={() => setShowHelpModal(true)}
                                className="ml-2 text-secondary-400 hover:text-primary-600 transition-colors"
                                title={t('Help Guide')}
                            >
                                <HelpCircle size={20} />
                            </button>
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
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Item / QR')}</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Box')}</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Evidence')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Product')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">{t('Location')}</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Status')}</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-secondary-600 uppercase">{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-secondary-500">{t('Loading inventory...')}</td>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {item.total_boxes > 1 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100">
                                                            {item.box_number} / {item.total_boxes}
                                                        </span>
                                                        {item.set_id && (
                                                            <span className="text-[8px] text-primary-600 mt-0.5 font-bold">SET: #{item.set_id}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-secondary-300 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {item.photos && item.photos.length > 0 ? (
                                                    <button
                                                        onClick={() => setViewingEvidenceItem(item)}
                                                        className="group relative inline-flex items-center justify-center p-0.5"
                                                        title="View Evidence Photos"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-secondary-100 ring-1 ring-secondary-200 group-hover:ring-primary-400 transition-all">
                                                            <img src={item.photos[0].photo_url} className="w-full h-full object-cover" />
                                                        </div>
                                                        {item.photos.length > 1 && (
                                                            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm ring-1 ring-primary-700/10">
                                                                {item.photos.length}
                                                            </span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <ImageIcon size={18} className="text-secondary-200 mx-auto" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    {/* Product Image */}
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={item.variants?.image_url || item.product?.image || item.product?.image_url || '/placeholder.png'}
                                                            alt={item.product?.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        {/* Matches Print Format */}
                                                        <div className="font-bold text-sm text-secondary-900 font-mono">
                                                            {item.variants?.sku || item.product?.product_code || item.product?.code}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-secondary-600 mt-1 flex-wrap">
                                                            <span>{item.product?.name}</span>
                                                            {item.product?.material && (
                                                                <>
                                                                    <span className="text-secondary-300">•</span>
                                                                    <span>{item.product.material}</span>
                                                                </>
                                                            )}
                                                            {item.variant_id && item.variants && (
                                                                <div className="flex items-center gap-2 border-l border-secondary-300 pl-2">
                                                                    {item.variants.size && (
                                                                        <span className="flex items-center gap-1" title="Size">
                                                                            <BoxSelect size={12} className="text-secondary-400" />
                                                                            {item.variants.size}
                                                                        </span>
                                                                    )}
                                                                    {item.variants.color && (
                                                                        <span className="flex items-center gap-1" title="Color">
                                                                            <Palette size={12} className="text-secondary-400" />
                                                                            {item.variants.color}
                                                                        </span>
                                                                    )}
                                                                    {item.variants.crystal_color && (
                                                                        <span className="flex items-center gap-1" title="Crystal">
                                                                            <Diamond size={12} className="text-secondary-400" />
                                                                            {item.variants.crystal_color}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {item.product?.description && (
                                                            <div className="text-[10px] text-secondary-400 mt-0.5 line-clamp-1">
                                                                {item.product.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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
                                                    onClick={() => onPrintClick(item)}
                                                    className="text-secondary-400 hover:text-secondary-700 transition-colors mr-2"
                                                    title={t('Print Label')}
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-secondary-400 hover:text-primary-600 transition-colors mr-2"
                                                    title={t('Edit Item')}
                                                >
                                                    <Edit size={18} />
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
                                                        className="text-secondary-400 hover:text-danger-600 transition-colors mr-2"
                                                        title={t('Mark as Lost')}
                                                    >
                                                        <AlertTriangle size={18} />
                                                    </button>
                                                )}
                                                {/* Delete button moved to Edit Modal */}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-secondary-500">
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

                {/* Print Preview Modal */}
                {itemToPrint && (
                    <PrintModal
                        itemToPrint={itemToPrint}
                        onClose={() => setItemToPrint(null)}
                    />
                )}

                {viewingEvidenceItem && (
                    <EvidenceViewer
                        item={viewingEvidenceItem}
                        onClose={() => setViewingEvidenceItem(null)}
                    />
                )}

                {/* Modals */}
                {showEditModal && (
                    <InventoryEditModal
                        isOpen={showEditModal}
                        onClose={() => setShowEditModal(false)}
                        item={editingItem}
                        onSave={loadInventory}
                        onDelete={handleDelete}
                    />
                )}

                {showHelpModal && (
                    <InventoryHelpModal
                        isOpen={showHelpModal}
                        onClose={() => setShowHelpModal(false)}
                    />
                )}

                {showCheckInModal && (
                    <InventoryCheckInModal
                        isOpen={showCheckInModal}
                        onClose={() => setShowCheckInModal(false)}
                        onSave={loadInventory}
                    />
                )}

                {showCheckOutModal && (
                    <InventoryCheckOutModal
                        isOpen={showCheckOutModal}
                        onClose={() => setShowCheckOutModal(false)}
                        onSuccess={loadInventory}
                    />
                )}

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
            </div>
        </AppLayout>
    )
}
