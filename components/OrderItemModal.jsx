
import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2, Search, Wrench, Truck, HelpCircle, ChevronRight, Package } from 'lucide-react'
import { currency } from '../lib/utils'

export default function OrderItemModal({
    isOpen,
    onClose,
    onSave,
    onDelete,
    item = null,
    productsData = [],
    isEditing = false,
    onOpenSubJob // Callback to open the sub-job modal
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
        _searchTerm: ''
    })

    const [showSearchPopup, setShowSearchPopup] = useState(false)
    const [searchResults, setSearchResults] = useState([])

    useEffect(() => {
        if (isOpen) {
            if (item) {
                setFormData({
                    ...item,
                    _searchTerm: item.name || ''
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
                    _searchTerm: ''
                })
            }
        }
    }, [item, isOpen])

    // Search Logic
    useEffect(() => {
        if (formData._searchTerm && showSearchPopup) {
            const lowerTerm = formData._searchTerm.toLowerCase()
            const results = productsData.filter(p =>
                JSON.stringify(p).toLowerCase().includes(lowerTerm)
            )
            setSearchResults(results)
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
                            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded border border-primary-100 text-primary-600">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-secondary-900 text-sm">{formData.name}</div>
                                        <div className="text-xs text-secondary-500 font-mono mt-0.5 flex items-center gap-2">
                                            <span className="bg-white px-1 rounded border border-secondary-200">{formData.code}</span>
                                            <span>{currency(formData.unitPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        code: '',
                                        name: '',
                                        unitPrice: 0,
                                        _searchTerm: '',
                                        description: '', // Optional: clear description too
                                        image: null
                                    }))}
                                    className="p-1.5 bg-white border border-secondary-200 rounded-md text-secondary-400 hover:text-danger-500 hover:border-danger-200 transition-colors"
                                    title="เลือกสินค้าใหม่"
                                >
                                    <X size={16} />
                                </button>
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
                                {showSearchPopup && formData._searchTerm && (
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
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-secondary-700 mb-1">รายละเอียด/หมายเหตุ</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                            rows={2}
                        />
                    </div>

                    {/* Quantity & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">จำนวน</label>
                            <input
                                type="number"
                                value={formData.qty}
                                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right text-sm"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-secondary-700 mb-1">ราคา/หน่วย</label>
                            <input
                                type="number"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-right text-sm"
                            />
                        </div>
                    </div>

                    {/* Total */}
                    <div>
                        <div className="flex justify-between items-center bg-primary-50 p-3 rounded-lg border border-primary-100">
                            <span className="text-sm font-medium text-primary-800">รวมเป็นเงิน</span>
                            <span className="text-lg font-bold text-primary-700">{currency(total)}</span>
                        </div>
                    </div>

                    {/* Sub Job Config */}
                    <div className="pt-2 border-t border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-700 mb-2">ข้อมูลงาน (Job)</label>
                        <button
                            onClick={onOpenSubJob}
                            className="w-full flex items-center justify-between p-3 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w - 8 h - 8 rounded - full flex items - center justify - center ${formData.subJob ? 'bg-primary-100 text-primary-600' : 'bg-secondary-100 text-secondary-400'} `}>
                                    {formData.subJob?.jobType ? (
                                        formData.subJob.jobType === 'delivery' ? <Truck size={16} /> : <Wrench size={16} />
                                    ) : (
                                        <HelpCircle size={16} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-medium text-secondary-900">
                                        {formData.subJob ? (formData.subJob.jobType === 'delivery' ? 'งานจัดส่ง' : 'งานติดตั้ง') : 'ตั้งค่าข้อมูลงาน'}
                                    </div>
                                    <div className="text-xs text-secondary-500">
                                        {formData.subJob ? (formData.subJob.team || 'ไม่ระบุทีม') : 'คลิกเพื่อระบุวันที่, ทีมช่าง, สถานที่'}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-secondary-400" />
                        </button>
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
