import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2, Search, Wrench, Truck, HelpCircle, ChevronRight, Package, Plus, User, MapPin, Calendar, Box, Palette, Zap, Power } from 'lucide-react'
import { currency } from '../lib/utils'
import { DataManager } from '../lib/dataManager'


export default function OrderItemModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    item = null,
    productsData = [],
    isEditing = false,

    onOpenSubJob, // Callback to open the sub-job modal
    onAddNewProduct, // Callback to open new product modal
    lastCreatedProduct = null,
    onConsumeLastCreatedProduct
}) {
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', qty: 1, unitPrice: 0, image: null,
        category: '', subcategory: '', subJob: null, _searchTerm: '',
        lightColor: '', remote: '', bulbType: '', crystalColor: '', remark: '',
        selectedVariant: null
    })

    const [showSearchPopup, setShowSearchPopup] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [productVariants, setProductVariants] = useState([])

    const [productOptions, setProductOptions] = useState({
        lightColors: [],
        remotes: [],
        bulbTypes: [],
        crystalColors: []
    })

    useEffect(() => {
        if (isOpen) {
            // Load Product Options from Supabase
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
                    // Fallback to defaults
                    setProductOptions({
                        lightColors: ['warm', 'cool', 'white', '3แสง'],
                        remotes: ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
                        bulbTypes: ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module'],
                        crystalColors: ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ', 'ใส']
                    })
                }
            }
            loadOptions()

            if (item) {
                setFormData({
                    ...item,
                    _searchTerm: item.name || '',
                    lightColor: item.lightColor || '',
                    remote: item.remote || '',
                    bulbType: item.bulbType || '',
                    crystalColor: item.crystalColor || '',
                    remark: item.remark || ''
                })

                // Load variants for the product
                if (item.code && productsData) {
                    const product = productsData.find(p => p.id === item.code)
                    if (product && product.variants) {
                        setProductVariants(product.variants)
                    }
                }
            } else {
                // Reset for new item
                setFormData({
                    code: '',
                    name: '',
                    description: '',
                    qty: 1,
                    unitPrice: 0,
                    image: null,
                    category: '',
                    subcategory: '',
                    subJob: null,
                    _searchTerm: '',
                    lightColor: '',
                    remote: '',
                    bulbType: '',
                    crystalColor: '',
                    remark: ''
                })
            }
        }
    }, [item, isOpen])

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
        if (showSearchPopup && formData._searchTerm !== undefined) {
            const term = formData._searchTerm
            if (term.trim()) {
                const lowerTerm = term.toLowerCase()
                const results = productsData.filter(p =>
                    JSON.stringify(p).toLowerCase().includes(lowerTerm)
                )
                setSearchResults(results)
            } else {
                // Show all (or first 50) if no search term
                setSearchResults(productsData.slice(0, 50))
            }
        } else {
            setSearchResults([])
        }
    }, [formData._searchTerm, showSearchPopup, productsData])

    const selectProduct = (product) => {
        // Set product variants if available
        setProductVariants(product.variants || [])

        // Calculate base price from first variant only (product.price is deprecated)
        const basePrice = (product.variants?.[0]?.price) || 0

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
            discount: prev.discount || 0,

            // Reset variant selection
            selectedVariant: null,
            _searchTerm: product.name,
        }))
        setShowSearchPopup(false)
    }

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
                    image: variant.images?.[0] || prev.image
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
            // If variant selected, use its data
            color: formData.selectedVariant?.color || '',
            stock: formData.selectedVariant?.stock || 0,
            dimensions: formData.selectedVariant?.dimensions || null,
            // unitPrice already set from variant
        }

        console.log('[OrderItemModal] Saving item:', itemData)

        onSave(itemData)
        onClose()
    }

    if (!isOpen) return null

    const total = (Number(formData.qty) || 0) * (Number(formData.unitPrice) || 0)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-[512px] h-[600px] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between z-10">
                    <h2 className="text-lg font-bold text-secondary-900">
                        {isEditing ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้า'}
                    </h2>
                    <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0">
                    {/* Product Search / Selected Item */}
                    <div className="relative">
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                            สินค้า <span className="text-danger-500">*</span>
                        </label>

                        {formData.code ? (
                            <div className="bg-white border-2 border-primary-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-3 flex items-start gap-3">
                                    {/* Product Image */}
                                    <div className="w-16 h-16 flex-shrink-0 bg-secondary-100 rounded overflow-hidden">
                                        {formData.image ? (
                                            <img
                                                src={formData.image}
                                                alt={formData.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={24} className="text-secondary-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info - 3 Lines */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        {/* Line 1: Product Code */}
                                        <div className="font-bold text-primary-600 text-base truncate">
                                            {formData.product_code || formData.code}
                                        </div>

                                        {/* Line 2: Name • Category • Subcategory • Material • Dimensions • Color Count */}
                                        <div className="text-sm text-secondary-700 truncate">
                                            {formData.name && <span>{formData.name}</span>}
                                            {formData.category && <span> • {formData.category}</span>}
                                            {formData.subcategory && <span> • {formData.subcategory}</span>}
                                            {formData.material && <span> • {formData.material}</span>}
                                            {(formData.length || formData.width || formData.height) && (
                                                <span> • {[formData.width, formData.length, formData.height].filter(Boolean).join('×')} cm</span>
                                            )}
                                            {productVariants.length > 0 && (
                                                <span> 🎨 {productVariants.length} สี</span>
                                            )}
                                        </div>

                                        {/* Line 3: Description */}
                                        <div className="text-sm text-secondary-500 truncate">
                                            {formData.description || ''}
                                        </div>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            code: '', name: '', unitPrice: 0, _searchTerm: '', description: '',
                                            image: null, length: '', width: '', height: '',
                                            material: '', color: '', crystalColor: '',
                                            bulbType: '', light: '', remote: '', category: '', subcategory: '',
                                            selectedVariant: null
                                        }))}
                                        className="p-1.5 text-secondary-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-all flex-shrink-0"
                                        title="เลือกสินค้าใหม่"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-secondary-400" size={18} />
                                <input
                                    type="text"
                                    value={formData._searchTerm}
                                    onChange={(e) => {
                                        setFormData({ ...formData, _searchTerm: e.target.value })
                                        setShowSearchPopup(true)
                                    }}
                                    onFocus={() => setShowSearchPopup(true)}
                                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                                    placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                                />

                                {/* Search Popup */}
                                {showSearchPopup && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                    {formData.code && (
                        <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200 space-y-4">
                            {/* Row 1: Variant (full width if exists) - MOST IMPORTANT */}
                            {productVariants.length > 0 && (
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                                        Variant
                                    </label>
                                    <select
                                        value={formData.selectedVariantIndex ?? ''}
                                        onChange={(e) => handleVariantSelect(e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="">-- เลือก Variant --</option>
                                        {productVariants.map((variant, i) => (
                                            <option key={i} value={i}>
                                                {variant.color} • {variant.dimensions ? `${variant.dimensions.length}×${variant.dimensions.width}×${variant.dimensions.height}cm` : 'ไม่ระบุขนาด'} • ฿{variant.price?.toLocaleString()} • สต็อค {variant.stock || 0}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Row 2: Light Color, Crystal Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">สีแสงไฟ</label>
                                    <select
                                        value={formData.lightColor}
                                        onChange={(e) => setFormData({ ...formData, lightColor: e.target.value })}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="">-- เลือกสีแสงไฟ --</option>
                                        {productOptions.lightColors.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">สีคริสตัล</label>
                                    <select
                                        value={formData.crystalColor}
                                        onChange={(e) => setFormData({ ...formData, crystalColor: e.target.value })}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="">-- เลือกสีคริสตัล --</option>
                                        {productOptions.crystalColors.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 3: Bulb Type, Remote */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Bulb Type */}
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">
                                        ประเภทหลอดไฟ
                                    </label>
                                    <select
                                        value={formData.bulbType}
                                        onChange={(e) => setFormData({ ...formData, bulbType: e.target.value })}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="">เลือกประเภทหลอด</option>
                                        {productOptions.bulbTypes.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">รีโมท</label>
                                    <select
                                        value={formData.remote}
                                        onChange={(e) => setFormData({ ...formData, remote: e.target.value })}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="">-- เลือกรีโมท --</option>
                                        {productOptions.remotes.map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">หมายเหตุ</label>
                                <input
                                    type="text"
                                    value={formData.remark}
                                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Quantity, Price & Total - Single Row */}
                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-3">
                            <label className="block text-xs font-medium text-secondary-700 mb-1">จำนวน</label>
                            <input
                                type="number"
                                value={formData.qty}
                                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right text-sm"
                                min="1"
                            />
                        </div>
                        <div className="col-span-4">
                            <label className="block text-xs font-medium text-secondary-700 mb-1">ราคา/หน่วย</label>
                            <input
                                type="number"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right text-sm"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="block text-xs font-medium text-secondary-700 mb-1 text-right">รวมเป็นเงิน</label>
                            <div className="w-full px-3 py-2 bg-primary-50 border border-primary-100 rounded-lg text-right">
                                <span className="text-sm font-bold text-primary-700">{currency(total)}</span>
                            </div>
                        </div>
                    </div>



                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-secondary-200 px-4 py-3 flex gap-2 justify-between z-10">
                    <div>
                        {isEditing && onDelete && (
                            <button
                                onClick={() => {
                                    if (confirm('ต้องการลบรายการนี้?')) {
                                        onDelete()
                                        onClose()
                                    }
                                }}
                                className="px-4 py-2 text-sm border border-danger-500 text-danger-500 rounded-lg hover:bg-danger-50 font-medium flex items-center gap-1"
                            >
                                <Trash2 size={16} />
                                ลบ
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-secondary-300 rounded-lg hover:bg-secondary-50 font-medium"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                        >
                            บันทึก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
