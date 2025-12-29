import React, { useState, useEffect, useRef, useMemo } from 'react'
import { X, Trash2, Search, Wrench, Truck, HelpCircle, ChevronRight, Package, Plus, User, MapPin, Calendar, Box, Palette, Zap, Power, ChevronDown, Gem, Maximize2, Edit2 } from 'lucide-react'
import { currency } from '../lib/utils'
import { DataManager } from '../lib/dataManager'
import Swal, { showConfirm, showSelect, showSelectVariant, showProductSearch } from '../lib/sweetAlert'
import ProductCard from './ProductCard'
import ConfirmDialog from './ConfirmDialog'
import VariantSelector from './VariantSelector'

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
    const [showChangeProductConfirm, setShowChangeProductConfirm] = useState(false)
    const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [productVariants, setProductVariants] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
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
                    // Use standardized unitPrice from useOrderLoader
                    unitPrice: Number(item.unitPrice || item.price || item.unit_price || 0),
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
                        (item.product_id && p.uuid === item.product_id) ||
                        (item.product?.uuid && p.uuid === item.product.uuid) ||
                        (item.product_code && p.product_code === item.product_code) ||
                        (item.code && p.product_code === item.code) ||
                        (item.code && p.id === item.code)
                    )

                    if (product && product.variants) {
                        console.log('[OrderItemModal] Loaded product variants:', product.variants)
                        setSelectedProduct(product)
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

    const selectProduct = async (product) => {
        // If same product, check if we should open variant selector
        if (formData.product_id === (product.uuid || product.product_code)) {
            setShowSearchPopup(false)

            // If it has variants, open variant selector
            if (product.variants && product.variants.length > 0) {
                await showSelectVariant({
                    variants: product.variants,
                    productName: product.name,
                    material: product.material,
                    selectedIndex: formData.selectedVariantIndex,
                    onSelect: (index) => handleVariantSelect(index),
                    actionButtonText: 'เพิ่ม Variant / แก้ไขสินค้า',
                    onAction: () => {
                        if (onEditProduct) onEditProduct(product)
                    }
                })
            }
            return
        }

        // Direct switch without confirmation (per user request)
        if (formData.code || formData.product_id) {
            setShowSearchPopup(false)
            applyProduct(product)
            return
        }

        applyProduct(product)
    }

    const applyProduct = (product) => {
        // Set product variants if available
        setSelectedProduct(product)
        setProductVariants(product.variants || [])

        // Calculate base price from first variant only (product.price is deprecated)
        const basePrice = (product.variants?.[0]?.price) || 0
        const firstVariant = product.variants?.[0] || null

        setFormData(prev => ({
            ...prev,
            // New UUID-based reference
            product_id: product.uuid || product.product_code,
            product_code: product.product_code,

            // Legacy field (deprecated)
            code: product.product_code,

            name: product.name,
            description: product.description || '',
            category: product.category,
            subcategory: product.subcategory,
            material: product.material,

            basePrice: basePrice,
            unitPrice: basePrice,
            qty: prev.qty || 1,

            // Auto-select first variant
            selectedVariant: firstVariant,
            selectedVariantIndex: firstVariant ? 0 : null,
            image: firstVariant?.images?.[0] || prev.image,

            _searchTerm: product.name,
            // Reset variant specific options
            lightColor: '',
            crystalColor: '',
            bulbType: '',
            remote: '',
            remark: ''
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

    // Hardened calculation: ensure strict numeric conversion to prevent 85k * 2 = 810k discrepancy
    const qtyNum = Number(formData.qty) || 0
    const priceNum = Number(formData.unitPrice || formData.price || 0)
    const total = qtyNum * priceNum

    const Wrapper = isInline ? 'div' : 'div'
    const wrapperProps = isInline ? { className: "w-full h-full flex flex-col p-4" } : { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" }
    const containerProps = isInline ? { className: "w-full bg-white rounded-xl shadow-sm border border-secondary-200 flex flex-col overflow-hidden" } : { className: "bg-white rounded-xl shadow-2xl border border-secondary-200 w-full max-w-md min-w-[28rem] h-[620px] max-h-[90vh] flex flex-col overflow-hidden" }


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
                                onClick={() => {
                                    showProductSearch(
                                        activeProductsData,
                                        (selected) => {
                                            selectProduct(selected)
                                        },
                                        formData.product_id || formData.code, // selectedId
                                        onAddNewProduct, // onAddNew callback
                                        onEditProduct // onEdit callback
                                    )
                                }}
                                className="bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md cursor-pointer group"
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
                                    variant="default"
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

                            </div>
                        ) : (
                            <div
                                onClick={() => {
                                    console.log('[OrderItemModal] Clicked product search', { activeDataLength: activeProductsData?.length })
                                    showProductSearch(
                                        activeProductsData,
                                        (selected) => {
                                            console.log('[OrderItemModal] Selected product:', selected)
                                            selectProduct(selected)
                                        },
                                        formData.product_id || formData.code, // selectedId
                                        onAddNewProduct // onAddNew callback
                                    )
                                }}
                                className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md relative cursor-pointer"
                            >
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    สินค้า <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="w-full pl-3 pr-3 py-2 bg-white/50 border border-secondary-200 rounded-lg flex items-center gap-2 text-secondary-400">
                                        <Search size={16} />
                                        <span className="text-sm">คลิกเพื่อค้นหารหัส หรือ ชื่อสินค้า...</span>
                                    </div>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <span className="text-[10px] bg-secondary-100 text-secondary-500 px-1.5 py-0.5 rounded-md">
                                            {internalProductsData?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Options Dropdowns & Remark */}
                    <div className="space-y-3">
                        {/* Row 1: Variant (full width if exists) - MOST IMPORTANT */}
                        {productVariants.length > 0 && (
                            <div className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    Variant
                                </label>
                                <div className="relative">
                                    <VariantSelector
                                        variants={productVariants}
                                        value={formData.selectedVariantIndex}
                                        onChange={(index) => handleVariantSelect(index)}
                                        onAction={() => {
                                            if (onEditProduct && selectedProduct) {
                                                onEditProduct(selectedProduct)
                                            }
                                        }}
                                        onEdit={() => {
                                            if (onEditProduct && selectedProduct) {
                                                onEditProduct(selectedProduct)
                                            }
                                        }}
                                        disabled={!formData.code}
                                    />
                                </div>
                            </div>
                        )}


                        {/* Row 2: Options Grid (3 Cols) - Light Color, Bulb Type, Remote */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Light Color */}
                            <div
                                onClick={async () => {
                                    if (!formData.code) return
                                    const options = {}
                                    productOptions.lightColors.forEach(opt => options[opt] = opt)
                                    const result = await showSelect({
                                        title: 'เลือกสีแสงไฟ',
                                        inputOptions: options,
                                        inputValue: formData.lightColor
                                    })
                                    if (result.isConfirmed) {
                                        setFormData(prev => ({ ...prev, lightColor: result.value }))
                                    }
                                }}
                                className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all cursor-pointer ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}
                            >
                                <label className="block text-xs font-medium text-secondary-500 mb-1">สีแสงไฟ</label>
                                <div className="relative">
                                    <div className="text-sm font-medium text-secondary-900 truncate h-5">
                                        {formData.lightColor || <span className="text-secondary-400">-- เลือก --</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Bulb Type */}
                            <div
                                onClick={async () => {
                                    if (!formData.code) return
                                    const options = {}
                                    productOptions.bulbTypes.forEach(opt => options[opt] = opt)
                                    const result = await showSelect({
                                        title: 'เลือกประเภทหลอดไฟ',
                                        inputOptions: options,
                                        inputValue: formData.bulbType
                                    })
                                    if (result.isConfirmed) {
                                        setFormData(prev => ({ ...prev, bulbType: result.value }))
                                    }
                                }}
                                className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all cursor-pointer ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}
                            >
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทหลอดไฟ</label>
                                <div className="relative">
                                    <div className="text-sm font-medium text-secondary-900 truncate h-5">
                                        {formData.bulbType || <span className="text-secondary-400">-- เลือก --</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Remote */}
                            <div
                                onClick={async () => {
                                    if (!formData.code) return
                                    const options = {}
                                    productOptions.remotes.forEach(opt => options[opt] = opt)
                                    const result = await showSelect({
                                        title: 'เลือกประเภทรีโมท',
                                        inputOptions: options,
                                        inputValue: formData.remote
                                    })
                                    if (result.isConfirmed) {
                                        setFormData(prev => ({ ...prev, remote: result.value }))
                                    }
                                }}
                                className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all cursor-pointer ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}
                            >
                                <label className="block text-xs font-medium text-secondary-500 mb-1">รีโมท</label>
                                <div className="relative">
                                    <div className="text-sm font-medium text-secondary-900 truncate h-5">
                                        {formData.remote || <span className="text-secondary-400">-- เลือก --</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
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
                            <div className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
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
                            <div className={`bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all ${!formData.code ? 'opacity-50' : 'hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md'}`}>
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
                            <div className="bg-primary-50 p-2.5 rounded-lg border border-primary-100 transition-all hover:shadow-md">
                                <label className="block text-xs font-medium text-primary-600 mb-1 text-right">รวมเป็นเงิน</label>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-primary-700">{currency(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Footer */}
                {/* Footer */}
                {
                    !hideControls && (
                        <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-3 border-t border-secondary-200 bg-white flex-shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 sticky bottom-0 rounded-b-2xl">
                            {isEditing && onDelete && (
                                <button
                                    onClick={() => setShowDeleteItemConfirm(true)}
                                    className="flex-1 px-2 py-2.5 text-sm border border-danger-500 text-danger-500 rounded-lg hover:bg-danger-50 font-medium flex items-center justify-center gap-1"
                                >
                                    <Trash2 size={16} />
                                    ลบ
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="flex-1 px-2 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium flex items-center justify-center"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-2 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center"
                            >
                                บันทึก
                            </button>
                        </div>
                    )
                }
            </div >

            {/* Change Product Confirmation Dialog - DEPRECATED in favor of SweetAlert in selectProduct */}

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
