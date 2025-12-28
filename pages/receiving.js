import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import { useLanguage } from '../contexts/LanguageContext'
import { QRCodeSVG } from 'qrcode.react'
import {
    Printer,
    Scan,
    ArrowRight,
    Package,
    CheckCircle,
    AlertTriangle,
    Search
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function ReceivingPage() {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('generate') // generate, scan, map

    // Generate Tab State
    const [genQty, setGenQty] = useState(1)
    const [selectedPo, setSelectedPo] = useState(null)
    const [poList, setPoList] = useState([])
    const [generatedQRs, setGeneratedQRs] = useState([])

    // Scan Tab State
    const [scanInput, setScanInput] = useState('')
    const [scanLog, setScanLog] = useState([])
    const scanInputRef = useRef(null)

    // Map Tab State
    const [mapQrInput, setMapQrInput] = useState('')
    const [activeTempItem, setActiveTempItem] = useState(null)
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [isQCFlag, setIsQCFlag] = useState(false) // New state for QC Flag

    useEffect(() => {
        loadPOs()
        loadProducts()
    }, [])

    const loadPOs = async () => {
        const pos = await DataManager.getPurchaseOrders()
        setPoList(pos.filter(p => p.status === 'ordered' || p.status === 'shipping' || p.status === 'arrived'))
    }

    const loadProducts = async () => {
        const prods = await DataManager.getProducts()
        setProducts(prods)
    }

    // --- Generate QRs ---
    const handleGenerate = async () => {
        try {
            const data = await DataManager.generateTempQRs(genQty, selectedPo?.id)
            setGeneratedQRs(data)
            Swal.fire({
                title: 'Success',
                text: `Generated ${data.length} Temp QRs`,
                icon: 'success'
            })
        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Temp QRs</title>
                <style>
                    body { font-family: sans-serif; }
                    .qr-grid { display: flex; flex-wrap: wrap; gap: 20px; }
                    .qr-item { border: 1px solid #ccc; padding: 10px; text-align: center; width: 150px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="qr-grid">
                    ${generatedQRs.map(item => `
                        <div class="qr-item">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${item.temp_qr_code}" />
                            <div>${item.temp_qr_code}</div>
                            ${selectedPo ? `<div>PO #${selectedPo.id.slice(0, 8)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    // --- Scan (Blind Count) ---
    const handleScan = async (e) => {
        e.preventDefault()
        if (!scanInput) return

        try {
            const item = await DataManager.scanTempItem(scanInput)
            setScanLog(prev => [{ ...item, scanned_at: new Date() }, ...prev])
            setScanInput('')
            // Play sound?
        } catch (error) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: error.message,
                showConfirmButton: false,
                timer: 1500
            })
            setScanInput('') // Clear anyway to prevent block
        }
    }

    // --- Map ---
    const handleFindTemp = async (e) => {
        e.preventDefault()
        try {
            // Re-use scan logic but just fetch
            // Need a getTempItem function or use db directly?
            // DataManager.scanTempItem updates status, we want just peek.
            // But Map starts with finding.
            // Let's assume we implement getTempItemByQR in manager or just use logic here
            // Wait, we need a 'get' not 'scan' for mapping lookup.
            // I'll create DataManager.getTempItem(qr) implicitly or just use scanTempItem if it handles idempotency?
            // User 'scanTempItem' updates status to 'scanned'.
            // MAPPING requires item to be scanned or pending.

            // For now let's try to map directly if we have the QR.
            // But we need to see it first.
            // Let's add DataManager.getTempItem to inventoryManager later.
            // For MVP, I'll direct map.
            Swal.fire('Implementation Pending', 'Need getTempItem API', 'info')

        } catch (error) {
            console.error(error)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AppLayout>
            <Head><title>Receiving - 168VSC</title></Head>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                    <Package className="text-primary-600" />
                    Inbound & Receiving
                </h1>
                <p className="text-secondary-500">Blind count and mapping station</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-secondary-200 mb-6">
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2
                        ${activeTab === 'generate' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500'}`}
                >
                    <Printer size={18} /> Generate Tags
                </button>
                <button
                    onClick={() => setActiveTab('scan')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2
                        ${activeTab === 'scan' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500'}`}
                >
                    <Scan size={18} /> Blind Scan
                </button>
                <button
                    onClick={() => setActiveTab('map')}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2
                        ${activeTab === 'map' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500'}`}
                >
                    <ArrowRight size={18} /> Map to Product
                </button>
            </div>

            {/* Generate Tab */}
            {activeTab === 'generate' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 max-w-2xl">
                    <h2 className="text-lg font-semibold mb-4">Print Temp QR Codes</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Select PO (Optional)</label>
                        <select
                            className="w-full input-field"
                            value={selectedPo?.id || ''}
                            onChange={e => setSelectedPo(poList.find(p => p.id === e.target.value) || null)}
                        >
                            <option value="">No PO (Generic)</option>
                            {poList.map(po => <option key={po.id} value={po.id}>PO #{po.id.slice(0, 8)} - {po.supplier_name}</option>)}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Quantity to Print</label>
                        <input
                            type="number"
                            className="w-full input-field"
                            value={genQty}
                            onChange={e => setGenQty(Number(e.target.value))}
                            min="1" max="100"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="btn btn-primary w-full flex justify-center items-center gap-2"
                    >
                        <Printer size={20} /> Generate & Preview
                    </button>

                    {generatedQRs.length > 0 && (
                        <div className="mt-6 border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">{generatedQRs.length} Tags Generated</h3>
                                <button onClick={handlePrint} className="text-primary-600 font-medium hover:underline">
                                    Print All
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded">
                                {generatedQRs.map(item => (
                                    <div key={item.id} className="bg-white p-2 text-center text-xs border rounded">
                                        <div className="font-mono mb-1">{item.temp_qr_code}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Scan Tab */}
            {activeTab === 'scan' && (
                <div className="max-w-2xl">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 mb-6">
                        <h2 className="text-lg font-semibold mb-4 text-center">Blind Counting (Scan Box)</h2>
                        <form onSubmit={handleScan} className="flex gap-2">
                            <input
                                ref={scanInputRef}
                                type="text"
                                className="w-full input-field text-lg"
                                placeholder="Scan Temp QR here..."
                                value={scanInput}
                                onChange={e => setScanInput(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="btn btn-primary">Scan</button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                        <div className="p-4 bg-secondary-50 border-b border-secondary-200 font-medium">
                            Recent Scans ({scanLog.length})
                        </div>
                        <div className="divide-y divide-secondary-100 max-h-80 overflow-y-auto">
                            {scanLog.map((log, idx) => (
                                <div key={idx} className="p-3 flex justify-between items-center">
                                    <span className="font-mono text-primary-700">{log.temp_qr_code}</span>
                                    <span className="text-xs text-secondary-500">
                                        {log.scanned_at.toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                            {scanLog.length === 0 && (
                                <div className="p-8 text-center text-secondary-500">No items scanned yet</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
                <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <h2 className="text-lg font-semibold mb-4 text-center">Map Temp Tag to Product</h2>

                    {/* Step 1: Scan Temp QR */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-secondary-700 mb-2">1. Scan Temp QR</label>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            if (!mapQrInput) return
                            const item = await DataManager.getTempItemByQR(mapQrInput)
                            if (item) {
                                if (item.status === 'mapped') {
                                    Swal.fire('Already Mapped', 'This tag is already used.', 'warning')
                                    setActiveTempItem(null)
                                } else {
                                    setActiveTempItem(item)
                                    // Auto focus product search?
                                }
                            } else {
                                Swal.fire('Not Found', 'Temp QR not found in system.', 'error')
                                setActiveTempItem(null)
                            }
                        }} className="flex gap-2">
                            <input
                                type="text"
                                className="w-full input-field"
                                placeholder="Scan TEMP-XXX..."
                                value={mapQrInput}
                                onChange={e => setMapQrInput(e.target.value)}
                                autoFocus={!activeTempItem}
                                disabled={!!activeTempItem}
                            />
                            {activeTempItem && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTempItem(null)
                                        setMapQrInput('')
                                        setSelectedProduct(null)
                                    }}
                                    className="px-3 bg-secondary-200 rounded text-secondary-600 hover:bg-secondary-300">
                                    Change
                                </button>
                            )}
                            {!activeTempItem && <button type="submit" className="btn btn-primary">Find</button>}
                        </form>
                    </div>

                    {/* Step 2: Select Product (Only if Temp QR found) */}
                    {activeTempItem && (
                        <div className="mb-6 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                                <CheckCircle size={20} />
                                <span className="font-mono font-bold">{activeTempItem.temp_qr_code}</span>
                                <span className="text-sm">found ({activeTempItem.status})</span>
                                {activeTempItem.po_id && <span className="text-xs bg-white px-1 rounded border">PO Linked</span>}
                            </div>

                            <label className="block text-sm font-medium text-secondary-700 mb-2">2. Select Actual Product</label>

                            {!selectedProduct ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-secondary-400" size={18} />
                                        <input
                                            type="text"
                                            className="input-field pl-10"
                                            placeholder="Search Product Name or Code..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border rounded border-secondary-200 divide-y divide-secondary-100">
                                        {filteredProducts.slice(0, 10).map(prod => (
                                            <div
                                                key={prod.id}
                                                onClick={() => setSelectedProduct(prod)}
                                                className="p-3 hover:bg-secondary-50 cursor-pointer flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="font-medium text-secondary-900">{prod.name}</div>
                                                    <div className="text-xs text-secondary-500 font-mono">{prod.product_code}</div>
                                                </div>
                                                <ArrowRight size={16} className="text-secondary-400" />
                                            </div>
                                        ))}
                                        {filteredProducts.length === 0 && <div className="p-4 text-center text-secondary-500">No products found</div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border border-primary-200 bg-primary-50 rounded-lg flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-primary-600 font-semibold mb-1">Selected Product:</div>
                                        <div className="font-bold text-primary-900">{selectedProduct.name}</div>
                                        <div className="font-mono text-xs text-primary-700">{selectedProduct.product_code}</div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="text-xs text-primary-600 underline hover:text-primary-800"
                                    >
                                        Change
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Flag for QC (Optional) */}
                    {activeTempItem && selectedProduct && (
                        <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-warning-600 rounded focus:ring-warning-500"
                                    checked={isQCFlag}
                                    onChange={e => setIsQCFlag(e.target.checked)}
                                />
                                <div className="flex-1">
                                    <div className="font-semibold text-warning-800">Flag for Quality Control</div>
                                    <div className="text-xs text-warning-700">Item will be marked as "Pending QC" and must be inspected before use.</div>
                                </div>
                                <AlertTriangle className="text-warning-500" />
                            </label>
                        </div>
                    )}

                    {/* Step 4: Confirm Map */}
                    {activeTempItem && selectedProduct && (
                        <button
                            onClick={async () => {
                                try {
                                    const result = await DataManager.mapTempItemToProduct(
                                        activeTempItem.temp_qr_code,
                                        selectedProduct.id,
                                        null,
                                        isQCFlag // Pass flag
                                    )

                                    await Swal.fire({
                                        title: 'Mapped Successfully!',
                                        html: `
                                            <div class="text-center">
                                                <p class="mb-2">New Real QR Generated:</p>
                                                <div class="font-mono font-bold text-xl mb-4 text-primary-600">${result.qr_code}</div>
                                                ${isQCFlag ? '<div class="text-red-500 font-bold mb-2">FLAGGED FOR QC</div>' : ''}
                                                <p class="text-sm text-gray-500">Please print the real label now.</p>
                                            </div>
                                        `,
                                        icon: 'success',
                                        confirmButtonText: 'Print Label (Simulated)'
                                    })

                                    // Reset flow
                                    setActiveTempItem(null)
                                    setMapQrInput('')
                                    setSelectedProduct(null)
                                    setSearchTerm('')
                                    setIsQCFlag(false)

                                } catch (error) {
                                    Swal.fire('Error', error.message, 'error')
                                }
                            }}
                            className={`w-full btn flex justify-center items-center gap-2 py-4 text-lg animate-in fade-in transition-colors
                                ${isQCFlag ? 'bg-warning-500 hover:bg-warning-600 text-white' : 'btn-primary'}
                            `}
                        >
                            <CheckCircle size={24} />
                            {isQCFlag ? 'Confirm & Flag for QC' : 'Confirm Mapping'}
                        </button>
                    )}

                </div>
            )}

        </AppLayout>
    )
}
