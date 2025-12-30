import { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import QCInspectionModal from '../components/QCInspectionModal'
import {
    CheckCircle,
    Search,
    Filter,
    QrCode,
    Scan,
    LayoutGrid,
    AlertCircle,
    Clock
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function QCPage() {
    const [queue, setQueue] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState('pending') // pending, passed, failed, all
    const [selectedItem, setSelectedItem] = useState(null)
    const [showInspectionModal, setShowInspectionModal] = useState(false)

    useEffect(() => {
        loadQueue()
    }, [])

    const loadQueue = async (silent = false) => {
        if (!silent) setIsLoading(true)
        // Fetch items that are 'in_stock' (Candidates for QC)
        // Ideally we filter by 'not yet inspected', but for MVP we list all stock
        const data = await DataManager.getQCQueue()
        setQueue(data)
        if (!silent) setIsLoading(false)
    }

    const handleInspect = (item) => {
        setSelectedItem(item)
        setShowInspectionModal(true)
    }

    const handleScanToInspect = async () => {
        const { value: qrCode } = await Swal.fire({
            title: 'Scan Item QR',
            input: 'text',
            inputLabel: 'Scan the QR code on the item tag',
            inputPlaceholder: 'ITEM-XXX...',
            showCancelButton: true,
            confirmButtonText: 'Inspect',
            cancelButtonText: 'Cancel'
        })

        if (!qrCode) return

        // 1. Search in current queue first
        const foundInQueue = queue.find(i => i.qr_code.toLowerCase() === qrCode.toLowerCase())
        if (foundInQueue) {
            handleInspect(foundInQueue)
            return
        }

        // 2. If not in queue, fetch from DB (in case it's not loaded or filtered out)
        // For MVP, we just show error if not in queue, assuming queue loads all 'qc_pending' / 'in_stock'
        // But let's try to be smart.
        try {
            // Note: DataManager.getInventoryItemByQR gives us the item.
            // We need to import DataManager if not already valid? It is imported.
            Swal.fire({ title: 'Searching...', didOpen: () => Swal.showLoading() })
            const item = await DataManager.getInventoryItemByQR(qrCode)
            Swal.close()

            if (item) {
                handleInspect(item)
            } else {
                Swal.fire('Not Found', `Item ${qrCode} not found in inventory.`, 'error')
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const filteredQueue = queue.filter(item => {
        // 1. Search filter
        const s = searchTerm.toLowerCase()
        const matchesSearch = (
            item.qr_code?.toLowerCase().includes(s) ||
            item.product?.name?.toLowerCase().includes(s) ||
            item.product?.product_code?.toLowerCase().includes(s)
        )
        if (!matchesSearch) return false

        // 2. Status filter
        const hasQCRecord = item.qc_records && item.qc_records.length > 0
        const lastResult = hasQCRecord ? item.qc_records[item.qc_records.length - 1].status : null

        switch (filter) {
            case 'pending':
                return !hasQCRecord || item.status === 'pending_binding' || item.status === 'qc_pending'
            case 'passed':
                return hasQCRecord && lastResult === 'pass'
            case 'failed':
                return hasQCRecord && (lastResult === 'fail' || lastResult === 'rework')
            case 'all':
            default:
                return true
        }
    })

    return (
        <AppLayout>
            <Head>
                <title>Quality Control (QC) - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <CheckCircle className="text-secondary-600" />
                            Quality Control / Inspection
                        </h1>
                        <p className="text-secondary-500 text-sm">Inspect received items and verify quality.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleScanToInspect}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors shadow-sm"
                        >
                            <QrCode size={20} />
                            Scan to Inspect
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search QR, Product Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-secondary-300 rounded-lg bg-white focus:outline-none focus:ring-primary-500"
                    >
                        <option value="pending">Pending QC</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed / Rework</option>
                        <option value="all">All Items</option>
                    </select>
                </div>

                {/* Queue List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-secondary-500">Loading QC queue...</div>
                    ) : filteredQueue.length === 0 ? (
                        <div className="col-span-full py-12 text-center flex flex-col items-center">
                            <CheckCircle size={48} className="text-secondary-200 mb-4" />
                            <p className="text-lg font-medium text-secondary-900">No Items Found</p>
                            <p className="text-sm text-secondary-500">All items are up to date.</p>
                        </div>
                    ) : (
                        filteredQueue.map(item => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative">
                                {item.status === 'pending_binding' && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded shadow-sm flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            SWIFT BOUND
                                        </span>
                                    </div>
                                )}

                                <div className="p-4 border-b border-secondary-100 flex items-start gap-4">
                                    <div className="w-16 h-16 bg-secondary-100 rounded-lg shrink-0 overflow-hidden relative group">
                                        {item.product?.image || (item.evidence && item.evidence[0]?.photo_url) ? (
                                            <img
                                                src={item.product?.image || item.evidence[0]?.photo_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <LayoutGrid className="w-full h-full p-4 text-secondary-400" />
                                        )}
                                        {item.total_boxes > 1 && (
                                            <div className="absolute bottom-0 right-0 left-0 bg-black/60 text-white text-[9px] text-center font-bold py-0.5">
                                                BOX {item.box_number}/{item.total_boxes}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-secondary-900 truncate" title={item.product?.name}>
                                            {item.product?.name || (
                                                <span className="text-secondary-400 italic">Unidentified Product</span>
                                            )}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-secondary-500 truncate">
                                                {item.product?.product_code || 'SKU PENDING'}
                                            </p>
                                            {item.set_id && (
                                                <span className="text-[10px] font-mono bg-primary-50 text-primary-600 px-1 rounded border border-primary-100">
                                                    #{item.set_id.split('-')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs font-mono bg-secondary-100 px-1.5 py-0.5 rounded text-secondary-600">
                                                {item.qr_code}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-4 py-2 bg-secondary-50/50 border-b border-secondary-100">
                                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                        {item.evidence?.length > 0 ? (
                                            item.evidence.map((ev, i) => (
                                                <div key={i} className="w-8 h-8 rounded border border-secondary-200 bg-white overflow-hidden shrink-0 shadow-sm" title={ev.category}>
                                                    <img src={ev.photo_url} className="w-full h-full object-cover" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-8 flex items-center">
                                                <span className="text-[10px] text-secondary-400 italic">No inbound evidence</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 flex-1">
                                    <div className="space-y-2 text-xs text-secondary-600">
                                        <div className="flex justify-between">
                                            <span>Location:</span>
                                            <span className="font-medium">{item.current_location || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Received:</span>
                                            <span className="font-medium">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Status:</span>
                                            <span className={`font-medium capitalize ${item.status === 'in_stock' ? 'text-blue-600' :
                                                item.status === 'damaged' ? 'text-red-600' :
                                                    item.status === 'pending_binding' ? 'text-amber-600' :
                                                        'text-secondary-600'
                                                }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 border-t border-secondary-200 bg-white">
                                    <button
                                        onClick={() => handleInspect(item)}
                                        className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-sm
                                            ${item.status === 'pending_binding'
                                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                                : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                                    >
                                        <CheckCircle size={16} />
                                        {item.status === 'pending_binding' ? 'Identify & Inspect' : 'Inspect'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <QCInspectionModal
                isOpen={showInspectionModal}
                onClose={() => setShowInspectionModal(false)}
                onItemSaved={() => {
                    loadQueue(true) // Silent refresh
                }}
                item={selectedItem}
            />
        </AppLayout>
    )
}
