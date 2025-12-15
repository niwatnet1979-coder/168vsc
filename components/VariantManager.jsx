import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Camera, X, Save, Scaling, Palette, Gem } from 'lucide-react'
import { DataManager } from '../lib/dataManager'

export default function VariantManager({
    baseProductId,
    variants = [],
    onChange,
    materialColors = [],
    crystalColors = [],
    mainProductColor = '',
    productName = '',
    description = '',
    material = ''
}) {
    const [editingIndex, setEditingIndex] = useState(null)
    const [variantForm, setVariantForm] = useState({
        color: '',
        crystalColor: '',
        dimensions: {
            length: '',
            width: '',
            height: ''
        },
        price: '',
        price: '',
        stock: '',
        minStock: '',
        images: []
    })

    // Note: Variant ID is NOT stored, it's computed dynamically as: {product_code}-{colorCode}
    // This ensures variant IDs always reflect the current product_code

    const handleAddVariant = () => {
        setEditingIndex(variants.length)
        setVariantForm({
            color: '',
            crystalColor: '',
            dimensions: {
                length: '',
                width: '',
                height: ''
            },
            price: '',
            price: '',
            stock: '',
            minStock: '',
            images: []
        })
    }

    const handleEditVariant = (index) => {
        setEditingIndex(index)
        setVariantForm({ ...variants[index] })
    }

    const handleSaveVariant = () => {
        // Validation
        if (!variantForm.color) {
            alert('กรุณาเลือกสี')
            return
        }

        // Check for duplicate color (only when adding new, not editing)
        if (editingIndex >= variants.length) {
            const colorExists = variants.some(v => v.color === variantForm.color)
            if (colorExists) {
                alert(`สี "${variantForm.color}" มีอยู่แล้ว\nกรุณาเลือกสีอื่น`)
                return
            }
        }

        const newVariant = {
            color: variantForm.color,
            crystalColor: variantForm.crystalColor || '',
            dimensions: {
                length: variantForm.dimensions?.length || '',
                width: variantForm.dimensions?.width || '',
                height: variantForm.dimensions?.height || ''
            },
            price: parseFloat(variantForm.price) || 0,
            price: parseFloat(variantForm.price) || 0,
            stock: parseInt(variantForm.stock) || 0,
            minStock: parseInt(variantForm.minStock) || 0,
            images: variantForm.images || []
            // NOTE: No 'id' field - it will be computed dynamically when needed
        }

        const newVariants = [...variants]
        if (editingIndex < variants.length) {
            newVariants[editingIndex] = newVariant
        } else {
            newVariants.push(newVariant)
        }

        onChange(newVariants)
        setEditingIndex(null)
        setVariantForm({
            color: '',
            crystalColor: '',
            dimensions: {
                length: '',
                width: '',
                height: ''
            },
            price: '',
            price: '',
            stock: '',
            minStock: '',
            images: []
        })
    }

    const handleDeleteVariant = (index) => {
        if (confirm('ลบ variant นี้?')) {
            const newVariants = variants.filter((_, i) => i !== index)
            onChange(newVariants)
        }
    }

    const handleImageUpload = async (e, imageIndex) => {
        const file = e.target.files?.[0]
        if (file && baseProductId) {
            const imageUrl = await DataManager.uploadProductImage(file, baseProductId)
            if (imageUrl) {
                const newImages = [...(variantForm.images || [])]
                newImages[imageIndex] = imageUrl
                setVariantForm({ ...variantForm, images: newImages })
            } else {
                alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ')
            }
        }
    }

    const handleRemoveImage = (imageIndex) => {
        const newImages = [...(variantForm.images || [])]
        newImages.splice(imageIndex, 1)
        setVariantForm({ ...variantForm, images: newImages })
    }

    if (!baseProductId) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">กรุณาเลือกประเภทสินค้าก่อนเพื่อสร้างรหัสสินค้า</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                {editingIndex === null && (
                    <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={16} />
                        เพิ่ม Variant
                    </button>
                )}
            </div>

            {/* Variant List */}
            {editingIndex === null && variants.length > 0 && (
                <div className="space-y-3">
                    {variants.map((variant, index) => {
                        // Helper to generate SKU
                        const getColorCode = (colorName) => {
                            if (!colorName) return 'XX'

                            // Check for direct English matches or known codes in string
                            if (colorName.includes('Gold') || colorName.includes('GD')) return 'GD'

                            // Map Thai names to codes
                            if (colorName.includes('ทองเหลือง')) return 'BS' // Brass
                            if (colorName.includes('ทอง')) return 'GD'
                            if (colorName.includes('โรสโกลด์') || colorName.includes('พิงค์โกลด์') || colorName.includes('PG')) return 'PG' // Pink Gold/Rose Gold
                            if (colorName.includes('เงิน')) return 'SL'
                            if (colorName.includes('ดำ')) return 'BK'
                            if (colorName.includes('ขาว')) return 'WH'
                            if (colorName.includes('ใส')) return 'CL'
                            if (colorName.includes('โครเมียม')) return 'CH'
                            if (colorName.includes('สนิม')) return 'RZ'
                            if (colorName.includes('ไม้')) return 'WD'

                            // Default fallback - take first 2 chars upper 
                            // (But for unknown colors better to have a generic code or stick to XX?)
                            return 'XX'
                        }

                        const getCrystalCode = (colorName) => {
                            if (!colorName) return null
                            if (colorName.includes('ใส')) return 'CL'
                            if (colorName.includes('ทอง')) return 'GD'
                            if (colorName.includes('ชา')) return 'TEA'
                            if (colorName.includes('ควันบุหรี่')) return 'SM' // Smoke
                            return 'XX'
                        }

                        const generateSKU = () => {
                            // AA009-D20x20x50-GD-CL
                            let sku = baseProductId || 'XXXXX'

                            // Dimensions
                            if (variant.dimensions && (variant.dimensions.length || variant.dimensions.width || variant.dimensions.height)) {
                                const l = variant.dimensions.length || '0'
                                const w = variant.dimensions.width || '0'
                                const h = variant.dimensions.height || '0'
                                sku += `-D${l}x${w}x${h}`
                            }

                            // Color
                            sku += `-${getColorCode(variant.color)}`

                            // Crystal
                            if (variant.crystalColor) {
                                const cCode = getCrystalCode(variant.crystalColor)
                                if (cCode) sku += `-${cCode}`
                            }

                            return sku
                        }

                        const generatedSKU = generateSKU()

                        return (
                            <div key={index} className="flex bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                {/* Left: Image */}
                                <div className="w-24 h-24 sm:w-32 sm:h-auto bg-gray-50 flex-shrink-0 border-r border-secondary-100 flex items-center justify-center p-2">
                                    {variant.images && variant.images.length > 0 ? (
                                        <img
                                            src={variant.images[0]}
                                            alt={`Variant ${index + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="text-secondary-300 flex flex-col items-center gap-1">
                                            <Camera size={24} />
                                            <span className="text-[10px]">No Image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Details */}
                                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                                    <div>
                                        {/* Header: SKU */}
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-bold text-secondary-900 text-lg sm:text-lg font-mono tracking-tight truncate" title={generatedSKU}>
                                                {generatedSKU}
                                            </h3>

                                            {/* Actions */}
                                            <div className="flex gap-1 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditVariant(index)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteVariant(index)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Details Line 1: Name, Material, Dimensions, Colors */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-secondary-600">
                                            <span className="font-medium text-secondary-900">{productName || 'สินค้าใหม่'}</span>

                                            {material && (
                                                <>
                                                    <span className="text-secondary-300">•</span>
                                                    <span>{material}</span>
                                                </>
                                            )}

                                            {variant.dimensions && (
                                                <>
                                                    <span className="text-secondary-300">•</span>
                                                    <div className="flex items-center gap-1" title="Dimensions">
                                                        <Scaling size={12} className="text-secondary-400" />
                                                        <span className="font-mono text-xs">
                                                            {variant.dimensions.length}x{variant.dimensions.width}x{variant.dimensions.height}cm
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                            <span className="text-secondary-300">•</span>
                                            <div className="flex items-center gap-1" title="Color">
                                                <Palette size={12} className="text-secondary-400" />
                                                <span>{variant.color}</span>
                                            </div>

                                            {variant.crystalColor && (
                                                <>
                                                    <span className="text-secondary-300">•</span>
                                                    <div className="flex items-center gap-1" title="Crystal Color">
                                                        <Gem size={12} className="text-secondary-400" />
                                                        <span>{variant.crystalColor}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {description && (
                                            <p className="text-xs text-secondary-500 mt-1 truncate">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Variant Form */}
            {editingIndex !== null && (
                <div className="p-6 bg-white border-2 border-primary-500 rounded-lg space-y-4">
                    <h4 className="font-semibold text-secondary-900">
                        {editingIndex < variants.length ? 'แก้ไข' : 'เพิ่ม'} Variant
                    </h4>






                    {/* Dimensions */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            ขนาด (cm)
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-secondary-600 mb-1">ยาว (L)</label>
                                <input
                                    type="number"
                                    value={variantForm.dimensions?.length || ''}
                                    onChange={(e) => setVariantForm({
                                        ...variantForm,
                                        dimensions: {
                                            ...variantForm.dimensions,
                                            length: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-secondary-600 mb-1">กว้าง (W)</label>
                                <input
                                    type="number"
                                    value={variantForm.dimensions?.width || ''}
                                    onChange={(e) => setVariantForm({
                                        ...variantForm,
                                        dimensions: {
                                            ...variantForm.dimensions,
                                            width: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-secondary-600 mb-1">สูง (H)</label>
                                <input
                                    type="number"
                                    value={variantForm.dimensions?.height || ''}
                                    onChange={(e) => setVariantForm({
                                        ...variantForm,
                                        dimensions: {
                                            ...variantForm.dimensions,
                                            height: e.target.value
                                        }
                                    })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Color & Crystal Color */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Color */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                สี <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={variantForm.color}
                                onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                required
                            >
                                <option value="">เลือกสี</option>
                                {materialColors.map((color, i) => {
                                    // Check if this is the current variant's color (when editing)
                                    const isCurrentColor = editingIndex < variants.length && variants[editingIndex]?.color === color

                                    // Check if color is used by main product
                                    // Handle cases where:
                                    // - dropdown color: "GD ทอง" but mainProductColor: "ทอง"
                                    // - OR exact match: "ทอง" === "ทอง"
                                    const isMainProductColor = mainProductColor && (
                                        color === mainProductColor || // Exact match
                                        color.includes(mainProductColor) || // Dropdown has prefix (e.g., "GD ทอง" includes "ทอง")
                                        mainProductColor.includes(color) // Main product has prefix (unlikely but safe)
                                    )

                                    // Check if color is used by other variants
                                    const usedByOtherVariants = variants
                                        .filter((_, idx) => idx !== editingIndex)
                                        .some(v =>
                                            v.color === color ||
                                            color.includes(v.color) ||
                                            v.color.includes(color)
                                        )

                                    // Disable if used by main product or other variants (but not if it's current color)
                                    const isDisabled = !isCurrentColor && (isMainProductColor || usedByOtherVariants)

                                    return (
                                        <option
                                            key={i}
                                            value={color}
                                            disabled={isDisabled}
                                            style={isDisabled ? { color: '#9ca3af' } : {}}
                                        >
                                            {color}{isDisabled ? ' (ใช้แล้ว)' : ''}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>

                        {/* Crystal Color */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">
                                สีคริสตัล
                            </label>
                            <select
                                value={variantForm.crystalColor}
                                onChange={(e) => setVariantForm({ ...variantForm, crystalColor: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">เลือกสีคริสตัล (ถ้ามี)</option>
                                {crystalColors.map((color, i) => (
                                    <option key={i} value={color}>{color}</option>
                                ))}
                            </select>
                        </div>
                    </div>



                    {/* Price & Min Stock */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">ราคา (บาท)</label>
                            <input
                                type="number"
                                value={variantForm.price}
                                onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">จุดสั่งซื้อ (Min)</label>
                            <input
                                type="number"
                                value={variantForm.minStock}
                                onChange={(e) => setVariantForm({ ...variantForm, minStock: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">รูปภาพ (สูงสุด 3 รูป)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((index) => (
                                <div key={index} className="relative aspect-square border-2 border-dashed border-secondary-300 rounded-lg overflow-hidden hover:border-primary-500 transition-colors">
                                    {variantForm.images && variantForm.images[index] ? (
                                        <>
                                            <img
                                                src={variantForm.images[index]}
                                                alt={`Variant ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-secondary-50">
                                            <Camera size={24} className="text-secondary-400 mb-1" />
                                            <span className="text-xs text-secondary-500">เพิ่มรูป</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleImageUpload(e, index)}
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleSaveVariant}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            <Save size={16} />
                            บันทึก Variant
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditingIndex(null)}
                            className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-lg hover:bg-secondary-300 transition-colors"
                        >
                            ยกเลิก
                        </button>
                    </div>
                </div>
            )}

            {variants.length === 0 && editingIndex === null && (
                <div className="p-8 text-center bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-300">
                    <p className="text-secondary-600">ยังไม่มีข้อมูล Variant ของสินค้านี้</p>
                    <p className="text-sm text-secondary-500 mt-1">คลิก "เพิ่ม Variant" เพื่อเพิ่มข้อมูลสินค้า</p>
                </div>
            )}
        </div>
    )
}
