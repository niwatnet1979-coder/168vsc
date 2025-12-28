import React, { useState, useEffect, useRef, useMemo } from 'react'
import { X, Trash2, Search, Wrench, Truck, HelpCircle, ChevronRight, Package, Plus, User, MapPin, Calendar, Box, Palette, Zap, Power, ChevronDown, Gem, Maximize2 } from 'lucide-react'
import { currency } from '../lib/utils'
import { DataManager } from '../lib/dataManager'
import ProductCard from './ProductCard'
import ConfirmDialog from './ConfirmDialog'

const EMPTY_ARRAY = []

const OrderItemModal = React.forwardRef(({
    isOpen,
    onClose,
    onSave,
    onDelete,
    item = null,
    productsData = EMPTY_ARRAY,

    isEditing = false,
    isInline = false, // New prop for inline display
    hideControls = false, // New prop to hide internal buttons

    onOpenSubJob, // Callback to open the sub-job modal
    onAddNewProduct, // Callback to open new product modal
    onEditProduct, // Callback to edit existing product
    lastCreatedProduct = null,
    onConsumeLastCreatedProduct
}, ref) => {
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', qty: 1, unitPrice: 0, image: null,
        category: '', subcategory: '', jobs: [], _searchTerm: '',
        lightColor: '', remote: '', bulbType: '', crystalColor: '', remark: '',
        selectedVariant: null
    })

    const [showSearchPopup, setShowSearchPopup] = useState(false)
    const [showVariantPopup, setShowVariantPopup] = useState(false)
    const [showChangeProductConfirm, setShowChangeProductConfirm] = useState(false)
    const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [productVariants, setProductVariants] = useState([])
    const [internalProductsData, setInternalProductsData] = useState([])

    const [productOptions, setProductOptions] = useState({
        lightColors: [],
        remotes: [],
        bulbTypes: [],
        crystalColors: []
    })

    const activeProductsData = useMemo(() => {
        return productsData.length > 0 ? productsData : internalProductsData
    }, [productsData, internalProductsData])

    const lastItemIdRef = useRef(null)
    const lastProductIdRef = useRef(null)
    const hasLoadedOptionsRef = useRef(false)

    // Effect 1: Load product options once when modal opens
    useEffect(() => {
        if (isOpen && !hasLoadedOptionsRef.current) {
            hasLoadedOptionsRef.current = true
            const loadOptions = async () => {
                const options = await DataManager.getProductOptions()
                if (options) {
                    setProductOptions({
                        lightColors: options.lightColors || ['warm', 'cool', 'white', '3แสง'],
                        remotes: options.remotes || ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
                        bulbTypes: options.bulbTypes || ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module'],
                        crystalColors: options.crystalColors || ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ', 'ใส']
                    })
                } else {
                    setProductOptions({
                        lightColors: ['warm', 'cool', 'white', '3แสง'],
                        remotes: ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
                        bulbTypes: ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module'],
                        crystalColors: ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ', 'ใส']
                    })
                }
            }
            loadOptions()
        }
    }, [isOpen])

    // Effect 2: Initialize formData when item changes
    useEffect(() => {
        if (!isOpen) return

        if (item) {
            const itemId = item.id || item.uuid || item.product_id
            // Only process if this is a different item
            if (itemId !== lastItemIdRef.current) {
                lastItemIdRef.current = itemId
                console.log('[OrderItemModal] Loading item:', itemId)

                setFormData(prev => ({
                    ...item,
                    _searchTerm: item.name || '',
                    lightColor: item.lightColor || item.light_color || prev.lightColor || '',
                    remote: item.remote || prev.remote || '',
                    bulbType: item.bulbType || item.light || prev.bulbType || '',
                    crystalColor: item.crystalColor || prev.crystalColor || '',
                    remark: item.remark || prev.remark || '',
                    // FIX: Ensure unitPrice is populated from price/unit_price
                    unitPrice: item.unitPrice !== undefined ? item.unitPrice : (item.price || item.unit_price || 0),
                    // Ensure selectedVariant is set from item data
                    selectedVariant: item.selectedVariant || item.variant || null,
                    selectedVariantIndex: item.selectedVariantIndex !== undefined ? item.selectedVariantIndex : null
                }))
            }
        } else {
            // Reset for new item - ONLY if we weren't already in reset state
            if (lastItemIdRef.current !== '__NEW__') {
                lastItemIdRef.current = '__NEW__'
                console.log('[OrderItemModal] Resetting for new item')
                setFormData({
                    code: '', name: '', description: '', qty: 1, unitPrice: 0, image: null,
                    category: '', subcategory: '', jobs: [], _searchTerm: '',
                    lightColor: '', remote: '', bulbType: '', crystalColor: '', remark: '',
                    selectedVariant: null
                })
            }
        }
    }, [item?.id, item?.uuid, item?.product_id, isOpen]) // Only depend on item object reference and isOpen

    // Effect 2.5: CRITICAL CLEANUP - Reset refs when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Reset all refs when modal closes
            lastItemIdRef.current = null
            lastProductIdRef.current = null
            console.log('[OrderItemModal] Modal closed - refs reset')
        }
    }, [isOpen])

    // Effect 3: Fetch product variants separately
    useEffect(() => {
        if (!isOpen || !item) {
            // Reset ref when modal closes or item is cleared
            if (!isOpen || !item) {
                lastProductIdRef.current = null
            }
            return
        }

        const productId = item.product_id || item.product_code || item.code
        // Only fetch if product ID actually changed
        if (productId && productId !== lastProductIdRef.current) {
            lastProductIdRef.current = productId
            console.log('[OrderItemModal] Fetching variants for product:', productId)

            const fetchProductData = async () => {
                try {
                    const products = await DataManager.getProducts()
                    const product = products.find(p =>
                        p.uuid === item.product_id ||
                        p.product_code === item.product_code ||
                        p.product_code === item.code ||
                        p.id === item.code
                    )

                    if (product && product.variants) {
                        console.log('[OrderItemModal] Loaded product variants:', product.variants)
                        const variants = product.variants
                        setProductVariants(variants)

                        // Try to match existing variant from item data
                        const variantToMatch = item.selectedVariant || item.variant || (item.product_variant_id ? variants.find(v => v.id === item.product_variant_id) : null)

                        // Backfill missing product details if found
                        setFormData(prev => ({
                            ...prev,
                            name: prev.name || product.name,
                            code: prev.code || product.product_code || product.id,
                            image: prev.image || product.images?.[0] || product.variants?.[0]?.images?.[0] || null,
                            // Also try to set variant if we found it via ID
                            selectedVariant: prev.selectedVariant || variantToMatch || null
                        }))

                        if (variantToMatch) {
                            const index = variants.findIndex(v =>
                                v.id === variantToMatch.id ||
                                v.uuid === variantToMatch.uuid ||
                                (v.color === variantToMatch.color && v.price === variantToMatch.price)
                            )
                            if (index !== -1) {
                                console.log('[OrderItemModal] Auto-matched variant index:', index)
                                setFormData(prev => ({
                                    ...prev,
                                    selectedVariant: variants[index],
                                    selectedVariantIndex: index,
                                    // Ensure price is set if still 0
                                    unitPrice: prev.unitPrice || variants[index].price || 0
                                }))
                            } else {
                                console.warn('[OrderItemModal] Could not match variant:', variantToMatch)
                            }
                        }
                    } else {
                        console.warn('[OrderItemModal] Product not found or has no variants')
                        setProductVariants([])
                    }
                } catch (error) {
                    console.error('[OrderItemModal] Error fetching product:', error)
                    setProductVariants([])
                }
            }

            fetchProductData()
        }
    }, [isOpen, item]) // Only depend on item reference, not individual properties

    // Fetch search data if not provided via props
    useEffect(() => {
        if (isOpen && productsData.length === 0) {
            const fetchProducts = async () => {
                try {
                    const products = await DataManager.getProducts()
                    if (products) {
                        setInternalProductsData(products)
                    }
                } catch (error) {
                    console.error('[OrderItemModal] Error fetching search products:', error)
                }
            }
            fetchProducts()
        }
    }, [isOpen, productsData.length])

    // Search Logic
    useEffect(() => {
        // Auto-select newly created product
        if (lastCreatedProduct) {
            selectProduct(lastCreatedProduct)
            if (onConsumeLastCreatedProduct) {
                onConsumeLastCreatedProduct()
            }
        }
    }, [lastCreatedProduct])

    useEffect(() => {
        const data = activeProductsData
        if (showSearchPopup && formData._searchTerm !== undefined) {
            const term = formData._searchTerm
            if (term.trim()) {
                const lowerTerm = term.toLowerCase()
                const results = data.filter(p =>
                    JSON.stringify(p).toLowerCase().includes(lowerTerm)
                )
                // Only update if results actually changed to prevent loops
                setSearchResults(prev => {
                    if (prev.length === results.length && results.every((v, i) => v.id === prev[i]?.id)) {
                        return prev
                    }
                    return results
                })
            } else {
                // Show all (or first 50) if no search term
                const slice = data.slice(0, 50)
                setSearchResults(prev => {
                    if (prev.length === slice.length && slice.every((v, i) => v.id === prev[i]?.id)) {
                        return prev
                    }
                    return slice
                })
            }
        } else {
            setSearchResults(prev => prev.length === 0 ? prev : EMPTY_ARRAY)
        }
    }, [formData._searchTerm, showSearchPopup, productsData, internalProductsData])

    const selectProduct = (product) => {
        // Set product variants if available
        setProductVariants(product.variants || [])

        // Calculate base price from first variant only (product.price is deprecated)
        const basePrice = (product.variants?.[0]?.price) || 0
        const firstVariant = product.variants?.[0] || null

        // Store variants locally directly from selected product
        setProductVariants(product.variants || [])

        setFormData(prev => ({
            ...prev,
            // New UUID-based reference
            product_id: product.uuid || product.product_code,  // UUID for stable reference
            product_code: product.product_code,  // Human-readable code for display

            // Legacy field (deprecated but kept for backward compatibility)
            code: product.product_code,

            name: product.name,
            description: product.description || '',
            category: product.category,
            subcategory: product.subcategory,
            material: product.material,

            basePrice: basePrice,  // Store base price (from first variant)
            unitPrice: basePrice,
            qty: prev.qty || 1,

            // Auto-select first variant
            selectedVariant: firstVariant,
            selectedVariantIndex: firstVariant ? 0 : null,
            image: firstVariant?.images?.[0] || prev.image,

            _searchTerm: product.name,
        }))
        setShowSearchPopup(false)
    }

    // Expose triggerSave to parent
    React.useImperativeHandle(ref, () => ({
        triggerSave: () => handleSave()
    }))

    const handleVariantSelect = (variantIndex) => {
        console.log('=== handleVariantSelect ===')
        console.log('variantIndex:', variantIndex, 'type:', typeof variantIndex)
        console.log('productVariants:', productVariants)

        // Use index instead of ID to avoid ID format issues
        const variant = variantIndex !== '' ? productVariants[parseInt(variantIndex)] : null
        console.log('Found variant:', variant)

        if (variant) {
            console.log('Setting variant price:', variant.price)
            setFormData(prev => {
                console.log('Previous formData:', prev)
                return {
                    ...prev,
                    selectedVariant: variant,
                    selectedVariantIndex: parseInt(variantIndex),
                    unitPrice: variant.price || prev.unitPrice,
                    image: variant.images?.[0] || prev.image,
                    // Reset optional fields to empty when selecting new variant
                    lightColor: '',
                    crystalColor: '',
                    bulbType: '',
                    remote: ''
                }
            })
        } else {
            console.log('No variant selected, resetting to base price')
            // Reset to base price when no variant selected
            setFormData(prev => {
                console.log('Previous basePrice:', prev.basePrice)
                return {
                    ...prev,
                    selectedVariant: null,
                    selectedVariantIndex: null,
                    unitPrice: prev.basePrice || prev.unitPrice
                }
            })
        }
    }


    const handleSave = () => {
        if (!formData.product_id && !formData.code && !formData.name) {
            alert('กรุณาระบุสินค้า')
            return
        }

        // Flatten variant data into item for compatibility
        const itemData = {
            ...formData,
            // CRITICAL FIX: Generate tempId for new items
            // If item doesn't have tempId (new item), generate one
            // If item has tempId (editing existing), keep it
            tempId: formData.tempId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            // If variant selected, use its data
            color: formData.selectedVariant?.color || '',
            stock: formData.selectedVariant?.stock || 0,
            // Flatten dimensions for OrderForm
            width: formData.selectedVariant?.dimensions?.width || formData.width || '',
            length: formData.selectedVariant?.dimensions?.length || formData.length || '',
            height: formData.selectedVariant?.dimensions?.height || formData.height || '',
            // dimensions: formData.selectedVariant?.dimensions || null, // No longer needed as nested object
            // Mapping for DataManager
            light: formData.bulbType || '', // Map bulbType to 'light' column
            lightColor: formData.lightColor || '',
            remote: formData.remote || '',
            // Ensure jobs array is passed through if it exists in formData
            jobs: formData.jobs || [],
            // FIX: Explicitly save selected variant image or fallback to existing image
            image: formData.selectedVariant?.images?.[0] || formData.image || '',
        }

        console.log('[OrderItemModal] Saving item:', itemData)

        onSave(itemData)
        onClose()
    }


    if (!isOpen && !isInline) return null

    const total = (Number(formData.qty) || 0) * (Number(formData.unitPrice) || 0)

    const Wrapper = isInline ? 'div' : 'div'
    const wrapperProps = isInline ? { className: "w-full h-full flex flex-col p-4" } : { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" }
    const containerProps = isInline ? { className: "w-full bg-white rounded-xl shadow-sm border border-secondary-200 flex flex-col overflow-hidden" } : { className: "bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-md min-w-[28rem] h-[600px] max-h-[90vh] flex flex-col overflow-hidden" }


    return (
        <Wrapper {...wrapperProps}>
            <div {...containerProps}>
                {/* Header */}
                <div className="sticky top-0 bg-white px-4 pt-4 pb-0 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2" spellCheck="false">
                        <Package size={20} className="text-primary-600" />
                        {isEditing ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้า'}
                    </h2>
                    {!isInline && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-secondary-100 rounded-full text-secondary-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className={`px-4 pb-2 pt-2 space-y-3 bg-white ${isInline ? 'h-full' : 'flex-1 overflow-y-auto min-h-0'}`}>
                    {/* ... (Existing Body Content) ... */}
                    {/* Product Search / Selected Item */}
                    <div className="relative">
                        {formData.code ? (
                            <div
                                onClick={() => setShowChangeProductConfirm(true)}
                                className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md cursor-pointer group"
                            >
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    สินค้า <span className="text-danger-500">*</span>
                                </label>
                                <ProductCard
                                    product={{
                                        name: formData.name,
                                        product_code: formData.product_code || formData.code,
                                        code: formData.code,
                                        category: formData.category,
                                        material: formData.material,
                                        description: formData.description,
                                        description: formData.description,
                                        variants: productVariants
                                    }}
                                    variant="ghost"
                                    showImage={true}
                                    image={
                                        formData.selectedVariant?.images?.[0] || // 1. Selected Variant Image
                                        formData.image ||                        // 2. Saved Item Image
                                        productVariants?.[0]?.images?.[0] ||     // 3. Default Variant Image
                                        null
                                    }
                                    showPrice={true}
                                    showStock={true}
                                />
                                <div className="hidden group-hover:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm">
                                    แตะเพื่อเปลี่ยน
                                </div>
                            </div>
                        ) : (
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md relative">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    สินค้า <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                    <input
                                        type="text"
                                        value={formData._searchTerm}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setFormData(prev => ({ ...prev, _searchTerm: val }))
                                            setShowSearchPopup(true)
                                        }}
                                        onFocus={() => setShowSearchPopup(true)}
                                        onBlur={() => setTimeout(() => setShowSearchPopup(false), 200)}
                                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 focus:outline-none outline-none placeholder-secondary-400 placeholder:font-normal"
                                        placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                </div>

                                {/* Search Popup */}
                                {showSearchPopup && (
                                    <div className="absolute left-0 z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-[360px] overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => selectProduct(p)}
                                                    className="p-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0 flex items-start gap-3"
                                                >
                                                    {/* Product Image */}
                                                    <div className="w-12 h-12 flex-shrink-0 bg-secondary-100 rounded overflow-hidden">
                                                        {(() => {
                                                            // Try to get image from first variant, fallback to product images
                                                            const imageUrl = p.variants?.[0]?.images?.[0] || p.images?.[0]
                                                            return imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={p.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package size={20} className="text-secondary-400" />
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>

                                                    {/* Product Info - 3 Lines */}
                                                    <div className="flex-1 min-w-0 space-y-0.5">
                                                        {/* Line 1: Product Code + Price Range */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="font-bold text-primary-600 text-sm truncate">
                                                                {p.product_code || p.id}
                                                            </div>
                                                            <div className="text-sm font-bold text-primary-600 flex-shrink-0">
                                                                {(() => {
                                                                    if (p.variants && p.variants.length > 0) {
                                                                        const prices = p.variants.map(v => v.price || 0)
                                                                        const minPrice = Math.min(...prices)
                                                                        const maxPrice = Math.max(...prices)
                                                                        if (minPrice === maxPrice) {
                                                                            return currency(minPrice)
                                                                        }
                                                                        return `${currency(minPrice)} - ${currency(maxPrice)}`
                                                                    }
                                                                    return currency(p.price || 0)
                                                                })()}
                                                            </div>
                                                        </div>

                                                        {/* Line 2: Name • Category • Subcategory • Material • Dimensions • Color Count */}
                                                        <div className="text-xs text-secondary-700 truncate">
                                                            {p.name && <span>{p.name}</span>}
                                                            {p.category && <span> • {p.category}</span>}
                                                            {p.subcategory && <span> • {p.subcategory}</span>}
                                                            {p.material && <span> • {p.material}</span>}
                                                            {(p.length || p.width || p.height) && (
                                                                <span> • {[p.length, p.width, p.height].filter(Boolean).join('×')} cm</span>
                                                            )}
                                                            {p.variants && p.variants.length > 0 && (
                                                                <span> 🎨 {p.variants.length} สี</span>
                                                            )}
                                                        </div>

                                                        {/* Line 3: Description + Stock */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="text-xs text-secondary-500 truncate flex-1">
                                                                {p.description || ''}
                                                            </div>
                                                            <div className="text-xs text-secondary-500 flex-shrink-0">
                                                                {(() => {
                                                                    if (p.variants && p.variants.length > 0) {
                                                                        const totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                                                                        return `คงเหลือ: ${totalStock}`
                                                                    }
                                                                    return `คงเหลือ: ${p.stock || 0}`
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-sm text-secondary-500 text-center">ไม่พบสินค้า</div>
                                        )}
                                        {/* Add New Product Option */}
                                        <div
                                            onClick={() => {
                                                if (onAddNewProduct) {
                                                    onAddNewProduct()
                                                    setShowSearchPopup(false)
                                                }
                                            }}
                                            className="p-3 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 sticky bottom-0 border-t border-primary-100"
                                        >
                                            <Plus size={16} /> เพิ่มสินค้าใหม่
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                        }
                    </div>

                    {/* Product Options Dropdowns & Remark */}
                    <div className="space-y-3">
                        {/* Row 1: Variant (full width if exists) - MOST IMPORTANT */}
                        {productVariants.length > 0 && (
                            <div className={`bg-white p-2.5 rounded-lg border border-secondary-200 shadow-sm transition-all ${!formData.code ? 'opacity-50' : 'hover:border-primary-300 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    Variant
                                </label>
                                <div className="relative">
                                    <div
                                        onClick={() => {
                                            if (formData.code) {
                                                setShowVariantPopup(!showVariantPopup)
                                            }
                                        }}
                                        className={`w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 cursor-pointer pr-6 flex items-center justify-between ${!formData.code ? 'cursor-not-allowed' : ''}`}
                                    >
                                        <div className="w-full">
                                            {formData.selectedVariantIndex !== null && formData.selectedVariantIndex !== undefined && productVariants[formData.selectedVariantIndex]
                                                ? (() => {
                                                    const v = productVariants[formData.selectedVariantIndex]
                                                    return (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                                                                {v.sku || '-- No SKU --'}
                                                            </div>
                                                            <div className="text-[11px] text-secondary-500 flex items-center flex-wrap gap-x-2 gap-y-1 leading-none">
                                                                {formData.name && <span className="flex items-center gap-1">{formData.name}</span>}
                                                                {formData.material && <span className="flex items-center gap-1"> • {formData.material}</span>}
                                                                {v.dimensions && (
                                                                    <span className="flex items-center gap-1">
                                                                        • <Maximize2 size={10} className="text-secondary-400" />
                                                                        {v.dimensions.length}×{v.dimensions.width}×{v.dimensions.height}cm
                                                                    </span>
                                                                )}
                                                                {v.color && (
                                                                    <span className="flex items-center gap-1">
                                                                        • <Palette size={10} className="text-secondary-400" />
                                                                        {v.color}
                                                                    </span>
                                                                )}
                                                                {v.crystalColor && (
                                                                    <span className="flex items-center gap-1">
                                                                        • <Gem size={10} className="text-secondary-400" />
                                                                        {v.crystalColor}
                                                                    </span>
                                                                )}
                                                                {formData.description && <span className="flex items-center gap-1"> • {formData.description}</span>}
                                                                {(v.available !== undefined || v.stock !== undefined) && (
                                                                    <span className="ml-auto text-primary-600 font-medium whitespace-nowrap">
                                                                        พร้อมส่ง {v.available ?? v.stock ?? 0}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })()
                                                : <span className="text-secondary-400">-- เลือก Variant --</span>}
                                        </div>
                                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                    </div>

                                    {/* Variant Popup */}
                                    {showVariantPopup && (
                                        <>
                                            {/* Backdrop to close */}
                                            <div className="fixed inset-0 z-10" onClick={() => setShowVariantPopup(false)} />

                                            <div className="absolute left-0 z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                                                {productVariants.map((variant, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => {
                                                            handleVariantSelect(i)
                                                            setShowVariantPopup(false)
                                                        }}
                                                        className={`p-2.5 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0 text-sm ${formData.selectedVariantIndex === i ? 'bg-primary-50 text-primary-700 font-medium' : 'text-secondary-700'}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="font-bold text-secondary-900 group-hover:text-primary-700">
                                                                {variant.sku || '-- No SKU --'}
                                                            </div>
                                                            <div className="text-[11px] text-secondary-500 flex items-center flex-wrap gap-x-2 gap-y-1">
                                                                <span className="flex items-center gap-1">{formData.name}</span>
                                                                {formData.material && <span className="flex items-center gap-1"> • {formData.material}</span>}
                                                                {variant.dimensions && (
                                                                    <span className="flex items-center gap-1">
                                                                        • <Maximize2 size={10} className="text-secondary-400" />
                                                                        {variant.dimensions.length}×{variant.dimensions.width}×{variant.dimensions.height}cm
                                                                    </span>
                                                                )}
                                                                {variant.color && (
                                                                    <span className="flex items-center gap-1">
                                                                        • <Palette size={10} className="text-secondary-400" />
                                                                        {variant.color}
                                                                    </span>
                                                                )}
                                                                {variant.crystalColor && (
                                                                    <span className="flex items-center gap-1">
                                                                        • <Gem size={10} className="text-secondary-400" />
                                                                        {variant.crystalColor}
                                                                    </span>
                                                                )}
                                                                {formData.description && <span className="flex items-center gap-1"> • {formData.description}</span>}
                                                                <span className="ml-auto flex items-center gap-2 whitespace-nowrap">
                                                                    <span className="font-bold text-primary-600">฿{variant.price?.toLocaleString()}</span>
                                                                    <span className="text-secondary-400 text-[10px]">พร้อมส่ง {variant.available ?? variant.stock ?? 0}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Variant Button */}
                                                <div
                                                    onClick={() => {
                                                        if (onEditProduct) {
                                                            let currentProduct = activeProductsData.find(p => p.product_code === formData.product_code || p.id === formData.code);

                                                            if (!currentProduct && (formData.product_id || formData.code)) {
                                                                // Reconstruct minimal product object for the modal if not in prop data
                                                                currentProduct = {
                                                                    uuid: formData.product_id,
                                                                    product_code: formData.product_code || formData.code,
                                                                    id: formData.code,
                                                                    name: formData.name,
                                                                    description: formData.description,
                                                                    category: formData.category,
                                                                    variants: productVariants || []
                                                                }
                                                            }

                                                            if (currentProduct) {
                                                                onEditProduct(currentProduct)
                                                                setShowVariantPopup(false)
                                                            } else {
                                                                alert('ไม่พบข้อมูลสินค้าต้นทาง')
                                                            }
                                                        }
                                                    }}
                                                    className="p-2.5 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 sticky bottom-0 border-t border-primary-100"
                                                >
                                                    <Plus size={16} /> เพิ่ม Variant ใหม่
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}


                        {/* Row 2: Options Grid (3 Cols) - Light Color, Bulb Type, Remote */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Light Color */}
                            <div className={`bg-secondary-50 p-2 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">สีแสงไฟ</label>
                                <div className="relative">
                                    <select
                                        value={formData.lightColor}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setFormData(prev => ({ ...prev, lightColor: val }))
                                        }}
                                        disabled={!formData.code}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {productOptions.lightColors.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Bulb Type */}
                            <div className={`bg-secondary-50 p-2 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    ประเภทหลอดไฟ
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.bulbType}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setFormData(prev => ({ ...prev, bulbType: val }))
                                        }}
                                        disabled={!formData.code}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {productOptions.bulbTypes.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {/* Remote */}
                            <div className={`bg-secondary-50 p-2 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">รีโมท</label>
                                <div className="relative">
                                    <select
                                        value={formData.remote}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setFormData(prev => ({ ...prev, remote: val }))
                                        }}
                                        disabled={!formData.code}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- เลือก --</option>
                                        {productOptions.remotes.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className={`bg-secondary-50 p-2 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                            <label className="block text-xs font-medium text-secondary-500 mb-1">หมายเหตุ</label>
                            <textarea
                                rows={1}
                                value={formData.remark}
                                onChange={(e) => {
                                    const val = e.target.value
                                    setFormData(prev => ({ ...prev, remark: val }))
                                }}
                                disabled={!formData.code}
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 resize-none disabled:cursor-not-allowed"
                                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                            />
                        </div>
                    </div >

                    {/* Quantity, Price & Total - Single Row */}
                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-4">
                            <div className={`bg-secondary-50 p-2 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">จำนวน</label>
                                <input
                                    type="number"
                                    value={formData.qty}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        setFormData(prev => ({ ...prev, qty: val }))
                                    }}
                                    disabled={!formData.code}
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 text-right disabled:cursor-not-allowed"
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="col-span-4">
                            <div className={`bg-secondary-50 p-2 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ราคา/หน่วย</label>
                                <input
                                    type="number"
                                    value={formData.unitPrice}
                                    onChange={(e) => {
                                        const val = e.target.value
                                        setFormData(prev => ({ ...prev, unitPrice: val }))
                                    }}
                                    disabled={!formData.code}
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 text-right disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="col-span-4">
                            <div className="bg-primary-50 p-2 rounded-lg border border-primary-100 transition-all hover:shadow-md">
                                <label className="block text-xs font-medium text-primary-600 mb-1 text-right">รวมเป็นเงิน</label>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-primary-700">{currency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Footer */}
                {/* Footer */}
                {
                    !hideControls && (
                        <div className="flex items-center justify-end gap-3 px-3 pt-2 pb-3 border-t border-secondary-200 bg-white flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 sticky bottom-0 rounded-b-2xl">
                            {isEditing && onDelete && (
                                <button
                                    onClick={() => setShowDeleteItemConfirm(true)}
                                    className="px-4 py-2 text-sm border border-danger-500 text-danger-500 rounded-lg hover:bg-danger-50 font-medium flex items-center gap-1 mr-auto"
                                >
                                    <Trash2 size={16} />
                                    ลบ
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                            >
                                บันทึก
                            </button>
                        </div>
                    )
                }
            </div >

            {/* Change Product Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showChangeProductConfirm}
                title="ยืนยันการเปลี่ยนสินค้า"
                message="คุณต้องการเปลี่ยนสินค้าใช่หรือไม่?"
                onConfirm={() => {
                    setShowChangeProductConfirm(false)
                    setFormData(prev => ({
                        ...prev,
                        code: '', name: '', unitPrice: 0, _searchTerm: '', description: '',
                        image: null, length: '', width: '', height: '',
                        material: '', color: '', crystalColor: '',
                        bulbType: '', light: '', remote: '', category: '', subcategory: '',
                        selectedVariant: null
                    }))
                }}
                onCancel={() => setShowChangeProductConfirm(false)}
            />

            {/* Delete Item Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteItemConfirm}
                title="ยืนยันการลบรายการ"
                message="คุณต้องการลบรายการนี้ใช่หรือไม่?"
                onConfirm={() => {
                    setShowDeleteItemConfirm(false)
                    onDelete()
                    onClose()
                }}
                onCancel={() => setShowDeleteItemConfirm(false)}
            />
        </Wrapper >
    )
})

export default OrderItemModal
