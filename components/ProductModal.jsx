import React, { useState, useEffect } from 'react'
import { X, Camera } from 'lucide-react'
import { DataManager } from '../lib/dataManager'

export default function ProductModal({ isOpen, onClose, product, onSave, existingProducts = [] }) {
    const [formData, setFormData] = useState({
        id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
        length: '', width: '', height: '', material: '', color: '', crystalColor: '',
        bulbType: '', light: '', remote: '', images: []
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
    const defaultCrystalColors = ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ']

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
                images: product.images || []
            })
        } else {
            setFormData({
                id: '', category: '', name: '', subcategory: '', price: '', stock: '', description: '',
                length: '', width: '', height: '', material: '', color: '', crystalColor: '',
                bulbType: '', light: '', remote: '', images: []
            })
        }
    }, [product, isOpen])

    // Auto-generate ID when category changes
    useEffect(() => {
        // Only generate if:
        // 1. We are in "Add New" mode (no product prop OR product has no ID)
        // 2. A category is selected
        // 3. The category has a valid prefix format (2 chars)
        if ((!product || !product.id) && formData.category) {
            const prefix = formData.category.substring(0, 2).toUpperCase()

            // Validate prefix is 2 letters/chars
            if (prefix.length === 2 && prefix !== 'XX') { // Skip XX or invalid
                // Find max number for this prefix
                let maxNum = 0

                existingProducts.forEach(p => {
                    if (p.id && p.id.startsWith(prefix)) {
                        const numPart = p.id.substring(2)
                        // Check if the rest is a number
                        if (/^\d+$/.test(numPart)) {
                            const num = parseInt(numPart, 10)
                            if (num > maxNum) maxNum = num
                        }
                    }
                })

                // Generate new ID: Prefix + (Max+1) padded to 3 digits
                const nextNum = maxNum + 1
                const newId = `${prefix}${nextNum.toString().padStart(3, '0')}`

                setFormData(prev => ({ ...prev, id: newId }))
            }
        }
    }, [formData.category, product, existingProducts])

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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-secondary-900">
                        {product && product.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg">
                        <X size={24} className="text-secondary-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">รหัสสินค้า *</label>
                            <input
                                type="text"
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                            />
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

                    <div className="grid grid-cols-3 gap-4">
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
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">สีวัสดุ</label>
                            <select
                                value={formData.color}
                                onChange={e => setFormData({ ...formData, color: e.target.value })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                                <option value="">เลือกสีวัสดุ</option>
                                {materialColors.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">สีคริสตัล</label>
                            <select
                                value={formData.crystalColor}
                                onChange={e => setFormData({ ...formData, crystalColor: e.target.value })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            >
                                <option value="">เลือกสีคริสตัล</option>
                                {crystalColors.map((item, index) => (
                                    <option key={index} value={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">รายละเอียด</label>
                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">ราคา (บาท)</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-secondary-700 mb-2">สต้อคคงเหลือ</label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: e.target.value === '' ? '' : Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-semibold text-secondary-700 mb-2">รูปภาพสินค้า (สูงสุด 5 รูป)</label>
                        <div className="grid grid-cols-5 gap-3">
                            {[0, 1, 2, 3, 4].map((index) => (
                                <div key={index} className="relative aspect-square border-2 border-dashed border-secondary-300 rounded-lg overflow-hidden hover:border-primary-500 transition-colors">
                                    {formData.images && formData.images[index] ? (
                                        <>
                                            <img
                                                src={formData.images[index]}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newImages = [...(formData.images || [])];
                                                    newImages.splice(index, 1);
                                                    setFormData({ ...formData, images: newImages });
                                                }}
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
                                                capture="environment"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            const newImages = [...(formData.images || [])];
                                                            newImages[index] = reader.result;
                                                            setFormData({ ...formData, images: newImages });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium">
                            ยกเลิก
                        </button>
                        <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30">
                            บันทึก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
