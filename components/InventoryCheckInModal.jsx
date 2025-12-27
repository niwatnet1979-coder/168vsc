import { useState, useEffect } from 'react'
import { X, Save, Search, Box, QrCode, Scan } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { showSuccess, showError, showLoading } from '../lib/sweetAlert'
import { useLanguage } from '../contexts/LanguageContext'
import QRScanner from './QRScanner'

export default function InventoryCheckInModal({ isOpen, onClose, onSave }) {
    const { t } = useLanguage()
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [boxCount, setBoxCount] = useState(1)
    const [location, setLocation] = useState('Warehouse_Main')
    const [lotNumber, setLotNumber] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showScanner, setShowScanner] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadProducts()
            setQuantity(1)
            setBoxCount(1)
            setLocation('Warehouse_Main')
            setLotNumber('')
            setSelectedProduct(null)
            setSelectedVariant(null)
            setSearchTerm('')
            setShowScanner(false)
        }
    }, [isOpen])

    const loadProducts = async () => {
        const data = await DataManager.getProducts()
        setProducts(data)
    }

    const handleScan = async (decodedText) => {
        // Find product by code or unique ID substring
        // Also check variants SKU
        let foundProduct = null
        let foundVariant = null

        // 1. Try finding by variant SKU first
        for (const p of products) {
            if (p.variants && p.variants.length > 0) {
                const v = p.variants.find(v => v.sku === decodedText || v.sku?.includes(decodedText))
                if (v) {
                    foundProduct = p
                    foundVariant = v
                    break
                }
            }
        }

        // 2. If not found, find by product code
        if (!foundProduct) {
            foundProduct = products.find(p => {
                const code = (p.code || p.id || '').toLowerCase()
                const scan = decodedText.toLowerCase()
                return code === scan || scan.includes(code)
            })
        }

        if (foundProduct) {
            setSelectedProduct(foundProduct)
            setSelectedVariant(foundVariant) // Might be null if matched by product code
            setBoxCount(foundProduct.pack_size || 1) // Map legacy pack_size to box_count
            setShowScanner(false)
        } else {
            await showError({
                title: t('Product not found'),
                text: `${t('Product not found for QR')}: ${decodedText}`
            })
        }
    }

    // ... (filteredProducts remains same) -> This was a placeholder in my previous edit, need to restore actual code
    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedProduct) return

        setIsSubmitting(true)
        showLoading(t('Processing...'))

        try {
            // Generate items loop
            const items = []
            for (let i = 0; i < quantity; i++) {
                // Generate QR: ProdCode-Timestamp-Random
                // If variant selected, maybe include Variant SKU in QR? 
                // Currently keeping format consistent: ProdCode-Timestamp-Random
                // Or use Variant SKU if available? Let's stick to Prod ID based for now for consistency, 
                // or appending Variant info could be useful but might break length.

                const timestamp = Date.now().toString(36)
                const random = Math.random().toString(36).substring(2, 5)
                const baseCode = selectedVariant ? selectedVariant.sku : (selectedProduct.code || 'ITEM')
                const qrCode = `${baseCode}-${timestamp}-${random}`.toUpperCase()

                const newItem = {
                    product_id: selectedProduct.id || selectedProduct.uuid, // Ensure we use UUID if available
                    variant_id: selectedVariant ? selectedVariant.id : null,
                    qr_code: qrCode,
                    lot_number: lotNumber,
                    status: 'in_stock',
                    current_location: location,
                    box_count: boxCount
                }

                await DataManager.addInventoryItemWithBoxes(newItem)
            }

            await showSuccess({
                title: t('Success'),
                text: t('Items checked in successfully')
            })
            onSave()
        } catch (error) {
            console.error(error)
            await showError({
                title: t('Error'),
                text: error.message || t('Error checking in items')
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Helper to get Variant Label
    const getVariantLabel = (v) => {
        const parts = []
        if (v.color) parts.push(v.color)
        if (v.size) parts.push(v.size)
        if (v.crystal_color) parts.push(v.crystal_color)
        return parts.join(' / ') || 'Default'
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
                                {/* ... Search Input ... */}
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
                                                setBoxCount(product.pack_size || 1)
                                                setSelectedVariant(null) // Reset variant
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
                                <button type="button" onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }} className="text-xs text-primary-600 hover:underline">Change</button>
                            </div>
                        )}
                    </div>

                    {/* Variant Selection (Conditional) */}
                    {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Select Option (Color/Size)</label>
                            <select
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                value={selectedVariant ? selectedVariant.id : ''}
                                onChange={(e) => {
                                    const v = selectedProduct.variants.find(v => v.id === parseInt(e.target.value) || v.id === e.target.value)
                                    setSelectedVariant(v)
                                }}
                                required
                            >
                                <option value="">-- Select Option --</option>
                                {selectedProduct.variants.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {getVariantLabel(v)} (SKU: {v.sku})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}


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

                    {/* Box Count & Location Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">
                                จำนวนกล่องต่อชุด (Total Boxes)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={boxCount}
                                onChange={e => setBoxCount(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <p className="text-xs text-secondary-500">1 unit = {boxCount} boxes</p>
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

                    {/* Summary */}
                    {selectedProduct && (
                        <div className="bg-secondary-50 p-4 rounded-lg text-sm text-secondary-600 flex items-start gap-3">
                            <QrCode className="text-secondary-400 mt-0.5" size={18} />
                            <div>
                                <p>System will generate <span className="font-bold text-secondary-900">{quantity} unique QR Codes</span>.</p>
                                <p className="text-xs mt-1 font-mono">Example: {(selectedVariant ? selectedVariant.sku : selectedProduct.code) || 'CODE'}-XXXX...</p>
                                {selectedVariant && (
                                    <p className="text-primary-600 font-medium mt-1">
                                        Variant: {getVariantLabel(selectedVariant)}
                                    </p>
                                )}
                                {boxCount > 1 && (
                                    <div className="mt-2 pt-2 border-t border-secondary-200">
                                        <p className="text-primary-700 font-medium flex items-center gap-1">
                                            <Box size={14} />
                                            Multi-box Item: {boxCount} boxes per set
                                        </p>
                                        <p className="text-xs mt-1">
                                            *Label Printer will print {boxCount} labels per ID (Box 1/{boxCount} ... {boxCount}/{boxCount})
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
                            disabled={!selectedProduct || isSubmitting || (selectedProduct.variants?.length > 0 && !selectedVariant)}
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
