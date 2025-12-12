import React, { useState, useEffect } from 'react'
import { X, Camera, Trash2 } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import VariantManager from './VariantManager'

export default function ProductModal({ isOpen, onClose, product, onSave, existingProducts = [] }) {
    const [formData, setFormData] = useState({
        id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
        length: '', width: '', height: '', material: '', color: '',
        variants: [],
        images: []
    })

    const [productTypes, setProductTypes] = useState([])
    const [materials, setMaterials] = useState([])
    const [materialColors, setMaterialColors] = useState([])

    const defaultProductTypes = [
        'XX ไม่ระบุ',
        'AA โคมไฟระย้า',
        'AC โคมไฟโถงสูง',
        'AB โคมไฟแขวนโต้ะทานข้าว',
        'LP โคมไฟเดี่ยว',
        'MM โคมไฟโมเดิ้ล',
        'WL โคมไฟกริ่ง',
        'IN โคมไฟเพดาล',
        'RM รีโมท',
        'GI ของขวัญ',
        'DV Driver',
        'LM หลอดไฟ',
        'K9 คริสตัล'
    ]

    const defaultMaterials = ['สแตนเลส', 'เหล็ก', 'อะคริลิก', 'พลาสติก', 'ไม้']
    const defaultMaterialColors = ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ']

    useEffect(() => {
        const loadOptions = async () => {
            const options = await DataManager.getProductOptions()
            if (options) {
                setProductTypes(options.productTypes && options.productTypes.length > 0 ? options.productTypes : defaultProductTypes)
                setMaterials(options.materials && options.materials.length > 0 ? options.materials : defaultMaterials)
                setMaterialColors(options.materialColors && options.materialColors.length > 0 ? options.materialColors : defaultMaterialColors)
            } else {
                // Fallback to defaults
                setProductTypes(defaultProductTypes)
                setMaterials(defaultMaterials)
                setMaterialColors(defaultMaterialColors)
                setCrystalColors(defaultCrystalColors)
            }
        }
        loadOptions()
    }, [])

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                variants: product.variants || [],
                images: product.images || []
            })
        } else {
            setFormData({
                id: '', category: '', name: '', subcategory: '', price: '', stock: '', description: '',
                length: '', width: '', height: '', material: '', color: '',
                variants: [],
                images: []
            })
        }
    }, [product, isOpen])

    // Auto-generate Product Code based on category, dimensions, and material
    useEffect(() => {
        // Generate product_code whenever category, dimensions, or material changes
        if (formData.category) {
            const prefix = formData.category.substring(0, 2).toUpperCase()

            // Validate prefix is 2 letters/chars
            if (prefix.length === 2 && prefix !== 'XX') {
                // Determine base code
                let baseCode = ''

                if (product && product.product_code) {
                    // Editing existing product
                    const parts = product.product_code.split('-')
                    const existingBaseCode = parts[0] // e.g., "AA001"
                    const existingPrefix = existingBaseCode.substring(0, 2) // e.g., "AA"

                    // If category prefix changed, generate new base code
                    if (existingPrefix === prefix) {
                        // Same category - keep existing base code
                        baseCode = existingBaseCode
                    } else {
                        // Category changed - generate new base code for new category
                        let maxNum = 0
                        existingProducts.forEach(p => {
                            const checkId = p.product_code || p.id
                            if (checkId && checkId.startsWith(prefix)) {
                                const parts = checkId.split('-')
                                const basePart = parts[0]
                                const numPart = basePart.substring(2)
                                if (/^\d+$/.test(numPart)) {
                                    const num = parseInt(numPart, 10)
                                    if (num > maxNum) maxNum = num
                                }
                            }
                        })
                        const nextNum = maxNum + 1
                        baseCode = `${prefix}${nextNum.toString().padStart(3, '0')}`
                    }
                } else {
                    // New product - generate new base code
                    let maxNum = 0

                    existingProducts.forEach(p => {
                        const checkId = p.product_code || p.id
                        if (checkId && checkId.startsWith(prefix)) {
                            const parts = checkId.split('-')
                            const basePart = parts[0]
                            const numPart = basePart.substring(2)

                            if (/^\d+$/.test(numPart)) {
                                const num = parseInt(numPart, 10)
                                if (num > maxNum) maxNum = num
                            }
                        }
                    })

                    const nextNum = maxNum + 1
                    baseCode = `${prefix}${nextNum.toString().padStart(3, '0')}`
                }

                // Extract material code
                let materialCode = ''
                if (formData.material) {
                    const materialParts = formData.material.trim().split(' ')
                    if (materialParts[0].length >= 2) {
                        materialCode = materialParts[0].substring(0, 2).toUpperCase()
                    }
                }

                // Get dimensions
                const length = formData.length
                const width = formData.width
                const height = formData.height

                // If no dimensions provided, show only base code
                if (!length && !width && !height) {
                    setFormData(prev => ({
                        ...prev,
                        id: baseCode,
                        product_code: baseCode
                    }))
                    return
                }

                // Build product_code: BASE-D{L}x{W}x{H}-MT
                // Example: AA003-D10x20x30-WD
                let dimensionParts = []
                if (length) dimensionParts.push(length)
                if (width) dimensionParts.push(width)
                if (height) dimensionParts.push(height)

                let newProductCode = baseCode
                if (dimensionParts.length > 0) {
                    newProductCode += `-D${dimensionParts.join('x')}`
                }

                // Add material code if provided
                if (materialCode) {
                    newProductCode += `-${materialCode}`
                }

                // Update both id and product_code for backward compatibility
                setFormData(prev => ({
                    ...prev,
                    id: newProductCode,
                    product_code: newProductCode
                }))
            }
        }
    }, [formData.category, formData.length, formData.width, formData.height, formData.material, product, existingProducts])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave({
            ...formData,
            price: Number(formData.price) || 0,
            stock: Number(formData.stock) || 0
        })
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header - Fixed */}
                <div className="bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-secondary-900">
                            {product && product.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                        </h2>
                        {product && product.uuid && (
                            <p className="text-xs text-secondary-400 font-mono mt-1">
                                UUID: {product.uuid}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-secondary-700 mb-2">ประเภทสินค้า *</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกประเภทสินค้า</option>
                                    {productTypes.map((type, index) => (
                                        <option key={index} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                                    รหัสสินค้า *
                                    <span className="text-xs font-normal text-secondary-500 ml-2">(สร้างอัตโนมัติ)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.product_code || formData.id || ''}
                                    readOnly
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg bg-secondary-50 font-mono text-secondary-700 cursor-not-allowed"
                                    placeholder="เลือกประเภท, ขนาด, วัสดุ เพื่อสร้างรหัส"
                                />
                                <p className="text-xs text-secondary-500 mt-1">รูปแบบ: BASE-L-W-H-MT (เช่น AA001-80-80-120-ST)</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">ชื่อสินค้า</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-secondary-700 mb-2">ยาว (cm)</label>
                                <input type="text" value={formData.length} onChange={e => setFormData({ ...formData, length: e.target.value })} className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-secondary-700 mb-2">กว้าง (cm)</label>
                                <input type="text" value={formData.width} onChange={e => setFormData({ ...formData, width: e.target.value })} className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-secondary-700 mb-2">สูง (cm)</label>
                                <input type="text" value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                        </div>

                        {/* Material Only - Color managed in Variants */}
                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">ประเภทวัสดุ</label>
                            <select
                                value={formData.material}
                                onChange={e => setFormData({ ...formData, material: e.target.value })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                                <option value="">เลือกประเภทวัสดุ</option>
                                {materials.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">รายละเอียด</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                        </div>

                        {/* Always show helper text - price, stock, color, and images managed in Variants */}
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                            <p className="text-sm text-primary-700 flex items-center gap-2 font-medium">
                                <span>💡</span>
                                <span>สี, ราคา, สต็อก และรูปภาพ ถูกกำหนดในแต่ละสี (Variants)</span>
                            </p>
                            <p className="text-xs text-primary-600 mt-1 ml-6">
                                กรุณาคลิก "เพิ่มสี" ด้านล่างเพื่อเพิ่มข้อมูลสินค้า
                            </p>
                        </div>

                        {/* Variant Management Section */}
                        <div className="border-t border-secondary-200 pt-6">
                            <VariantManager
                                baseProductId={formData.product_code || formData.id}
                                material={formData.material}
                                variants={formData.variants}
                                onChange={(newVariants) => setFormData({ ...formData, variants: newVariants })}
                                materialColors={materialColors}
                                mainProductColor={formData.color}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer - Fixed */}
                <div className="bg-white border-t border-secondary-200 px-4 py-3 flex gap-2 justify-between">
                    <div>
                        {product && product.uuid && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('ต้องการลบสินค้านี้?')) {
                                        DataManager.deleteProduct(product.uuid)
                                        onClose()
                                        window.location.reload()
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
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border border-secondary-300 rounded-lg hover:bg-secondary-50 font-medium"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
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
