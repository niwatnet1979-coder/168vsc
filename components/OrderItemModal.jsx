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
        remark: ''
    })

    const [showSearchPopup, setShowSearchPopup] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [productOptions, setProductOptions] = useState({
        lightColors: [],
        remotes: [],
        bulbTypes: []
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
                        bulbTypes: options.bulbTypes || ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module']
                    })
                } else {
                    // Fallback to defaults
                    setProductOptions({
                        lightColors: ['warm', 'cool', 'white', '3แสง'],
                        remotes: ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
                        bulbTypes: ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module']
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
                    remark: item.remark || ''
                })
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
                    remark: ''
                })
            }
        }
    }, [item, isOpen])

    // Search Logic
    useEffect(() => {
        // Auto-select newly created product
        if (lastCreatedProduct) {
            handleSelectProduct(lastCreatedProduct)
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

    const handleSelectProduct = (product) => {
        setFormData(prev => ({
            ...prev,
            code: product.id,
            name: product.name,
            description: product.description || product.name,
            unitPrice: product.price || 0,
            image: product.images?.[0] || null,
            category: product.category,
            subcategory: product.subcategory,
            length: product.length,
            width: product.width,
            height: product.height,
            material: product.material,
            color: product.color,
            crystalColor: product.crystalColor,
            bulbType: product.bulbType,
            light: product.light,
            _searchTerm: product.name,
        }))
        setShowSearchPopup(false)
    }

    const handleSave = () => {
        if (!formData.code && !formData.name) {
            alert('กรุณาระบุสินค้า')
            return
        }
        onSave(formData)
        onClose()
    }

    if (!isOpen) return null

    const total = (Number(formData.qty) || 0) * (Number(formData.unitPrice) || 0)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
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

                            <div className="bg-white border border-secondary-200 rounded-xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow">
                                {/* Flex Container: Image (Left) + Content (Right) */}
                                <div className="flex">
                                    {/* Left: Product Image */}
                                    <div className="w-24 bg-secondary-50 flex items-center justify-center border-r border-secondary-100 flex-shrink-0">
                                        {formData.image ? (
                                            <img
                                                src={formData.image}
                                                alt={formData.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package size={32} className="text-secondary-300" />
                                        )}
                                    </div>

                                    {/* Right: Info & Details */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header Row */}
                                        <div className="p-3 border-b border-secondary-100 flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <div className="font-bold text-secondary-900 text-sm truncate">{formData.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200 text-[10px] font-mono text-secondary-500">
                                                        {formData.code}
                                                    </span>
                                                    <span className="font-bold text-primary-700 text-sm">
                                                        {currency(formData.unitPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    code: '', name: '', unitPrice: 0, _searchTerm: '', description: '',
                                                    image: null, length: '', width: '', height: '',
                                                    material: '', color: '', crystalColor: '',
                                                    bulbType: '', light: '', remote: ''
                                                }))}
                                                className="p-1.5 text-secondary-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-all"
                                                title="เลือกสินค้าใหม่"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        {/* Compact Details Grid */}
                                        <div className="p-2 gap-2 text-[10px] text-secondary-600">
                                            {/* Attributes Line */}
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 items-center leading-tight">
                                                {(formData.length || formData.width || formData.height) && (
                                                    <div className="flex items-center gap-1">
                                                        <Box size={10} className="text-secondary-400" />
                                                        <span className="truncate max-w-[100px] font-medium">{formData.width || '-'}x{formData.length || '-'}x{formData.height || '-'}</span>
                                                    </div>
                                                )}
                                                {formData.material && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-secondary-300">|</span>
                                                        <span className="truncate max-w-[80px]">{formData.material}</span>
                                                    </div>
                                                )}
                                                {(formData.color || formData.crystalColor) && (
                                                    <div className="flex items-center gap-1">
                                                        <Palette size={10} className="text-secondary-400" />
                                                        <span className="truncate max-w-[80px]">{formData.color} {formData.crystalColor}</span>
                                                    </div>
                                                )}
                                                {(formData.bulbType || formData.light) && (
                                                    <div className="flex items-center gap-1">
                                                        <Zap size={10} className="text-secondary-400" />
                                                        <span className="truncate max-w-[80px]">{formData.bulbType} {formData.light}</span>
                                                    </div>
                                                )}
                                                {formData.remote && (
                                                    <div className="flex items-center gap-1">
                                                        <Power size={10} className="text-secondary-400" />
                                                        <span className="truncate max-w-[80px]">{formData.remote}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description Line (Truncated) */}
                                            {formData.description && formData.description !== formData.name && (
                                                <div className="mt-1.5 pt-1.5 border-t border-secondary-100 line-clamp-1 hover:line-clamp-none transition-all cursor-default text-secondary-500">
                                                    {formData.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                                    onClick={() => handleSelectProduct(p)}
                                                    className="p-3 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                >
                                                    <div className="font-bold text-secondary-900 text-sm">{p.name || ''}</div>
                                                    <div className="flex justify-between mt-1">
                                                        <div className="text-xs text-secondary-500">{p.id}</div>
                                                        <div className="text-xs font-bold text-primary-600">{currency(p.price)}</div>
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
                            <div className="grid grid-cols-3 gap-4">
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
                                <div>
                                    <label className="block text-xs font-medium text-secondary-700 mb-1">หลอดไฟ</label>
                                    <select
                                        value={formData.bulbType}
                                        onChange={(e) => setFormData({ ...formData, bulbType: e.target.value })}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                    >
                                        <option value="">-- เลือกหลอดไฟ --</option>
                                        {productOptions.bulbTypes.map((opt, i) => (
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
