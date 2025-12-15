import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Wrench, Package, ChevronDown } from 'lucide-react'
import ProductCard from './ProductCard'
import { currency } from '../lib/utils'
import DataSourceTooltip from './DataSourceTooltip'
import { DataManager } from '../lib/dataManager'

const ProductDetailView = forwardRef(({ product, onEdit, onSave, hideEditButton = false, className = '', showHeader = true, isEditing = false }, ref) => {
    if (!product) return null

    // Helper to safety check strings
    const val = (v) => v || '-'

    // Local State for Editing
    const [formData, setFormData] = useState({})
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
                // Ensure text fields are strings
                lightColor: product.lightColor || '',
                crystalColor: product.crystalColor || '',
                bulbType: product.bulbType || '',
                remote: product.remote || '',
                remark: product.remark || '',
                // Variant logic might need refinement if editing changes variant
                selectedVariantIndex: product.selectedVariantIndex,
            })
        }
    }, [product])

    // Load Options if Editing
    useEffect(() => {
        if (isEditing) {
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
    }, [isEditing])

    // Expose triggerSave to parent
    useImperativeHandle(ref, () => ({
        triggerSave: () => {
            if (onSave) onSave(formData)
        }
    }))

    // Handle Variant Change in Edit Mode (Simple version: just updating index if variants exist)
    const handleVariantChange = (e) => {
        const idx = e.target.value
        if (idx === "") {
            setFormData(prev => ({ ...prev, selectedVariantIndex: null, selectedVariant: null }))
            return
        }

        const variant = product.variants[idx]
        if (variant) {
            setFormData(prev => ({
                ...prev,
                selectedVariantIndex: parseInt(idx),
                selectedVariant: variant,
                // Auto-update price/stock/image if new variant selected?
                // For now, let's keep it simple or minimal logic. 
                // Usually user expects price to update.
                unitPrice: variant.price || prev.unitPrice,
                // image: variant.images?.[0] || prev.image // Image logic might be complex
            }))
        }
    }


    // Construct a display product that forces the resolved image/price/stock
    // This represents the "Job Item" rather than the "Catalog Product"
    const displayProduct = {
        ...product,
        name: product.name || product.productName,
        product_code: product.code || product.productId,
        variants: [{
            price: formData.unitPrice || product.unitPrice || product.price || 0, // Show live price in edit
            stock: product.stock || 0,
            images: [
                product.image_url ||
                product.image ||
                (product.variants && product.variants.length > 0 ? product.variants[0].images?.[0] : null) ||
                ''
            ].filter(Boolean)
        }]
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200 ${className}`}>
            {showHeader && (
                <div className="flex items-center gap-2 text-lg font-bold text-secondary-900 mb-4">
                    <Package className="text-primary-600" size={24} />
                    <h2>ข้อมูลสินค้า</h2>
                </div>
            )}

            {/* Product Card Summary */}
            <div className="mb-4">
                <DataSourceTooltip isRealtime={false} source="Job Snapshot">
                    <ProductCard
                        product={displayProduct}
                        showPrice={true}
                        showStock={true}
                    />
                </DataSourceTooltip>
            </div>

            <div className="flex-1 space-y-4">
                {/* Variant */}
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                    <label className="block text-xs font-medium text-secondary-500 mb-1">Variant</label>
                    <div className="relative">
                        {isEditing && product.variants && product.variants.length > 0 ? (
                            <>
                                <select
                                    value={formData.selectedVariantIndex ?? ''}
                                    onChange={handleVariantChange}
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                >
                                    <option value="">-- เลือก Variant --</option>
                                    {product.variants.map((variant, i) => (
                                        <option key={i} value={i}>
                                            {variant.color} • {variant.dimensions?.length || 0}x{variant.dimensions?.width || 0}x{variant.dimensions?.height || 0}cm ({currency(variant.price)})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                            </>
                        ) : (
                            <div className="text-sm font-medium text-secondary-900">
                                {(() => {
                                    if (product.variantStr) return product.variantStr
                                    // Try to get from selectedVariant object
                                    if (formData.selectedVariant) { // Use formData for immediate feedback
                                        const v = formData.selectedVariant
                                        const parts = []
                                        if (v.color) parts.push(v.color)
                                        if (v.dimensions) parts.push(`${v.dimensions.length || 0}x${v.dimensions.width || 0}x${v.dimensions.height || 0}cm`)
                                        if (parts.length > 0) return parts.join(' • ')
                                    }
                                    // Try to get from array index
                                    if (product.selectedVariantIndex !== undefined && product.variants?.length > product.selectedVariantIndex) {
                                        const v = product.variants[product.selectedVariantIndex]
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
                            {isEditing ? (
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
                                    <div className="text-sm text-secondary-900">{val(product.lightColor)}</div>
                                </DataSourceTooltip>
                            )}
                        </div>
                    </div>

                    {/* Crystal Color */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">สีคริสตัล</label>
                        <div className="relative">
                            {isEditing ? (
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
                                    <div className="text-sm text-secondary-900">{val(product.crystalColor)}</div>
                                </DataSourceTooltip>
                            )}
                        </div>
                    </div>

                    {/* Bulb Type */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทหลอดไฟ</label>
                        <div className="relative">
                            {isEditing ? (
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
                                <div className="text-sm text-secondary-900">{val(product.bulbType)}</div>
                            )}
                        </div>
                    </div>

                    {/* Remote */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">รีโมท</label>
                        <div className="relative">
                            {isEditing ? (
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
                                <div className="text-sm text-secondary-900">{val(product.remote)}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Remark */}
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                    <label className="block text-xs font-medium text-secondary-500 mb-1">หมายเหตุ</label>
                    <div className="relative">
                        {isEditing ? (
                            <textarea
                                value={formData.remark}
                                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                rows={1}
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 resize-none placeholder-secondary-400"
                                placeholder="..."
                            />
                        ) : (
                            <div className="text-sm text-secondary-900">{val(product.remark)}</div>
                        )}
                    </div>
                </div>

                {/* Price Calculation (Editable Qty/Price) */}
                <div className="border-t border-secondary-200 pt-3 flex justify-between items-center bg-white">
                    {isEditing ? (
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
                            {product.qty || 1} x {currency(product.unitPrice || product.price)}
                        </div>
                    )}

                    <div className={`${isEditing ? 'ml-4 flex items-end pb-2' : ''}`}>
                        <DataSourceTooltip isRealtime={false} source="Calculated Snapshot">
                            <div className="text-lg font-bold text-primary-600">
                                {currency((formData.qty || product.qty || 1) * (formData.unitPrice || product.unitPrice || product.price || 0))}
                            </div>
                        </DataSourceTooltip>
                    </div>
                </div>
            </div>

            {/* Edit Button - Only show if standard view and not editing */}
            {!hideEditButton && !isEditing && (
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
