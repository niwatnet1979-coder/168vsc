
import React, { useState, useEffect, useRef } from 'react'
import { X, Trash2, Search, Wrench, Truck, HelpCircle, ChevronRight, Package, Plus, User, MapPin, Calendar, Box, Palette, Zap, Power } from 'lucide-react'
import { currency } from '../lib/utils'


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
            // Load Product Options
            const savedOptions = localStorage.getItem('product_options_data')
            if (savedOptions) {
                try {
                    setProductOptions(JSON.parse(savedOptions))
                } catch (e) {
                    console.error('Error parsing product options:', e)
                }
            } else {
                // Determine defaults if not set? Or just empty.
                // Based on plan, we can set defaults if missing to match Settings page logic
                setProductOptions({
                    lightColors: ['warm', 'cool', 'white', '3แสง'],
                    remotes: ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
                    bulbTypes: ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module']
                })
            }

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
                                {/* Header: Icon + Name + Clear Button */}
                                <div className="bg-secondary-50 p-3 flex items-start gap-3 border-b border-secondary-100">
                                    <div className="p-2 bg-white rounded-lg border border-secondary-200 text-primary-600 shadow-sm">
                                        <Package size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-secondary-900 text-sm truncate">{formData.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-white m-0 px-1.5 py-0.5 rounded border border-secondary-200 text-[10px] font-mono text-secondary-500">
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
                                            code: '',
                                            name: '',
                                            unitPrice: 0,
                                            _searchTerm: '',
                                            description: '',
                                            image: null,
                                            length: '', width: '', height: '',
                                            material: '', color: '', crystalColor: '',
                                            bulbType: '', light: '', remote: ''
                                        }))}
                                        className="p-1.5 bg-white border border-secondary-200 rounded-lg text-secondary-400 hover:text-danger-500 hover:border-danger-200 hover:bg-danger-50 transition-all"
                                        title="เลือกสินค้าใหม่"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Details Grid */}
                                <div className="p-3 bg-white space-y-3">
                                    {/* Row 1: Size & Material */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {(formData.length || formData.width || formData.height) && (
                                            <div className="bg-secondary-50 p-2 rounded-lg border border-secondary-100/50">
                                                <div className="text-[10px] text-secondary-400 font-medium mb-0.5 flex items-center gap-1">
                                                    <Box size={10} /> ขนาด (กxยxส)
                                                </div>
                                                <div className="text-xs font-semibold text-secondary-700 truncate">
                                                    {formData.width || '-'} x {formData.length || '-'} x {formData.height || '-'}
                                                </div>
                                            </div>
                                        )}
                                        {formData.material && (
                                            <div className="bg-secondary-50 p-2 rounded-lg border border-secondary-100/50">
                                                <div className="text-[10px] text-secondary-400 font-medium mb-0.5 flex items-center gap-1">
                                                    <Box size={10} /> วัสดุ
                                                </div>
                                                <div className="text-xs font-semibold text-secondary-700 truncate">
                                                    {formData.material}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Row 2: Color, Bulb, Remote */}
                                    <div className="flex flex-wrap gap-2">
                                        {(formData.color || formData.crystalColor) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-secondary-200 text-[10px] text-secondary-600">
                                                <Palette size={10} className="text-secondary-400" />
                                                {formData.color} {formData.crystalColor ? `(${formData.crystalColor})` : ''}
                                            </span>
                                        )}
                                        {(formData.bulbType || formData.light) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-secondary-200 text-[10px] text-secondary-600">
                                                <Zap size={10} className="text-secondary-400" />
                                                {formData.bulbType} {formData.light ? `(${formData.light})` : ''}
                                            </span>
                                        )}
                                        {formData.remote && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-secondary-200 text-[10px] text-secondary-600">
                                                <Power size={10} className="text-secondary-400" />
                                                {formData.remote}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {formData.description && formData.description !== formData.name && (
                                        <div className="pt-2 border-t border-secondary-100">
                                            <div className="text-[10px] text-secondary-400 font-medium mb-0.5">รายละเอียด</div>
                                            <div className="text-xs text-secondary-600 whitespace-pre-wrap leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                                                {formData.description}
                                            </div>
                                        </div>
                                    )}
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
                        )}
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

                    {/* Sub Job Config */}
                    <div className="pt-2 border-t border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-700 mb-2">ข้อมูลงาน (Job)</label>
                        <button
                            onClick={onOpenSubJob}
                            className={`w-full group text-left transition-all duration-200 ${formData.subJob
                                ? 'bg-white border-2 border-primary-100 ring-2 ring-primary-50 rounded-xl overflow-hidden hover:border-primary-300'
                                : 'p-4 bg-white border border-dashed border-secondary-300 rounded-xl hover:bg-secondary-50 hover:border-secondary-400 flex items-center justify-center gap-2'
                                }`}
                        >
                            {formData.subJob ? (
                                <div className="divide-y divide-primary-50">
                                    {/* Row 1: Main Info */}
                                    <div className="p-3 bg-primary-50/30 grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 bg-white rounded-lg shadow-sm text-primary-600 shrink-0">
                                                {formData.subJob.jobType === 'delivery' ? <Truck size={14} /> : <Wrench size={14} />}
                                            </div>
                                            <div className="truncate">
                                                <div className="text-xs text-secondary-500 font-medium">ประเภทงาน</div>
                                                <div className="text-sm font-bold text-secondary-900 truncate">
                                                    {formData.subJob.jobType === 'delivery' ? 'งานจัดส่ง (Delivery)' : 'งานติดตั้ง (Installation)'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 bg-white rounded-lg shadow-sm text-primary-600 shrink-0">
                                                <User size={14} />
                                            </div>
                                            <div className="truncate">
                                                <div className="text-xs text-secondary-500 font-medium">ทีม</div>
                                                <div className="text-sm font-bold text-secondary-900 truncate">
                                                    {formData.subJob.team || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="col-span-2 sm:col-span-1 min-w-0">
                                            <div className="flex items-start gap-2">
                                                <MapPin size={14} className="text-secondary-400 mt-0.5 shrink-0" />
                                                <div className="truncate w-full">
                                                    <div className="text-xs font-medium text-secondary-900 truncate">
                                                        {formData.subJob.installLocationName || 'ไม่ระบุสถานที่'}
                                                    </div>
                                                    {formData.subJob.distance && (
                                                        <div className="text-[10px] font-bold text-red-600 mt-0.5">
                                                            ระยะทาง {formData.subJob.distance}
                                                        </div>
                                                    )}
                                                    {formData.subJob.installAddress && (
                                                        <div className="text-[10px] text-secondary-500 truncate leading-tight mt-0.5">
                                                            {formData.subJob.installAddress}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 min-w-0">
                                            <div className="flex items-start gap-2">
                                                <Calendar size={14} className="text-secondary-400 mt-0.5 shrink-0" />
                                                <div className="truncate w-full">
                                                    <div className="text-xs font-medium text-secondary-900">
                                                        {formData.subJob.appointmentDate
                                                            ? new Date(formData.subJob.appointmentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                            : 'ไม่ระบุวันที่'
                                                        }
                                                    </div>
                                                    {formData.subJob.completionDate && (
                                                        <div className="text-[10px] text-success-600 mt-0.5 font-medium">
                                                            เสร็จ: {new Date(formData.subJob.completionDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                    {!formData.subJob.completionDate && formData.subJob.appointmentDate && (
                                                        <div className="text-[10px] text-secondary-500 truncate mt-0.5">
                                                            เวลานัดหมาย
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Optional: Inspector / Description if space allows or spans full width */}
                                        {(formData.subJob.inspector1 || formData.subJob.description) && (
                                            <div className="col-span-2 pt-2 mt-1 border-t border-secondary-100 flex gap-4 text-xs text-secondary-600">
                                                {formData.subJob.inspector1 && (
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <div className="w-4 h-4 rounded-full bg-secondary-100 flex items-center justify-center text-[10px] font-bold">
                                                            {String(formData.subJob.inspector1.name || 'I').charAt(0)}
                                                        </div>
                                                        <span className="truncate max-w-[100px]">{formData.subJob.inspector1.name}</span>
                                                    </div>
                                                )}
                                                {formData.subJob.description && (
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <div className="w-1 h-1 rounded-full bg-secondary-300"></div>
                                                        <span className="truncate italic text-secondary-500">{formData.subJob.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footnote */}
                                    <div className="px-3 py-1.5 bg-secondary-50 text-[10px] text-primary-600 font-medium text-center border-t border-secondary-100 group-hover:bg-primary-50 transition-colors">
                                        คลิกเพื่อแก้ไขข้อมูลงาน
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-secondary-100 text-secondary-400 flex items-center justify-center">
                                        <Wrench size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-secondary-600">
                                        ระบุข้อมูลงาน (ติดตั้ง/จัดส่ง)
                                    </span>
                                </>
                            )}
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
