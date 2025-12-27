import React, { useState, useEffect, useRef } from 'react'
import { X, Search, Info, Calendar, CreditCard, ShoppingCart, ShoppingBag, FileText, Banknote, List, Package, Trash2, Plus, Calculator, Truck, User, ExternalLink, DollarSign, ChevronDown, Save, UserCircle } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { useSession } from 'next-auth/react'
import ProductModal from './ProductModal'
import { currency as formatCurrency } from '../lib/utils'
import Swal from '../lib/sweetAlert' // Import default export as Swal for convenience wrapper
import { showConfirm, showSuccess, showError } from '../lib/sweetAlert' // Import specific helpers

export default function PurchaseOrderModal({ isOpen, onClose, onSave, initialItem }) {
    // Tabs
    const [activeTab, setActiveTab] = useState('general') // general, financial, reference

    // Header 
    const [supplierName, setSupplierName] = useState('')
    const [expectedDate, setExpectedDate] = useState('') // datetime-local
    const [createdBy, setCreatedBy] = useState('')
    const [expenseCategory, setExpenseCategory] = useState("สินค้า") // Default category

    // Options for Dropdowns
    const [expenseOptions, setExpenseOptions] = useState([])
    const [employeeOptions, setEmployeeOptions] = useState([]) // For Payer Dropdown & Creator Auto-fill

    // Auth Session
    const { data: session } = useSession()

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

    // Custom Item State
    const [isCustomItem, setIsCustomItem] = useState(false)
    const [customItemName, setCustomItemName] = useState('')

    // Items
    const [products, setProducts] = useState([])
    const [poItems, setPoItems] = useState([])

    // Item Entry (New Logic)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [itemQty, setItemQty] = useState(1)
    const [itemPriceForeign, setItemPriceForeign] = useState(0)

    // Search Popup State
    const [showSearchPopup, setShowSearchPopup] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [productVariants, setProductVariants] = useState([])

    // Inline Product Creation
    const [showProductModal, setShowProductModal] = useState(false)

    // State for Edit Mode
    const [poId, setPoId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const searchInputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            loadProducts()
            loadOptions()
            resetForm()
            // Set default date to now + 7 days
            const d = new Date()
            d.setDate(d.getDate() + 7)
            // Fix timezone offset for default value
            const offset = d.getTimezoneOffset() * 60000
            const localISOTime = (new Date(d - offset)).toISOString().slice(0, 16)
            setExpectedDate(localISOTime)

            if (initialItem) {
                if (initialItem.id) {
                    // EDIT MODE
                    setPoId(initialItem.id)
                    setSupplierName(initialItem.supplier_name || '')
                    const exp = initialItem.expected_date ? new Date(initialItem.expected_date).toISOString().slice(0, 16) : ''
                    setExpectedDate(exp)
                    setCreatedBy(initialItem.created_by || '')
                    setExpenseCategory(initialItem.expense_category || "สินค้า")

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

                    setPoItems(initialItem.items?.map(i => {
                        const product = i.product || i.products || {}
                        const foreignPrice = i.unit_price_foreign || (i.unit_price / (initialItem.exchange_rate || 5))
                        // Auto-calculate unit_price if missing but foreign price exists
                        const unitPrice = i.unit_price > 0 ? i.unit_price : (foreignPrice * (initialItem.exchange_rate || 5))

                        return {
                            product_id: i.product_id,
                            variant_id: i.variant_id,
                            product_name: i.product_name || product.name || 'Unknown Item',
                            product_code: i.product_code || product.product_code || '-',
                            variant_sku: i.variant_sku,
                            variant_details: i.variant_details,
                            quantity: i.quantity,
                            unit_price_foreign: foreignPrice,
                            unit_price: unitPrice,
                            total_price: i.quantity * unitPrice, // Always recalculate total
                            image: i.image || product.images?.[0] || null
                        }
                    }) || [])

                } else if (initialItem.product_code) {
                    // CREATE MODE from Product list
                    setSearchTerm(initialItem.name)
                    // We need to wait for products to load to select it, or just use initialItem data
                    // For simplicity, we just pre-fill search
                    if (session?.user?.email) {
                        autoIdentifyCreator(session.user.email)
                    }
                }
            } else {
                // NEW CREATE MODE: Auto-fill Creator from Session
                if (session?.user?.email) {
                    autoIdentifyCreator(session.user.email)
                }
            }
        }
    }, [isOpen, initialItem, session])

    // Auto-switch Custom Item Mode based on Expense Category
    useEffect(() => {
        if (expenseCategory === 'สินค้า') {
            setIsCustomItem(false)
        } else {
            setIsCustomItem(true)
            // Optional: Clear or set default custom name if needed, but keeping it empty is safer
        }
    }, [expenseCategory])

    // Auto-set Exchange Rate for THB
    useEffect(() => {
        if (currency === 'THB') {
            setExchangeRate(1)
        }
    }, [currency])

    // Search Logic
    useEffect(() => {
        if (!products.length) return

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase()
            const results = products.filter(p =>
                (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
                (p.product_code && p.product_code.toLowerCase().includes(lowerTerm)) ||
                (p.id && p.id.toLowerCase().includes(lowerTerm))
            ).slice(0, 50) // Limit results
            setSearchResults(results)
        } else {
            setSearchResults(products.slice(0, 20)) // Default show some
        }
    }, [searchTerm, products])

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
        setProductVariants([])
    }

    const loadProducts = async () => {
        const data = await DataManager.getProducts()
        setProducts(data || [])
    }

    const loadOptions = async () => {
        // Load settings for Expense Types
        const settings = await DataManager.getSettings()
        if (settings?.productOptions?.expenseTypes) {
            setExpenseOptions(settings.productOptions.expenseTypes)
        } else {
            // Fallback Default
            setExpenseOptions(["สินค้า", "อุปกรณ์ไม่สึกหรอ", "อุปกรณ์สิ้นเปลือง", "ภาษี บัญชี", "อาคาร สาธารณูปโภค", "โฆษณา ส่งเสริมการขาย", "ตกแต่งอาคารรื้อถอนไม่ได้", "อาหาร", "รถ เดินทาง", "เงินเดือน", "สวัสดิการ", "ขนส่ง"])
        }

        // Load active employees for Payer & Creator
        const emps = await DataManager.getActiveEmployees()
        setEmployeeOptions(emps || [])
    }

    const autoIdentifyCreator = async (email) => {
        const emp = await DataManager.getEmployeeByEmail(email)
        if (emp?.nickname) {
            setCreatedBy(emp.nickname)
        } else {
            // Fallback if not found (e.g. admin@gmail.com might not be in employee list)
            setCreatedBy(session?.user?.name || 'Admin')
        }
    }

    const handleProductSelect = (product) => {
        setSelectedProduct(product)
        setSearchTerm(product.name) // Set input to product name
        setShowSearchPopup(false)

        // Variants
        setProductVariants(product.variants || [])

        // Auto-select first variant if exists
        if (product.variants && product.variants.length > 0) {
            const first = product.variants[0]
            setSelectedVariant(first)
            setItemPriceForeign(0) // Default to 0 as requested (do not use selling price)
        } else {
            setSelectedVariant(null)
            setItemPriceForeign(0) // Default to 0
        }

        setItemQty(1)
    }

    const addItem = () => {
        if (!isCustomItem && !selectedProduct) return
        if (isCustomItem && !customItemName.trim()) return

        const unitPriceTHB = itemPriceForeign * exchangeRate
        const totalTHB = itemQty * unitPriceTHB

        // Get image from variant or product
        const img = !isCustomItem ? (selectedVariant?.images?.[0] || selectedProduct.images?.[0] || null) : null

        const newItem = {
            product_id: isCustomItem ? null : (selectedProduct.id || selectedProduct.uuid),
            variant_id: !isCustomItem && selectedVariant ? (selectedVariant.id || selectedVariant.uuid) : null,
            product_name: isCustomItem ? customItemName : selectedProduct.name,
            product_code: !isCustomItem ? selectedProduct.product_code : '-',
            variant_sku: !isCustomItem && selectedVariant ? selectedVariant.sku : null,
            variant_details: !isCustomItem && selectedVariant ? `${selectedVariant.color || ''} ${selectedVariant.size || ''}` : '',
            quantity: itemQty,
            unit_price_foreign: itemPriceForeign,
            unit_price: unitPriceTHB,
            total_price: totalTHB,
            image: img,
            is_custom: isCustomItem,
            item_name: isCustomItem ? customItemName : null
        }
        setPoItems([...poItems, newItem])

        // Reset Item Entry
        if (isCustomItem) {
            setCustomItemName('')
        } else {
            setSelectedProduct(null)
            setSelectedVariant(null)
            setSearchTerm('')
            setProductVariants([])
        }
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
            // Optionally auto-select the new product
            if (result.product) {
                handleProductSelect(result.product)
            }
        } else {
            showError({ title: 'Error', text: 'Failed to create product' })
        }
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
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
            expense_category: expenseCategory,
            payer_name: payerName,
            is_reimbursed: !!reimbursedDate,
            reimbursed_date: reimbursedDate || null
        }

        // Confirm before saving
        const confirmResult = await showConfirm({
            title: 'Confirm Save?',
            text: "Please verify the details before saving.",
            confirmButtonText: 'Yes, Save it!',
            cancelButtonText: 'Cancel',
            icon: 'question'
        })

        if (!confirmResult.isConfirmed) {
            setIsSubmitting(false)
            return
        }

        try {
            let result;
            if (poId) {
                result = await DataManager.updatePurchaseOrder(poId, poData, poItems)
            } else {
                result = await DataManager.createPurchaseOrderWithItems(poData, poItems)
            }

            if (result) {
                await showSuccess({
                    title: 'Saved!',
                    text: 'Purchase Order saved successfully.',
                    showConfirmButton: false,
                    timer: 1500
                })
                onSave()
                onClose()
            } else {
                throw new Error("Save failed")
            }
        } catch (error) {
            console.error(error)
            await showError({
                title: 'Error',
                text: error.message || 'Error creating/updating PO.'
            })
            // If details exist, we might need a custom fire for the footer/html
            if (error.details) {
                showError({ // Fallback to custom error if needed or just use consistent error
                    title: 'Error Details',
                    text: error.details
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteItem = async (index) => {
        const result = await showConfirm({
            title: 'Remove Item?',
            text: 'Are you sure you want to remove this item?',
            confirmButtonText: 'Yes, Remove',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            icon: 'warning'
        })

        if (result.isConfirmed) {
            const newItems = [...poItems]
            newItems.splice(index, 1)
            setPoItems(newItems)
        }
    }

    const handleDelete = async () => {
        const result = await showConfirm({
            title: 'ยืนยันการลบ',
            text: 'คุณต้องการลบใบสั่งซื้อนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true, // Cancel on left, Confirm on right (optional preference, usually defaults to Confirm Right)
            customClass: {
                popup: 'rounded-2xl shadow-xl border border-secondary-100',
                confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-lg shadow-red-500/30',
                cancelButton: 'rounded-lg px-6 py-2.5 font-medium'
            }
        })

        if (!result.isConfirmed) return

        setIsSubmitting(true)
        try {
            const success = await DataManager.deletePurchaseOrder(poId)
            if (success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Purchase order has been deleted.',
                    timer: 1500,
                    showConfirmButton: false
                })
                onSave()
                onClose()
            } else {
                Swal.fire({ icon: 'error', title: 'Failed', text: 'Failed to delete purchase order.' })
            }
        } catch (error) {
            console.error(error)
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error deleting purchase order.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null
    const { itemsTotalTHB, shippingTHB, grandTotalTHB } = calculateTotals()

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 outline-none" tabIndex={-1}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-secondary-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-white z-20 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                            <ShoppingBag className="text-primary-600" />
                            {poId ? 'แก้ไขใบสั่งซื้อ (Edit PO)' : 'สร้างใบสั่งซื้อ (Create PO)'}
                        </h2>
                        <p className="text-xs text-secondary-500 mt-1 ml-8">จัดการข้อมูลการสั่งซื้อสินค้าและต้นทุนนำเข้า</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-full text-secondary-400 hover:text-secondary-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content Layout */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-secondary-50">

                    {/* LEFT SIDE: Inputs (Scrollable) */}
                    <div className="w-full md:w-[400px] lg:w-[450px] overflow-y-auto border-r border-secondary-200 bg-white shadow-sm flex-shrink-0 z-10 custom-scrollbar">
                        {/* Tabs */}
                        <div className="flex border-b border-secondary-200 sticky top-0 bg-white z-10 px-2 pt-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`flex-1 pb-3 pt-2 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'}`}
                            >
                                <FileText size={16} /> ข้อมูลทั่วไป
                            </button>
                            <button
                                onClick={() => setActiveTab('financial')}
                                className={`flex-1 pb-3 pt-2 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'financial' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'}`}
                            >
                                <Banknote size={16} /> การเงิน
                            </button>
                            <button
                                onClick={() => setActiveTab('reference')}
                                className={`flex-1 pb-3 pt-2 text-xs font-semibold flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === 'reference' ? 'border-primary-600 text-primary-700' : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'}`}
                            >
                                <List size={16} /> อ้างอิง
                            </button>
                        </div>

                        <div className="p-5 space-y-6 pb-20">
                            {/* Tab Content: General */}
                            <div className={activeTab === 'general' ? 'space-y-4 animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'}>
                                <div>
                                    <label className="label">ชื่อร้านค้า / Supplier *</label>
                                    <input type="text" className="input-field" placeholder="ระบุชื่อร้านค้า..." required autoFocus
                                        value={supplierName} onChange={e => setSupplierName(e.target.value)} />
                                </div>

                                <div>
                                    <label className="label">ประเภทรายจ่าย (Expense Category)</label>
                                    <select
                                        className="input-field"
                                        value={expenseCategory}
                                        onChange={e => setExpenseCategory(e.target.value)}
                                    >
                                        {expenseOptions.map((opt, idx) => (
                                            <option key={idx} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-secondary-50 p-4 rounded-xl border border-secondary-200">
                                    <h3 className="font-semibold text-secondary-800 mb-3 flex items-center gap-2 text-sm">
                                        <DollarSign size={16} className="text-primary-600" /> ต้นทุนนำเข้า
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="label">สกุลเงิน (Currency)</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['CNY', 'THB', 'USD'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setCurrency(c)}
                                                        className={`py-2 text-xs font-bold rounded-lg border ${currency === c ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-secondary-600 border-secondary-300 hover:bg-secondary-50'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">อัตราแลกเปลี่ยน (Rate)</label>
                                            <div className="relative">
                                                <Calculator className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                                <input type="number" step="0.01" className="input-field pl-10"
                                                    value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">ค่าขนส่งจีน-ไทย ({currency})</label>
                                            <div className="relative">
                                                <Truck className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                                <input type="number" step="0.01" className="input-field pl-10"
                                                    value={originShippingCost} onChange={e => setOriginShippingCost(parseFloat(e.target.value))} />
                                            </div>
                                            <p className="text-xs text-secondary-500 mt-1 ml-1 text-right">≈ ฿{shippingTHB.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">วันที่คาดว่าจะเข้า (Expected Date)</label>
                                    <input type="datetime-local" className="input-field"
                                        value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">ผู้ทำรายการ (Created By)</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-3 top-2.5 text-secondary-400" size={16} />
                                        <input type="text" className="input-field pl-10 bg-secondary-50"
                                            value={createdBy} readOnly title="Auto-filled from Login" />
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content: Financial */}
                            <div className={activeTab === 'financial' ? 'space-y-5 animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'}>


                                <div className="bg-white rounded-xl border border-secondary-200 p-4 shadow-sm">
                                    <h3 className="font-semibold text-secondary-800 mb-3 flex items-center gap-2 text-sm">
                                        <CreditCard size={16} className="text-primary-600" /> สถานะการชำระ
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="label">สถานะ</label>
                                            <select className={`input-field font-semibold ${paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}
                                                value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
                                                <option value="unpaid">Unpaid (รอจ่าย)</option>
                                                <option value="partial">Partial (มัดจำ)</option>
                                                <option value="paid">Paid (จ่ายครบ)</option>
                                            </select>
                                        </div>
                                        {paymentStatus !== 'unpaid' && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200">
                                                <div>
                                                    <label className="label">วันที่จ่าย</label>
                                                    <input type="date" className="input-field" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="label">ช่องทาง</label>
                                                    <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                                        <option value="transfer">โอนเงิน</option>
                                                        <option value="alipay">Alipay</option>
                                                        <option value="credit_card">บัตรเครดิต</option>
                                                        <option value="cash">เงินสด</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-secondary-100">
                                            <label className="flex items-center gap-3 py-2 cursor-pointer">
                                                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                                    checked={isAdvancedPayment}
                                                    onChange={e => setIsAdvancedPayment(e.target.checked)} />
                                                <span className="font-medium text-secondary-700 text-sm">Advanced Pay (สำรองจ่าย)</span>
                                            </label>
                                            {isAdvancedPayment && (
                                                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2 text-sm space-y-2 animate-in fade-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="text-xs font-semibold text-amber-900">ชื่อผู้สำรองจ่าย (Payer Name)</label>
                                                        <select
                                                            className="input-field bg-white mt-1"
                                                            required={isAdvancedPayment}
                                                            value={payerName}
                                                            onChange={e => setPayerName(e.target.value)}
                                                        >
                                                            <option value="">-- เลือกผู้สำรองจ่าย --</option>
                                                            {employeeOptions.map(emp => (
                                                                <option key={emp.id} value={emp.nickname}>{emp.nickname} ({emp.fullname})</option>
                                                            ))}
                                                            {/* Fallback for existing data not in list */}
                                                            {payerName && !employeeOptions.find(e => e.nickname === payerName) && (
                                                                <option value={payerName}>{payerName}</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-amber-900">วันที่ได้รับเงินคืน (Reimbursed Date)</label>
                                                        <input type="date" className="input-field bg-white mt-1"
                                                            value={reimbursedDate} onChange={e => setReimbursedDate(e.target.value)} />
                                                        <p className="text-[10px] text-amber-700 mt-1">*ใส่เมื่อโอนคืนแล้วเท่านั้น (Leave empty for Pending)</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Content: Reference */}
                            <div className={activeTab === 'reference' ? 'space-y-4 animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden'}>
                                <div>
                                    <label className="label">เลขที่อ้างอิง (Order ID)</label>
                                    <input type="text" className="input-field" placeholder="e.g. 1688-2024-001"
                                        value={externalRef} onChange={e => setExternalRef(e.target.value)} />
                                </div>
                                <div>
                                    <label className="label">ลิงก์สินค้า (URL)</label>
                                    <div className="flex gap-2">
                                        <input type="url" className="input-field" placeholder="https://..."
                                            value={purchaseLink} onChange={e => setPurchaseLink(e.target.value)} />
                                        {purchaseLink && (
                                            <a href={purchaseLink} target="_blank" rel="noreferrer" className="p-2.5 bg-secondary-100 rounded-lg text-secondary-600 hover:bg-secondary-200 border border-secondary-300">
                                                <ExternalLink size={18} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="label">หมายเหตุ (Remarks)</label>
                                    <textarea className="input-field h-32 resize-none" placeholder="บันทึกเพิ่มเติม..."
                                        value={remarks} onChange={e => setRemarks(e.target.value)} ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Items (Expanded) */}
                    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

                        {/* 1. Add Item Card (Sticky Top) */}
                        <div className="p-4 bg-white border-b border-secondary-200 shadow-sm z-10 w-full">
                            <h3 className="text-sm font-bold text-secondary-800 mb-3 flex items-center gap-2">
                                <Plus className="text-primary-600" size={18} /> เพิ่มรายการสินค้า
                            </h3>

                            <div className="flex flex-col gap-3">
                                {/* Search Row */}
                                <div className="relative w-full">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="label mb-0">{isCustomItem ? 'ชื่อรายการ (Item Name)' : 'ค้นหาสินค้า (Search Product)'}</label>
                                        <button
                                            onClick={() => {
                                                setIsCustomItem(!isCustomItem)
                                                setSearchTerm('')
                                                setCustomItemName('')
                                                setSelectedProduct(null)
                                            }}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${isCustomItem ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'}`}
                                        >
                                            {isCustomItem ? 'กลับไปเลือกสินค้า' : '+ เพิ่มรายการเอง (Custom)'}
                                        </button>
                                    </div>
                                    {isCustomItem ? (
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 border border-amber-200 rounded-lg text-sm bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm outline-none"
                                            placeholder="ระบุชื่อรายการ..."
                                            value={customItemName}
                                            onChange={e => setCustomItemName(e.target.value)}
                                        />
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 text-secondary-400" size={18} />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                className="w-full pl-10 pr-4 py-2.5 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm outline-none"
                                                placeholder="ค้นหาสินค้า (ชื่อ, รหัส, SKU)..."
                                                value={searchTerm}
                                                onChange={e => {
                                                    setSearchTerm(e.target.value)
                                                    setShowSearchPopup(true)
                                                }}
                                                onFocus={() => setShowSearchPopup(true)}
                                                // Handle blur carefully to allow clicking on results
                                                onBlur={() => setTimeout(() => setShowSearchPopup(false), 200)}
                                            />
                                        </div>
                                    )}

                                    {/* SEARCH POPUP */}
                                    {showSearchPopup && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-secondary-200 rounded-lg shadow-xl max-h-[300px] overflow-y-auto z-[60] divide-y divide-secondary-100">
                                            {searchResults.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleProductSelect(p)}
                                                    className="p-3 hover:bg-primary-50 cursor-pointer flex gap-3 transition-colors"
                                                >
                                                    {/* Image */}
                                                    <div className="w-10 h-10 bg-secondary-100 rounded-md overflow-hidden flex-shrink-0 border border-secondary-200">
                                                        {(p.images?.[0] || p.variants?.[0]?.images?.[0]) ? (
                                                            <img src={p.images?.[0] || p.variants?.[0]?.images?.[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-secondary-400"><Package size={16} /></div>
                                                        )}
                                                    </div>
                                                    {/* Text */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <div className="font-bold text-secondary-900 text-sm truncate">{p.name}</div>
                                                            <div className="text-primary-600 font-mono text-xs font-bold whitespace-nowrap">
                                                                {p.product_code}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end mt-0.5">
                                                            <div className="text-xs text-secondary-500 truncate w-3/4">
                                                                {p.variants?.length ? `${p.variants.length} ตัวเลือก` : 'ไม่มีตัวเลือก'}
                                                            </div>
                                                            <div className="text-secondary-400 text-[10px]">
                                                                Stock: {p.stock || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                                                onClick={() => {
                                                    setShowProductModal(true)
                                                    setShowSearchPopup(false)
                                                }}
                                                className="w-full p-3 text-center text-sm text-primary-600 font-medium hover:bg-primary-50 flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} /> สร้างสินค้าใหม่
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Details Row (Variant, Price, Qty) */}
                                <div className="flex gap-3">
                                    <div className="flex-1 min-w-0">
                                        {isCustomItem ? (
                                            <div className="h-[42px] content-center text-xs text-secondary-400 italic bg-secondary-50 rounded-lg px-3 border border-secondary-200">
                                                - ไม่ระบุตัวเลือก -
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <select
                                                    className={`w-full appearance-none pl-3 pr-8 py-2.5 border border-secondary-300 rounded-lg text-sm bg-white focus:ring-primary-500 outline-none ${!selectedProduct ? 'bg-secondary-50 text-secondary-400 cursor-not-allowed' : 'text-secondary-900'}`}
                                                    disabled={!selectedProduct || !productVariants.length}
                                                    value={selectedVariant ? (selectedVariant.id || selectedVariant.uuid) : ''}
                                                    onChange={e => {
                                                        const v = productVariants.find(v => (v.id || v.uuid) === e.target.value)
                                                        setSelectedVariant(v)
                                                        // Do not auto-set price from variant.price (selling price)
                                                        setItemPriceForeign(0)
                                                    }}
                                                >
                                                    <option value="">{productVariants.length ? 'เลือกตัวเลือก (Variant)...' : (selectedProduct ? 'ไม่มีตัวเลือก' : 'เลือกสินค้าก่อน')}</option>
                                                    {productVariants.map(v => (
                                                        <option key={v.id || v.uuid} value={v.id || v.uuid}>
                                                            {v.sku} - {v.color} {v.size} ({v.price})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-3 text-secondary-400 pointer-events-none" size={14} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-24 relative flex-shrink-0">
                                        <div className="absolute left-3 top-2.5 text-secondary-400 text-xs font-bold">{currency}</div>
                                        <input type="number" className="w-full pl-10 pr-3 py-2.5 border border-secondary-300 rounded-lg text-sm text-right focus:ring-primary-500 outline-none"
                                            min="0" step="0.01"
                                            value={itemPriceForeign} onChange={e => setItemPriceForeign(parseFloat(e.target.value) || 0)} />
                                    </div>

                                    <div className="w-20 flex-shrink-0">
                                        <input type="number" className="w-full px-3 py-2.5 border border-secondary-300 rounded-lg text-sm text-center focus:ring-primary-500 outline-none"
                                            min="1" placeholder="Qty"
                                            value={itemQty} onChange={e => setItemQty(parseInt(e.target.value) || 1)} />
                                    </div>

                                    <button
                                        onClick={addItem}
                                        disabled={!isCustomItem && !selectedProduct}
                                        className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2 whitespace-nowrap shadow-sm flex-shrink-0 transition-colors ${isCustomItem ? 'bg-amber-600 hover:bg-amber-700' : 'bg-secondary-900 hover:bg-black'}`}
                                    >
                                        <Plus size={16} /> <span className="hidden sm:inline">เพิ่ม</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Items List (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-4 bg-secondary-50 custom-scrollbar">
                            {poItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-secondary-400 border-2 border-dashed border-secondary-200 rounded-xl bg-white/50 min-h-[200px]">
                                    <ShoppingBag size={48} className="mb-4 opacity-20" />
                                    <p className="font-medium">ยังไม่มีสินค้าในใบสั่งซื้อ</p>
                                    <p className="text-xs mt-1 text-secondary-400">เลือกร้านค้าและเพิ่มสินค้าได้เลย</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
                                        <div>รายการสินค้า ({poItems.length})</div>
                                        <div>ยอดรวม</div>
                                    </div>

                                    {poItems.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-secondary-200 shadow-sm flex gap-4 group transition-all hover:shadow-md hover:border-primary-200 items-start">
                                            {/* Index & Image */}
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-secondary-50 rounded-lg border border-secondary-100 flex items-center justify-center overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={24} className="text-secondary-300" />
                                                    )}
                                                </div>
                                                <div className="absolute -top-2 -left-2 w-5 h-5 bg-secondary-900 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold text-secondary-900 text-sm truncate pr-2">{item.product_name || item.item_name}</div>
                                                        {item.product_code && item.product_code !== '-' && (
                                                            <div className="text-xs text-primary-600 font-mono font-medium mt-0.5 mb-1 bg-primary-50 inline-block px-1.5 py-0.5 rounded">
                                                                {item.variant_sku || item.product_code}
                                                            </div>
                                                        )}
                                                        {item.is_custom && (
                                                            <div className="text-xs text-amber-600 font-mono font-medium mt-0.5 mb-1 bg-amber-50 inline-block px-1.5 py-0.5 rounded">
                                                                Custom Item
                                                            </div>
                                                        )}
                                                        {item.variant_details && (
                                                            <div className="text-[10px] text-secondary-500 flex items-center gap-1">
                                                                <span className="bg-secondary-100 px-1.5 py-0.5 rounded">
                                                                    {item.variant_details}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-secondary-900">฿{item.total_price?.toLocaleString()}</div>
                                                        <div className="text-xs text-secondary-500 font-mono">
                                                            {item.unit_price_foreign} {currency} x {item.quantity}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delete Action */}
                                            <button
                                                onClick={() => removeItem(idx)}
                                                className="p-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. Footer Summary */}
                        <div className="p-4 bg-white border-t border-secondary-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                            <div className="flex items-end justify-between">
                                <div className="hidden md:block">
                                    <div className="text-xs text-secondary-500">Summary</div>
                                    <div className="flex gap-4 mt-1">
                                        <div className="text-xs text-secondary-600 bg-secondary-50 px-2 py-1 rounded">Rate: <span className="font-mono font-bold text-secondary-900">{exchangeRate}</span></div>
                                        <div className="text-xs text-secondary-600 bg-secondary-50 px-2 py-1 rounded">Items: <span className="font-mono font-bold text-secondary-900">{poItems.length}</span></div>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <div className="text-xs text-secondary-500 mb-1">ยอดรวมสุทธิ (Grand Total)</div>
                                    <div className="text-2xl font-black text-primary-700 leading-none">
                                        <span className="text-sm font-normal text-secondary-400 mr-1">THB</span>
                                        {grandTotalTHB.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex gap-3 pt-4 border-t border-secondary-100">
                                {poId && (
                                    <button
                                        onClick={handleDelete}
                                        className="mr-auto text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                )}

                                <div className="flex-1 md:flex-none"></div>

                                <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-secondary-300 text-secondary-700 font-bold text-sm hover:bg-secondary-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!supplierName || poItems.length === 0 || isSubmitting}
                                    className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-primary-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</div>
                                    ) : (
                                        <>
                                            <Save size={18} /> Save Order
                                        </>
                                    )}
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
                .label { @apply block text-xs font-bold text-secondary-700 mb-1.5 uppercase tracking-wide; }
                .input-field { @apply w-full px-3 py-2.5 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow bg-white; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 20px; }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.2); }
            `}</style>
        </div>
    )
}
