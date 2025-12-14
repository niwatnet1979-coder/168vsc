import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Search, Calculator } from 'lucide-react'
import { DataManager } from '../lib/dataManager'

export default function PurchaseOrderModal({ isOpen, onClose, onSave }) {
    const [supplierName, setSupplierName] = useState('')
    const [expectedDate, setExpectedDate] = useState('')
    const [products, setProducts] = useState([])
    const [poItems, setPoItems] = useState([]) // { product_id, product_name, quantity, unit_price, total_price }

    // Item entry state
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [itemQty, setItemQty] = useState(1)
    const [itemPrice, setItemPrice] = useState(0)

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadProducts()
            resetForm()
        }
    }, [isOpen])

    const resetForm = () => {
        setSupplierName('')
        setExpectedDate('')
        setPoItems([])
        setSelectedProduct(null)
        setSearchTerm('')
        setItemQty(1)
        setItemPrice(0)
    }

    const loadProducts = async () => {
        const data = await DataManager.getProducts()
        setProducts(data)
    }

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const addItem = () => {
        if (!selectedProduct) return

        const total = itemQty * itemPrice
        const newItem = {
            product_id: selectedProduct.id, // Using the ID (uuid) from product object
            product_name: selectedProduct.name,
            product_code: selectedProduct.code || selectedProduct.product_code, // Handle both key names if inconsistent
            quantity: itemQty,
            unit_price: itemPrice,
            total_price: total
        }

        setPoItems([...poItems, newItem])

        // Reset item entry
        setSelectedProduct(null)
        setSearchTerm('')
        setItemQty(1)
        setItemPrice(0)
    }

    const removeItem = (index) => {
        const newItems = [...poItems]
        newItems.splice(index, 1)
        setPoItems(newItems)
    }

    const calculateTotal = () => {
        return poItems.reduce((sum, item) => sum + item.total_price, 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!supplierName || poItems.length === 0) return

        setIsSubmitting(true)
        try {
            const poData = {
                supplier_name: supplierName,
                expected_date: expectedDate || null,
                status: 'ordered', // Start as ordered for simplicity
                product_cost_total: calculateTotal(),
                total_landed_cost: calculateTotal(), // Initially just product cost
            }

            await DataManager.createPurchaseOrderWithItems(poData, poItems)
            onSave()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error creating PO')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        <Plus className="text-primary-600" />
                        Create Purchase Order
                    </h2>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 p-6 space-y-6">
                    {/* PO Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Supplier Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Enter supplier..."
                                value={supplierName}
                                onChange={e => setSupplierName(e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Expected Date</label>
                            <input
                                type="date"
                                value={expectedDate}
                                onChange={e => setExpectedDate(e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Add Items Section */}
                    <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200 space-y-4">
                        <h3 className="font-semibold text-secondary-800 flex items-center gap-2">
                            <Search size={18} />
                            Add Products
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Product Search */}
                            <div className="md:col-span-6 relative">
                                <label className="block text-xs font-medium text-secondary-600 mb-1">Product</label>
                                {!selectedProduct ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search product..."
                                            className="w-full pl-8 pr-4 py-2 border border-secondary-300 rounded-lg text-sm"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                        <Search className="absolute left-2.5 top-2.5 text-secondary-400" size={16} />

                                        {searchTerm && (
                                            <div className="absolute top-full left-0 right-0 bg-white border border-secondary-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                                                {filteredProducts.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setSelectedProduct(p)
                                                            setSearchTerm('')
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-secondary-50 text-sm border-b border-secondary-100 last:border-0"
                                                    >
                                                        <div className="font-medium">{p.name}</div>
                                                        <div className="text-xs text-secondary-500">{p.code || p.id}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between px-3 py-2 bg-white border border-primary-300 rounded-lg text-sm">
                                        <span className="font-medium text-primary-900">{selectedProduct.name}</span>
                                        <button onClick={() => setSelectedProduct(null)} className="text-xs text-primary-600 hover:underline">Change</button>
                                    </div>
                                )}
                            </div>

                            {/* Qty */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-secondary-600 mb-1">Qty</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={itemQty}
                                    onChange={e => setItemQty(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                                />
                            </div>

                            {/* Price */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-secondary-600 mb-1">Unit Cost (฿)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={itemPrice}
                                    onChange={e => setItemPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                                />
                            </div>

                            {/* Add Button */}
                            <div className="md:col-span-2">
                                <button
                                    onClick={addItem}
                                    disabled={!selectedProduct}
                                    className="w-full py-2 bg-secondary-800 text-white rounded-lg hover:bg-secondary-900 text-sm font-medium disabled:opacity-50"
                                >
                                    Add Line
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-secondary-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary-50 text-secondary-600 font-medium border-b border-secondary-200">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 text-right">Qty</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {poItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-secondary-400">
                                            No items added yet.
                                        </td>
                                    </tr>
                                ) : (
                                    poItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-secondary-900">{item.product_name}</div>
                                                <div className="text-xs text-secondary-500 font-mono">{item.product_code}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">฿{item.unit_price.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium">฿{item.total_price.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeItem(index)} className="text-danger-500 hover:text-danger-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-secondary-50 font-bold text-secondary-900 border-t border-secondary-200">
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-right">Total Amount:</td>
                                    <td className="px-4 py-3 text-right">฿{calculateTotal().toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-secondary-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-secondary-300 rounded-lg text-secondary-700 font-medium hover:bg-secondary-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || poItems.length === 0 || !supplierName}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Creating...' : (
                            <>
                                <Save size={18} />
                                Create Order
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
