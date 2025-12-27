import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, Search, Calculator, ExternalLink, User, CreditCard, DollarSign, Truck, FileText, Banknote, List, ShoppingBag } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import ProductModal from './ProductModal'

export default function PurchaseOrderModal({ isOpen, onClose, onSave, initialItem }) {
    // Tabs
    const [activeTab, setActiveTab] = useState('general') // general, financial, reference

    // Header 
    const [supplierName, setSupplierName] = useState('')
    const [expectedDate, setExpectedDate] = useState('') // datetime-local
    const [createdBy, setCreatedBy] = useState('Admin')

    // Financial & Currency
    const [currency, setCurrency] = useState('CNY')
    const [exchangeRate, setExchangeRate] = useState(5.0)
    const [originShippingCost, setOriginShippingCost] = useState(0) // Foreign Currency

    // Payment & Reimbursement
    const [paymentStatus, setPaymentStatus] = useState('unpaid')
    const [paymentDate, setPaymentDate] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('transfer')
    const [payerName, setPayerName] = useState('')
    const [reimbursedDate, setReimbursedDate] = useState('')
    const [isAdvancedPayment, setIsAdvancedPayment] = useState(false)

    // Reference
    const [externalRef, setExternalRef] = useState('')
    const [purchaseLink, setPurchaseLink] = useState('')
    const [remarks, setRemarks] = useState('')

    // Items
    const [products, setProducts] = useState([])
    const [poItems, setPoItems] = useState([])

    // Item Entry
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [itemQty, setItemQty] = useState(1)
    const [itemPriceForeign, setItemPriceForeign] = useState(0)

    // Inline Product Creation
    const [showProductModal, setShowProductModal] = useState(false)

    // State for Edit Mode
    const [poId, setPoId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadProducts()
            resetForm()
            // Set default date to now + 7 days
            const d = new Date()
            d.setDate(d.getDate() + 7)
            setExpectedDate(d.toISOString().slice(0, 16)) // YYYY-MM-DDTHH:mm

            if (initialItem) {
                if (initialItem.id && initialItem.items) {
                    // EDIT MODE
                    setPoId(initialItem.id)
                    setSupplierName(initialItem.supplier_name || '')
                    const exp = initialItem.expected_date ? new Date(initialItem.expected_date).toISOString().slice(0, 16) : ''
                    setExpectedDate(exp)
                    setCreatedBy(initialItem.created_by || 'Admin')

                    setCurrency(initialItem.currency || 'CNY')
                    setExchangeRate(initialItem.exchange_rate || 5.0)
                    setOriginShippingCost(initialItem.shipping_origin || 0)

                    setPaymentStatus(initialItem.payment_status || 'unpaid')
                    setPaymentDate(initialItem.payment_date ? initialItem.payment_date.slice(0, 10) : '')
                    setPaymentMethod(initialItem.payment_method || 'transfer')
                    setPayerName(initialItem.payer_name || '')
                    setReimbursedDate(initialItem.reimbursed_date ? initialItem.reimbursed_date.slice(0, 10) : '')

                    // Logic to see if it was advanced payment
                    if (initialItem.payer_name) {
                        setIsAdvancedPayment(true)
                    } else {
                        setIsAdvancedPayment(false)
                    }

                    setExternalRef(initialItem.external_ref_no || '')
                    setPurchaseLink(initialItem.purchase_link || '')
                    setRemarks(initialItem.remarks || '')

                    setPoItems(initialItem.items.map(i => ({
                        ...i,
                        total_price: i.total_price || 0
                    })) || [])

                } else if (initialItem.product_code) {
                    // CREATE MODE
                }
            }
        }
    }, [isOpen, initialItem])

    const resetForm = () => {
        setPoId(null)
        setActiveTab('general')
        setSupplierName('')
        setExternalRef('')
        setPurchaseLink('')
        setRemarks('')
        setCurrency('CNY')
        setExchangeRate(5.0)
        setOriginShippingCost(0)
        setPaymentStatus('unpaid')
        setPaymentDate('')
        setPayerName('')
        setReimbursedDate('')
        setIsAdvancedPayment(false)
        setPoItems([])
        setSelectedProduct(null)
        setSelectedVariant(null)
        setSearchTerm('')
        setItemQty(1)
        setItemPriceForeign(0)
    }

    const loadProducts = async () => {
        const data = await DataManager.getProducts()
        setProducts(data || [])
    }

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleProductSelect = (product) => {
        setSelectedProduct(product)
        setSelectedVariant(null)
        setSearchTerm('')
    }

    const addItem = () => {
        if (!selectedProduct) return
        const unitPriceTHB = itemPriceForeign * exchangeRate
        const totalTHB = itemQty * unitPriceTHB
        const foreignTotal = itemQty * itemPriceForeign

        const newItem = {
            product_id: selectedProduct.id || selectedProduct.uuid,
            variant_id: selectedVariant ? (selectedVariant.id || selectedVariant.uuid) : null,
            product_name: selectedProduct.name,
            product_code: selectedProduct.product_code,
            variant_sku: selectedVariant ? selectedVariant.sku : null,
            variant_details: selectedVariant ? `${selectedVariant.color || ''} ${selectedVariant.size || ''}` : '',
            quantity: itemQty,
            unit_price_foreign: itemPriceForeign,
            unit_price: unitPriceTHB,
            total_price: totalTHB
        }
        setPoItems([...poItems, newItem])
        setSelectedProduct(null)
        setSelectedVariant(null)
        setItemQty(1)
        setItemPriceForeign(0)
    }

    const removeItem = (index) => {
        const newItems = [...poItems]
        newItems.splice(index, 1)
        setPoItems(newItems)
    }

    const calculateTotals = () => {
        const itemsTotalTHB = poItems.reduce((sum, item) => sum + item.total_price, 0)
        const shippingTHB = originShippingCost * exchangeRate
        const grandTotalTHB = itemsTotalTHB + shippingTHB
        return { itemsTotalTHB, shippingTHB, grandTotalTHB }
    }

    const handleCreateProduct = async (productData) => {
        const result = await DataManager.saveProduct(productData)
        if (result && result.success) {
            await loadProducts()
            setShowProductModal(false)
            alert('Product created successfully!')
        } else {
            alert('Failed to create product')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!supplierName || poItems.length === 0) return

        setIsSubmitting(true)
        const { itemsTotalTHB, grandTotalTHB } = calculateTotals()

        const poData = {
            supplier_name: supplierName,
            expected_date: expectedDate || null,
            status: poId ? undefined : 'ordered',
            product_cost_total: itemsTotalTHB,
            total_landed_cost: grandTotalTHB,
            currency,
            exchange_rate: parseFloat(exchangeRate),
            shipping_origin: originShippingCost,
            payment_status: paymentStatus,
            payment_date: paymentDate || null,
            payment_method: paymentMethod,
            external_ref_no: externalRef,
            purchase_link: purchaseLink,
            remarks: remarks,
            created_by: createdBy,
            payer_name: payerName,
            is_reimbursed: !!reimbursedDate,
            reimbursed_date: reimbursedDate || null
        }

        try {
            let result;
            if (poId) {
                result = await DataManager.updatePurchaseOrder(poId, poData, poItems)
            } else {
                result = await DataManager.createPurchaseOrderWithItems(poData, poItems)
            }

            if (result) {
                onSave()
                onClose()
            } else {
                throw new Error("Save failed")
            }
        } catch (error) {
            console.error(error)
            alert('Error creating/updating PO. Please check if database migration has been run.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null
    const { itemsTotalTHB, shippingTHB, grandTotalTHB } = calculateTotals()

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between sticky top-0 bg-white z-20">
                    <div>
                        <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                            <Plus className="text-primary-600" />
                            {poId ? 'Edit Purchase Order' : 'Create Purchase Order'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Tabs */}
                    <div className="px-6 pt-4 flex gap-6 border-b border-secondary-200 bg-secondary-50 sticky top-0 z-10">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                        >
                            <FileText size={16} /> General Info
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'financial' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                        >
                            <Banknote size={16} /> Financial & Payment
                        </button>
                        <button
                            onClick={() => setActiveTab('reference')}
                            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'reference' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                        >
                            <List size={16} /> Reference & Notes
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Tab Content: General */}
                        <div className={activeTab === 'general' ? 'block' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label className="label">Supplier Name *</label>
                                    <input type="text" className="input-field" placeholder="e.g. 1688 Shop A" required autoFocus
                                        value={supplierName} onChange={e => setSupplierName(e.target.value)} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="label">Expected Date</label>
                                    <input type="datetime-local" className="input-field"
                                        value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="label">Created By</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                        <input type="text" className="input-field pl-10"
                                            value={createdBy} onChange={e => setCreatedBy(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Items Editor (Always visible in General Tab) */}
                            <div className="mt-8 border-t border-secondary-200 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-secondary-800 flex items-center gap-2">
                                        <ShoppingBag size={18} /> Order Items
                                    </h3>
                                    <button onClick={() => setShowProductModal(true)} className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg border border-primary-200 hover:bg-primary-100 font-medium flex gap-1 items-center">
                                        <Plus size={14} /> New Product
                                    </button>
                                </div>

                                {/* Add Item Bar */}
                                <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200 flex flex-col md:flex-row gap-4 mb-4">
                                    <div className="flex-1 w-full md:w-auto relative">
                                        <label className="label">Product</label>
                                        {!selectedProduct ? (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                                <input type="text" className="input-field pl-9" placeholder="Search sku/name..."
                                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                                {searchTerm && (
                                                    <div className="absolute top-full left-0 right-0 bg-white border border-secondary-200 mt-1 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                                                        {filteredProducts.map(p => (
                                                            <button key={p.id} onClick={() => handleProductSelect(p)} className="w-full text-left px-3 py-2 hover:bg-secondary-50 text-sm border-b border-secondary-100 flex justify-between">
                                                                <span>{p.name}</span>
                                                                <span className="text-xs text-secondary-400 font-mono">{p.product_code}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between px-3 py-2 bg-white border border-primary-300 rounded-lg text-sm shadow-sm ring-1 ring-primary-100">
                                                <span className="font-medium truncate">{selectedProduct.name}</span>
                                                <button onClick={() => setSelectedProduct(null)} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">Change</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Variant */}
                                    <div className="w-full md:w-48">
                                        <label className="label">Variant</label>
                                        <select className="input-field bg-white"
                                            disabled={!selectedProduct?.variants?.length}
                                            onChange={e => {
                                                const v = selectedProduct.variants.find(v => (v.id || v.uuid) === e.target.value)
                                                setSelectedVariant(v)
                                            }}
                                            value={selectedVariant ? (selectedVariant.id || selectedVariant.uuid) : ''}>
                                            <option value="">{selectedProduct?.variants?.length ? 'Select Variant' : '-'}</option>
                                            {selectedProduct?.variants?.map(v => (
                                                <option key={v.id || v.uuid} value={v.id || v.uuid}>{v.sku} - {v.color} {v.size}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="w-full md:w-32">
                                        <label className="label">Price ({currency})</label>
                                        <input type="number" className="input-field text-right" min="0" step="0.01"
                                            value={itemPriceForeign} onChange={e => setItemPriceForeign(parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="w-full md:w-20">
                                        <label className="label">Qty</label>
                                        <input type="number" className="input-field text-center" min="1"
                                            value={itemQty} onChange={e => setItemQty(parseInt(e.target.value) || 1)} />
                                    </div>
                                    <div className="w-full md:w-auto flex flex-col justify-end">
                                        <button onClick={addItem} disabled={!selectedProduct} className="w-full md:w-auto h-[42px] px-6 bg-secondary-800 text-white rounded-lg hover:bg-secondary-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                                            Add Item
                                        </button>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="border border-secondary-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary-50 text-secondary-600 font-medium border-b border-secondary-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Product Details</th>
                                                <th className="px-4 py-3 text-right">Price ({currency})</th>
                                                <th className="px-4 py-3 text-right">Total (THB)</th>
                                                <th className="px-4 py-3 text-center">Qty</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary-100">
                                            {poItems.length === 0 ? (
                                                <tr><td colSpan="5" className="text-center py-8 text-secondary-400">No items added yet.</td></tr>
                                            ) : (
                                                poItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-secondary-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-secondary-900">{item.product_name}</div>
                                                            <div className="text-xs text-secondary-500 font-mono mt-0.5">
                                                                {item.variant_sku || item.product_code}
                                                                {item.variant_details && <span className="ml-2 bg-secondary-100 px-1.5 py-0.5 rounded text-secondary-600">{item.variant_details}</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono">{item.unit_price_foreign?.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right font-medium">฿{item.total_price?.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-center bg-secondary-50/50 font-medium">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button onClick={() => removeItem(idx)} className="text-secondary-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        {poItems.length > 0 && (
                                            <tfoot className="bg-secondary-50 font-bold text-secondary-800 border-t border-secondary-200">
                                                <tr>
                                                    <td colSpan="2" className="px-4 py-3 text-right">Subtotal:</td>
                                                    <td className="px-4 py-3 text-right">฿{itemsTotalTHB.toLocaleString()}</td>
                                                    <td colSpan="2"></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content: Financial */}
                        <div className={activeTab === 'financial' ? 'block' : 'hidden'}>
                            <h3 className="font-semibold text-secondary-800 mb-4 flex items-center gap-2 pb-2 border-b border-secondary-100">
                                <DollarSign size={18} /> Cost Breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className="label">Currency</label>
                                    <select className="input-field" value={currency} onChange={e => setCurrency(e.target.value)}>
                                        <option value="CNY">CNY (Chinese Yuan)</option>
                                        <option value="THB">THB (Thai Baht)</option>
                                        <option value="USD">USD (US Dollar)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Exchange Rate (to THB)</label>
                                    <div className="relative">
                                        <Calculator className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                        <input type="number" step="0.01" className="input-field pl-10"
                                            value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Origin Shipping Cost ({currency})</label>
                                    <div className="relative">
                                        <Truck className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                        <input type="number" step="0.01" className="input-field pl-10"
                                            value={originShippingCost} onChange={e => setOriginShippingCost(parseFloat(e.target.value))} />
                                    </div>
                                    <p className="text-xs text-secondary-500 mt-1 ml-1">≈ ฿{shippingTHB.toLocaleString()}</p>
                                </div>
                            </div>

                            <h3 className="font-semibold text-secondary-800 mb-4 flex items-center gap-2 pb-2 border-b border-secondary-100">
                                <CreditCard size={18} /> Payment Status
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Payment Status</label>
                                    <select className={`input-field font-semibold ${paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}
                                        value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                                        <option value="unpaid">Unpaid (รอจ่าย)</option>
                                        <option value="partial">Partial (มัดจำ)</option>
                                        <option value="paid">Paid (จ่ายครบ)</option>
                                    </select>
                                </div>
                                {paymentStatus !== 'unpaid' && (
                                    <>
                                        <div>
                                            <label className="label">Payment Date</label>
                                            <input type="date" className="input-field" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="label">Payment Method</label>
                                            <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                                <option value="transfer">Bank Transfer</option>
                                                <option value="alipay">Alipay</option>
                                                <option value="credit_card">Credit Card</option>
                                                <option value="cash">Cash</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2 space-y-3">
                                            <label className="flex items-center gap-3 p-3 border border-secondary-200 rounded-lg bg-white cursor-pointer hover:bg-secondary-50 transition-colors">
                                                <input type="checkbox" className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                                    checked={isAdvancedPayment}
                                                    onChange={e => {
                                                        setIsAdvancedPayment(e.target.checked)
                                                        if (!e.target.checked) {
                                                            setPayerName('')
                                                            setReimbursedDate('')
                                                        }
                                                    }} />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-secondary-800 text-sm">Advanced Payment (สำรองจ่าย)</span>
                                                    <span className="text-xs text-secondary-500">Check this if someone paid on behalf of the company (e.g. Employee).</span>
                                                </div>
                                            </label>

                                            {isAdvancedPayment && (
                                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <label className="label text-amber-800 mb-2">Reimbursement Info</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <input type="text" className="input-field bg-white" placeholder="Paid by (Payer Name)..."
                                                                value={payerName} onChange={e => setPayerName(e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <input type="date" className="input-field bg-white"
                                                                value={reimbursedDate} onChange={e => setReimbursedDate(e.target.value)}
                                                                placeholder="Reimbursed Date" />
                                                            <span className="text-xs text-secondary-500 mt-1 block">Reimbursed Date (วันที่คืนเงิน) - Leave empty if not reimbursed.</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tab Content: Reference */}
                        <div className={activeTab === 'reference' ? 'block' : 'hidden'}>
                            <div className="space-y-6 max-w-2xl">
                                <div>
                                    <label className="label">External Reference No. (Order ID)</label>
                                    <input type="text" className="input-field" placeholder="e.g. 1688-2024-001"
                                        value={externalRef} onChange={e => setExternalRef(e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">Purchase Link (URL)</label>
                                    <div className="flex gap-2">
                                        <input type="url" className="input-field" placeholder="https://detail.1688.com/..."
                                            value={purchaseLink} onChange={e => setPurchaseLink(e.target.value)} />
                                        {purchaseLink && (
                                            <a href={purchaseLink} target="_blank" rel="noreferrer" className="p-2 bg-secondary-100 rounded-lg text-secondary-600 hover:bg-secondary-200 border border-secondary-300">
                                                <ExternalLink size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Remarks / Notes</label>
                                    <textarea className="input-field h-32 resize-none" placeholder="Additional notes about this order..."
                                        value={remarks} onChange={e => setRemarks(e.target.value)} ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Totals & Actions */}
                <div className="p-4 border-t border-secondary-200 bg-slate-50 sticky bottom-0 z-20">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-secondary-500 hidden md:block">
                            <span className="font-semibold text-secondary-700">Summary:</span> {poItems.length} items | Exchange: {exchangeRate}
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs text-secondary-500">Grand Total (Est.)</div>
                                <div className="text-xl font-bold text-primary-700">฿{grandTotalTHB.toLocaleString()}</div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="btn-secondary">Cancel</button>
                                <button onClick={handleSubmit} disabled={isSubmitting || poItems.length === 0 || !supplierName} className="btn-primary flex items-center gap-2">
                                    <Save size={18} />
                                    {isSubmitting ? 'Saving...' : 'Save Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ProductModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSave={handleCreateProduct}
                existingProducts={products}
            />

            <style jsx>{`
                .label { @apply block text-xs font-semibold text-secondary-700 mb-1.5; }
                .input-field { @apply w-full px-3 py-2.5 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow; }
                .btn-primary { @apply px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm; }
                .btn-secondary { @apply px-6 py-2.5 border border-secondary-300 rounded-lg text-secondary-700 font-medium hover:bg-secondary-50 transition-colors bg-white; }
            `}</style>
        </div>
    )
}
