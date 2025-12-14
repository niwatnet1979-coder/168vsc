import { useState, useEffect } from 'react'
import { X, Save, Search, Box, QrCode, Scan } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import QRScanner from './QRScanner'

export default function InventoryCheckInModal({ isOpen, onClose, onSave }) {
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [packSize, setPackSize] = useState(1)
    const [location, setLocation] = useState('Warehouse_Main')
    const [lotNumber, setLotNumber] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showScanner, setShowScanner] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadProducts()
            setQuantity(1)
            setPackSize(1)
            setLocation('Warehouse_Main')
            setLotNumber('')
            setSelectedProduct(null)
            setSearchTerm('')
            setShowScanner(false)
        }
    }, [isOpen])

    const loadProducts = async () => {
        const data = await DataManager.getProducts()
        setProducts(data)
    }

    const handleScan = (decodedText) => {
        // Find product by code or unique ID substring
        const found = products.find(p => {
            const code = (p.code || p.id || '').toLowerCase()
            const scan = decodedText.toLowerCase()
            return code === scan || scan.includes(code)
        })

        if (found) {
            setSelectedProduct(found)
            setPackSize(found.pack_size || 1) // Set default from product
            setShowScanner(false)
        } else {
            alert(`Product not found for QR: ${decodedText}`)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedProduct) return

        setIsSubmitting(true)
        try {
            // Generate items loop
            const items = []
            for (let i = 0; i < quantity; i++) {
                // Generate QR: ProdCode-Timestamp-Random
                const timestamp = Date.now().toString(36)
                const random = Math.random().toString(36).substring(2, 5)
                const qrCode = `${selectedProduct.code || 'ITEM'}-${timestamp}-${random}`.toUpperCase()

                const newItem = {
                    product_id: selectedProduct.id,
                    qr_code: qrCode,
                    lot_number: lotNumber,
                    status: 'in_stock',
                    current_location: location,
                    pack_size: packSize
                }

                // Add one by one (or batch if API supported, but start simple)
                await DataManager.addInventoryItem(newItem)
            }
            onSave()
        } catch (error) {
            console.error(error)
            alert('Error checking in items')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        <Box className="text-primary-600" />
                        Check-in New Items
                    </h2>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Product Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Select Product</label>
                        {!selectedProduct ? (
                            <div className="border border-secondary-300 rounded-lg overflow-hidden">
                                <div className="flex items-center px-3 py-2 border-b border-secondary-200 bg-secondary-50 gap-2">
                                    <Search size={18} className="text-secondary-400" />
                                    <input
                                        type="text"
                                        placeholder="Search product..."
                                        className="bg-transparent border-none focus:outline-none w-full text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="p-1.5 bg-primary-100 text-primary-600 rounded-md hover:bg-primary-200 transition-colors"
                                        title="Scan Camera"
                                    >
                                        <Scan size={18} />
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {filteredProducts.map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedProduct(product)
                                                setPackSize(product.pack_size || 1)
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-0 flex justify-between items-center"
                                        >
                                            <span className="font-medium text-secondary-900">{product.name}</span>
                                            <span className="text-xs text-secondary-500 font-mono bg-secondary-100 px-2 py-1 rounded">{product.code || product.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border border-primary-200 bg-primary-50 rounded-lg text-primary-900">
                                <span className="font-medium">{selectedProduct.name}</span>
                                <button type="button" onClick={() => setSelectedProduct(null)} className="text-xs text-primary-600 hover:underline">Change</button>
                            </div>
                        )}
                    </div>

                    {/* Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Quantity (Units)</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={quantity}
                                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Lot Number</label>
                            <input
                                type="text"
                                placeholder="Optional"
                                value={lotNumber}
                                onChange={e => setLotNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Pack Size & Location Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Boxes per Unit</label>
                            <input
                                type="number"
                                min="1"
                                value={packSize}
                                onChange={e => setPackSize(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="text-xs text-secondary-500">Default: 1 box per unit</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Receive Location</label>
                            <select
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="Warehouse_Main">Main Warehouse</option>
                                <option value="Technician_Van">Technician Van</option>
                                <option value="Showroom">Showroom</option>
                            </select>
                        </div>
                    </div>
                    {/* Removed standalone Location div to merge with row */}

                    {/* Summary */}
                    {selectedProduct && (
                        <div className="bg-secondary-50 p-4 rounded-lg text-sm text-secondary-600 flex items-start gap-3">
                            <QrCode className="text-secondary-400 mt-0.5" size={18} />
                            <div>
                                <p>System will generate <span className="font-bold text-secondary-900">{quantity} unique QR Codes</span>.</p>
                                <p className="text-xs mt-1 font-mono">Example: {selectedProduct.code}-XXXX...</p>
                                {packSize > 1 && (
                                    <div className="mt-2 pt-2 border-t border-secondary-200">
                                        <p className="text-primary-700 font-medium flex items-center gap-1">
                                            <Box size={14} />
                                            Multi-box Item: {packSize} boxes per set
                                        </p>
                                        <p className="text-xs mt-1">
                                            *Label Printer will print {packSize} labels per ID (Box 1/{packSize} ... {packSize}/{packSize})
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedProduct || isSubmitting}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : (
                                <>
                                    <Save size={18} />
                                    Confirm Check-in
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    )
}
