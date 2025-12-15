import React, { useState, useEffect } from 'react'
import { X, Camera, Trash2 } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import VariantManager from './VariantManager'

export default function ProductModal({ isOpen, onClose, product, onSave, existingProducts = [] }) {
    const [formData, setFormData] = useState({
        id: '',
        category: '',
        name: '',
        description: '',
        material: '',
        product_code: '',
        product_code: '',
        variants: [],
        images: []
    })

    const [productTypes, setProductTypes] = useState([])
    const [materials, setMaterials] = useState([])
    const [materialColors, setMaterialColors] = useState([])
    const [crystalColors, setCrystalColors] = useState([])

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
    const defaultCrystalColors = ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ', 'ใส']

    useEffect(() => {
        const loadOptions = async () => {
            const options = await DataManager.getProductOptions()
            if (options) {
                setProductTypes(options.productTypes && options.productTypes.length > 0 ? options.productTypes : defaultProductTypes)
                setMaterials(options.materials && options.materials.length > 0 ? options.materials : defaultMaterials)
                setMaterialColors(options.materialColors && options.materialColors.length > 0 ? options.materialColors : defaultMaterialColors)
                setCrystalColors(options.crystalColors && options.crystalColors.length > 0 ? options.crystalColors : defaultCrystalColors)
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
                variants: product.variants || [],
                images: product.images || []
            })
        } else {
            setFormData({
                id: '',
                category: '',
                name: '',
                description: '',
                material: '',
                product_code: '',
                product_code: '',
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
            if (prefix.length === 2) {
                // Determine base code
                let baseCode = ''

                // Function to find next number
                const foundNextCode = () => {
                    const usedNumbers = new Set()
                    existingProducts.forEach(p => {
                        const checkId = p.product_code || p.id
                        if (checkId && checkId.startsWith(prefix)) {
                            const parts = checkId.split('-')
                            const basePart = parts[0]
                            const numPart = basePart.substring(2)
                            if (/^\d+$/.test(numPart)) {
                                usedNumbers.add(parseInt(numPart, 10))
                            }
                        }
                    })
                    let maxNum = 0
                    usedNumbers.forEach(num => {
                        if (num > maxNum) maxNum = num
                    })
                    const nextNum = maxNum + 1
                    return `${prefix}${nextNum.toString().padStart(3, '0')}`
                }

                if (product && product.product_code) {
                    // Editing existing product
                    const parts = product.product_code.split('-')
                    const existingBaseCode = parts[0]
                    const existingPrefix = existingBaseCode.substring(0, 2)

                    if (existingPrefix === prefix) {
                        baseCode = existingBaseCode
                    } else {
                        baseCode = foundNextCode()
                    }
                } else {
                    // New product
                    baseCode = foundNextCode()
                }


                // Product code is now just the base code (e.g., AA001)
                // Dimensions are managed at variant level
                setFormData(prev => ({
                    ...prev,
                    id: baseCode,
                    product_code: baseCode
                }))
            }
        }
    }, [formData.category, formData.length, formData.width, formData.height, formData.material, product, existingProducts])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        // Only send fields that exist in database
        const { id, subcategory, price, stock, color, length, width, height, ...cleanData } = formData
        onSave(cleanData)
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
                                    <span className="text-xs font-normal text-secondary-500 ml-2">(แก้ไขเลข 3 หลักท้ายได้)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.product_code || formData.id || ''}
                                    onChange={(e) => {
                                        let input = e.target.value.toUpperCase()

                                        // Limit to 5 characters max
                                        if (input.length > 5) return

                                        // If user tries to edit first 2 chars, prevent it
                                        const currentCode = formData.product_code || formData.id || ''
                                        if (currentCode.length >= 2 && input.length >= 2) {
                                            // Keep first 2 chars from category
                                            const prefix = formData.category ? formData.category.substring(0, 2) : currentCode.substring(0, 2)
                                            input = prefix + input.substring(2)
                                        }

                                        setFormData(prev => ({
                                            ...prev,
                                            id: input,
                                            product_code: input
                                        }))
                                    }}
                                    onBlur={(e) => {
                                        const code = e.target.value
                                        const match = code.match(/^([A-Z]{2})(\d{3})$/)

                                        if (!match) {
                                            alert('รูปแบบรหัสไม่ถูกต้อง ต้องเป็น AA### (5 หลัก เช่น AA001)')
                                            return
                                        }

                                        // Check for duplicates
                                        const isDuplicate = existingProducts.some(p => {
                                            const checkId = p.product_code || p.id
                                            if (product && checkId === (product.product_code || product.id)) {
                                                return false
                                            }
                                            return checkId === code
                                        })

                                        if (isDuplicate) {
                                            alert(`รหัส ${code} ถูกใช้งานแล้ว กรุณาเลือกเลขอื่น`)
                                            if (product) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    id: product.product_code || product.id,
                                                    product_code: product.product_code || product.id
                                                }))
                                            }
                                        }
                                    }}
                                    maxLength={5}
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg bg-white font-mono text-secondary-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="AA001"
                                />
                                <p className="text-xs text-secondary-500 mt-1">รูปแบบ: AA### (5 หลัก เช่น AA001) - 2 หลักแรกมาจากประเภท, แก้ไขเฉพาะเลข 3 หลักท้ายได้</p>
                            </div>
                        </div>


                        {/* Material Only - Color managed in Variants */}
                        {/* Material & Min Stock */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-secondary-700 mb-2">ชื่อสินค้า</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
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
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">รายละเอียด</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                        </div>

                        {/* Always show helper text - dimensions, price, stock, color, and images managed in Variants */}
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                            <p className="text-sm text-primary-700 flex items-center gap-2 font-medium">
                                <span>💡</span>
                                <span>ขนาด, สี, ราคา, สต็อก และรูปภาพ ถูกกำหนดในแต่ละ Variant</span>
                            </p>
                            <p className="text-xs text-primary-600 mt-1 ml-6">
                                กรุณาคลิก "เพิ่มสี" ด้านล่างเพื่อเพิ่มข้อมูลสินค้า (ขนาดและสีต่างๆ)
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
                                crystalColors={crystalColors}
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
