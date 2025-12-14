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

export default function QCPage() {
    const [queue, setQueue] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedItem, setSelectedItem] = useState(null)
    const [showInspectionModal, setShowInspectionModal] = useState(false)

    useEffect(() => {
        loadQueue()
    }, [])

    const loadQueue = async () => {
        setIsLoading(true)
        // Fetch items that are 'in_stock' (Candidates for QC)
        // Ideally we filter by 'not yet inspected', but for MVP we list all stock
        const data = await DataManager.getQCQueue()
        setQueue(data)
        setIsLoading(false)
    }

    const handleInspect = (item) => {
        setSelectedItem(item)
        setShowInspectionModal(true)
    }

    const filteredQueue = queue.filter(item => {
        const s = searchTerm.toLowerCase()
        return (
            item.qr_code?.toLowerCase().includes(s) ||
            item.product?.name?.toLowerCase().includes(s) ||
            item.product?.code?.toLowerCase().includes(s)
        )
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
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-300 rounded-lg text-secondary-700 hover:bg-secondary-50 font-medium transition-colors shadow-sm">
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
                    <select className="px-4 py-2 border border-secondary-300 rounded-lg bg-white focus:outline-none focus:ring-primary-500">
                        <option value="all">All Items</option>
                        <option value="pending">Pending QC</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
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
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-4 border-b border-secondary-100 flex items-start gap-4">
                                    <div className="w-16 h-16 bg-secondary-100 rounded-lg shrink-0 overflow-hidden">
                                        {item.product?.image ? (
                                            <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <LayoutGrid className="w-full h-full p-4 text-secondary-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-medium text-secondary-900 truncate" title={item.product?.name}>
                                            {item.product?.name || 'Unknown Product'}
                                        </h3>
                                        <p className="text-xs text-secondary-500 mt-1">
                                            {item.product?.code}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs font-mono bg-secondary-100 px-1.5 py-0.5 rounded text-secondary-600">
                                                {item.qr_code}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-secondary-50 flex-1">
                                    <div className="space-y-2 text-xs text-secondary-600">
                                        <div className="flex justify-between">
                                            <span>Location:</span>
                                            <span className="font-medium">{item.current_location}</span>
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
                                        className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={16} />
                                        Insepct
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
                    loadQueue() // Refresh list
                }}
                item={selectedItem}
            />
        </AppLayout>
    )
}
