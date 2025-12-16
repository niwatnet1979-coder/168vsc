import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Wrench, Package, ChevronDown, Search, Plus } from 'lucide-react'
import ProductCard from './ProductCard'
import { currency } from '../lib/utils'
import DataSourceTooltip from './DataSourceTooltip'
import { DataManager } from '../lib/dataManager'

const ProductDetailView = forwardRef(({ product, onEdit, onSave, onClose, productsData = [], hideEditButton = false, className = '', showHeader = true, isEditing = false, isAdding = false }, ref) => {
    // Helper to safety check strings
    const val = (v) => v || '-'

    // Local State for Editing/Adding
    const [formData, setFormData] = useState({})

    // Search State (for Adding)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [showResults, setShowResults] = useState(false)
    const [selectedProductFromSearch, setSelectedProductFromSearch] = useState(null)
    const searchContainerRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const [productOptions, setProductOptions] = useState({
        lightColors: [],
        remotes: [],
        bulbTypes: [],
        crystalColors: []
    })

    // Init Logic
    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                qty: product.qty || 1,
                unitPrice: product.unitPrice || product.price || 0,
                lightColor: product.lightColor || '',
                crystalColor: product.crystalColor || '',
                bulbType: product.bulbType || '',
                remote: product.remote || '',
                remark: product.remark || '',
                selectedVariantIndex: product.selectedVariantIndex,
            })
        } else if (isAdding) {
            setFormData({
                qty: 1,
                unitPrice: 0
            })
        }
    }, [product, isAdding])

    // Load Options if Editing or Adding
    useEffect(() => {
        if (isEditing || isAdding) {
            const loadOptions = async () => {
                const options = await DataManager.getProductOptions()
                if (options) {
                    setProductOptions({
                        lightColors: options.lightColors || ['warm', 'cool', 'white', '3แสง'],
                        remotes: options.remotes || ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
                        bulbTypes: options.bulbTypes || ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module'],
                        crystalColors: options.crystalColors || ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ', 'ใส']
                    })
                }
            }
            loadOptions()
        }
    }, [isEditing, isAdding])

    // Search Logic
    useEffect(() => {
        if (!searchTerm) {
            // Show all (or top 50) products by default when no search term
            setSearchResults(productsData.slice(0, 50))
            return
        }
        const lower = searchTerm.toLowerCase()
        const results = productsData.filter(p =>
            (p.name && p.name.toLowerCase().includes(lower)) ||
            (p.code && p.code.toLowerCase().includes(lower))
        ).slice(0, 50)
        setSearchResults(results)
    }, [searchTerm, productsData])

    // Expose triggerSave to parent
    useImperativeHandle(ref, () => ({
        triggerSave: () => {
            if (onSave) onSave(formData)
        }
    }))

    // Handle Variant Change
    const handleVariantChange = (e) => {
        const idx = e.target.value
        if (idx === "") {
            setFormData(prev => ({ ...prev, selectedVariantIndex: null, selectedVariant: null }))
            return
        }

        const currentProduct = selectedProductFromSearch || product
        const variant = currentProduct.variants[idx]

        if (variant) {
            setFormData(prev => ({
                ...prev,
                selectedVariantIndex: parseInt(idx),
                selectedVariant: variant,
                unitPrice: variant.price || prev.unitPrice,
            }))
        }
    }

    const handleSelectProduct = (p) => {
        setSelectedProductFromSearch(p)
        setFormData({
            ...p,
            // Use the first variant price if available, else product price
            unitPrice: (p.variants && p.variants.length > 0) ? p.variants[0].price : (p.price || 0),
            qty: 1,
            lightColor: '',
            crystalColor: '',
            bulbType: '',
            remote: '',
            remark: '',
            selectedVariantIndex: null
        })
        setSearchTerm('')
        setShowResults(false)
    }

    // Standard View/Edit Mode logic
    const effectiveProduct = selectedProductFromSearch || product

    // Effective display product (safe generation)
    const displayProduct = effectiveProduct ? {
        ...effectiveProduct,
        name: effectiveProduct.name || effectiveProduct.productName,
        product_code: effectiveProduct.code || effectiveProduct.product_code,
        variants: [{
            price: formData.unitPrice || effectiveProduct.unitPrice || effectiveProduct.price || 0,
            stock: effectiveProduct.stock || 0,
            images: [
                effectiveProduct.image_url ||
                effectiveProduct.image ||
                (effectiveProduct.variants && effectiveProduct.variants.length > 0 ? effectiveProduct.variants[0].images?.[0] : null) ||
                ''
            ].filter(Boolean)
        }]
    } : null

    const showEditUI = isEditing || isAdding

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200 h-full min-h-[600px] ${className}`}>
            {showHeader && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-lg font-bold text-secondary-900">
                        <Package className="text-primary-600" size={24} />
                        <h2>{isAdding ? 'ข้อมูลสินค้า' : 'ข้อมูลสินค้า'}</h2>
                    </div>
                    {isAdding && (
                        <div className="flex items-center gap-2">
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-sm font-medium text-secondary-600 hover:text-secondary-800 hover:bg-secondary-100 rounded-lg transition-colors"
                                >
                                    ยกเลิก
                                </button>
                            )}
                            <button
                                onClick={() => onSave && onSave(formData)}
                                disabled={!displayProduct}
                                className={`px-4 py-1.5 text-sm font-bold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${!displayProduct ? 'bg-secondary-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 active:scale-95'}`}
                            >
                                <Package size={16} />
                                เพิ่มสินค้า
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Unified Product Field Container (Active in Add Mode) */}
            {isAdding && (
                <div className="relative mb-6 group">


                    {!selectedProductFromSearch ? (
                        // Search Mode - Standard Input Style (Clean White)
                        <div className="relative group/search" ref={searchContainerRef}>
                            <div
                                className={`flex items-center gap-3 px-3 py-5 transition-all border ${showResults && searchResults.length > 0
                                    ? 'bg-white border-secondary-300 rounded-t-lg rounded-b-none border-b-secondary-100 shadow-sm'
                                    : 'bg-secondary-50 border-transparent rounded-lg hover:bg-secondary-100'
                                    }`}
                            >
                                <Search size={18} className="text-secondary-400 shrink-0" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setShowResults(true)
                                    }}
                                    onClick={() => setShowResults(prev => !prev)}
                                    placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                                    className="w-full bg-transparent border-none p-0 text-sm text-secondary-900 focus:ring-0 focus:outline-none placeholder-secondary-400 font-medium"
                                    autoFocus
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="relative w-full -mt-px z-10 bg-white rounded-lg shadow-lg border border-secondary-200 border-t-0 flex flex-col">
                                    {/* Full height list - No Scrollbar */}
                                    <div className="py-1">
                                        {searchResults.map((p, i) => (
                                            <div
                                                key={i}
                                                onClick={() => handleSelectProduct(p)}
                                                className="px-3 py-2 hover:bg-secondary-50 cursor-pointer flex items-start gap-3 transition-colors border-b border-secondary-100 last:border-0 group/item"
                                            >
                                                {/* Image */}
                                                <div className="w-10 h-10 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0 border border-secondary-200 mt-1">
                                                    <img
                                                        src={p.image || (p.variants?.[0]?.images?.[0]) || '/placeholder.png'}
                                                        alt={p.code}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                    <div className="flex justify-between items-baseline gap-2">
                                                        <span className="font-bold text-primary-600 text-sm group-hover/item:text-primary-700 truncate">
                                                            {p.code}
                                                        </span>
                                                        <span className="font-bold text-primary-600 text-sm whitespace-nowrap shrink-0">
                                                            {currency(p.price)}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-secondary-900 text-sm font-medium truncate">
                                                                {p.name}
                                                            </div>
                                                            <div className="text-secondary-400 text-xs truncate mt-0.5">
                                                                {p.category || '-'} • {p.variants?.length || 0} สี
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 flex flex-col items-end">
                                                            <div className="text-secondary-500 text-[10px] whitespace-nowrap">คงเหลือ {p.stock || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Static Footer: Add New */}
                                    <div
                                        onClick={() => {
                                            setShowResults(false)
                                        }}
                                        className="p-3 bg-secondary-50 hover:bg-secondary-100 cursor-pointer border-t border-secondary-200 text-primary-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors rounded-b-xl"
                                    >
                                        <Plus size={16} />
                                        เพิ่มสินค้าใหม่
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Selected Product Mode
                        <div
                            onClick={() => {
                                if (isAdding) {
                                    setSelectedProductFromSearch(null)
                                    setSearchTerm('')
                                }
                            }}
                            className="relative cursor-pointer group/card"
                        >
                            <DataSourceTooltip isRealtime={false} source="Job Snapshot">
                                <ProductCard
                                    product={displayProduct}
                                    showPrice={true}
                                    showStock={true}
                                    className="hover:border-primary-300 transition-colors border-dashed"
                                />
                            </DataSourceTooltip>

                            {/* Overlay for Re-selection */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-xl backdrop-blur-[1px]">
                                <div className="bg-secondary-900 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg transform scale-95 group-hover/card:scale-100 transition-transform">
                                    <Search size={14} />
                                    <span>แตะเพื่อเปลี่ยน</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* View/Edit Mode (Not Adding) -> Standard Card */}
            {!isAdding && displayProduct && (
                <div className="mb-6">
                    <DataSourceTooltip isRealtime={false} source="Job Snapshot">
                        <ProductCard
                            product={displayProduct}
                            showPrice={true}
                            showStock={true}
                        />
                    </DataSourceTooltip>
                </div>
            )}

            {
                // Only show form if product is selected
                displayProduct ? (
                    <div className="flex-1 space-y-4">
                        {/* Variant */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">Variant</label>
                            <div className="relative">
                                {showEditUI && effectiveProduct.variants && effectiveProduct.variants.length > 0 ? (
                                    <>
                                        <select
                                            value={formData.selectedVariantIndex ?? ''}
                                            onChange={handleVariantChange}
                                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                        >
                                            <option value="">-- เลือก Variant --</option>
                                            {effectiveProduct.variants.map((variant, i) => (
                                                <option key={i} value={i}>
                                                    {variant.color || 'No Color'} • {variant.dimensions?.length || 0}x{variant.dimensions?.width || 0}x{variant.dimensions?.height || 0}cm • {currency(variant.price)} • สต๊อค {variant.stock || 0}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                    </>
                                ) : (
                                    <div className="text-sm font-medium text-secondary-900">
                                        {(() => {
                                            if (effectiveProduct.variantStr) return effectiveProduct.variantStr
                                            // Try to get from selectedVariant object
                                            if (formData.selectedVariant) {
                                                const v = formData.selectedVariant
                                                const parts = []
                                                if (v.color) parts.push(v.color)
                                                if (v.dimensions) parts.push(`${v.dimensions.length || 0}x${v.dimensions.width || 0}x${v.dimensions.height || 0}cm`)
                                                if (v.price) parts.push(currency(v.price))
                                                if (v.stock !== undefined) parts.push(`สต๊อค ${v.stock}`)

                                                if (parts.length > 0) return parts.join(' • ')
                                            }
                                            // Try to get from array index
                                            if (effectiveProduct.selectedVariantIndex !== undefined && effectiveProduct.variants?.length > effectiveProduct.selectedVariantIndex) {
                                                const v = effectiveProduct.variants[effectiveProduct.selectedVariantIndex]
                                                return v.color || 'Selected'
                                            }
                                            return '-'
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grid Options */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Light Color */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">สีแสงไฟ</label>
                                <div className="relative">
                                    {showEditUI ? (
                                        <>
                                            <select
                                                value={formData.lightColor}
                                                onChange={(e) => setFormData({ ...formData, lightColor: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">-- เลือก --</option>
                                                {productOptions.lightColors.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                        </>
                                    ) : (
                                        <DataSourceTooltip isRealtime={false} source="Snapshot Value">
                                            <div className="text-sm text-secondary-900">{val(effectiveProduct.lightColor)}</div>
                                        </DataSourceTooltip>
                                    )}
                                </div>
                            </div>

                            {/* Crystal Color */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">สีคริสตัล</label>
                                <div className="relative">
                                    {showEditUI ? (
                                        <>
                                            <select
                                                value={formData.crystalColor}
                                                onChange={(e) => setFormData({ ...formData, crystalColor: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">-- เลือก --</option>
                                                {productOptions.crystalColors.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                        </>
                                    ) : (
                                        <DataSourceTooltip isRealtime={false} source="Snapshot Value">
                                            <div className="text-sm text-secondary-900">{val(effectiveProduct.crystalColor)}</div>
                                        </DataSourceTooltip>
                                    )}
                                </div>
                            </div>

                            {/* Bulb Type */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทหลอดไฟ</label>
                                <div className="relative">
                                    {showEditUI ? (
                                        <>
                                            <select
                                                value={formData.bulbType}
                                                onChange={(e) => setFormData({ ...formData, bulbType: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">-- เลือก --</option>
                                                {productOptions.bulbTypes.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                        </>
                                    ) : (
                                        <div className="text-sm text-secondary-900">{val(effectiveProduct.bulbType)}</div>
                                    )}
                                </div>
                            </div>

                            {/* Remote */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">รีโมท</label>
                                <div className="relative">
                                    {showEditUI ? (
                                        <>
                                            <select
                                                value={formData.remote}
                                                onChange={(e) => setFormData({ ...formData, remote: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                            >
                                                <option value="">-- เลือก --</option>
                                                {productOptions.remotes.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                                        </>
                                    ) : (
                                        <div className="text-sm text-secondary-900">{val(effectiveProduct.remote)}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Remark */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">หมายเหตุ</label>
                            <div className="relative">
                                {showEditUI ? (
                                    <textarea
                                        value={formData.remark}
                                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                        rows={1}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 resize-none placeholder-secondary-400"
                                        placeholder="..."
                                    />
                                ) : (
                                    <div className="text-sm text-secondary-900">{val(effectiveProduct.remark)}</div>
                                )}
                            </div>
                        </div>

                        {/* Price Calculation (Editable Qty/Price) */}
                        <div className="border-t border-secondary-200 pt-3 flex justify-between items-center bg-white">
                            {showEditUI ? (
                                <div className="flex gap-4 w-full">
                                    {/* Qty */}
                                    <div className="flex-1 bg-secondary-50 p-2 rounded-lg border border-secondary-100">
                                        <label className="block text-[10px] text-secondary-500 mb-0.5">จำนวน</label>
                                        <input
                                            type="number"
                                            value={formData.qty}
                                            onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 text-center"
                                        />
                                    </div>
                                    {/* Unit Price */}
                                    <div className="flex-1 bg-secondary-50 p-2 rounded-lg border border-secondary-100">
                                        <label className="block text-[10px] text-secondary-500 mb-0.5">ราคา/หน่วย</label>
                                        <input
                                            type="number"
                                            value={formData.unitPrice}
                                            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 text-center"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-secondary-600">
                                    {effectiveProduct.qty || 1} x {currency(effectiveProduct.unitPrice || effectiveProduct.price)}
                                </div>
                            )}

                            <div className={`${showEditUI ? 'ml-4 flex items-end pb-2' : ''}`}>
                                <DataSourceTooltip isRealtime={false} source="Calculated Snapshot">
                                    <div className="text-lg font-bold text-primary-600">
                                        {currency((formData.qty || effectiveProduct.qty || 1) * (formData.unitPrice || effectiveProduct.unitPrice || effectiveProduct.price || 0))}
                                    </div>
                                </DataSourceTooltip>
                            </div>
                        </div>
                    </div>
                ) : null
            }

            {/* Edit Button - Only show if standard view and not editing and NOT adding */}
            {!hideEditButton && !showEditUI && (
                <div className="mt-6">
                    <button
                        onClick={onEdit}
                        className="w-full py-2.5 bg-white border border-secondary-300 text-secondary-700 font-medium rounded-lg hover:bg-secondary-50 flex items-center justify-center gap-2"
                    >
                        <Wrench size={18} />
                        แก้ไขข้อมูล
                    </button>
                </div>
            )}
        </div>
    )
})

export default ProductDetailView
