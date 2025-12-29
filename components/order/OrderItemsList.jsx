import React from 'react';
import {
    FileText, Package, Layers, Scaling, Palette, Gem, Zap, Power,
    UserCheck, MapPin, Truck, Wrench, List, Calendar, CheckCircle,
    Users, QrCode, Plus, Lightbulb
} from 'lucide-react';
import OrderItemModal from '../OrderItemModal';

/**
 * OrderItemsList Component
 * Displays the list of order items with detailed 5-row layout
 */
export default function OrderItemsList({
    // Items data
    items,

    // Modal state
    showOrderItemModal,
    setShowOrderItemModal,
    editingItemIndex,
    setEditingItemIndex,

    // Handlers
    onSaveItem,
    onDeleteItem,

    // Product data
    productsData,
    lastCreatedProduct,
    onConsumeLastCreatedProduct,

    // Product modal handlers
    onAddNewProduct,
    onEditProduct,

    // Utility functions
    currency
}) {
    return (
        <div className="order-2 md:order-3 col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <FileText className="text-primary-600" />
                    รายการสินค้า
                </h2>
            </div>

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="group relative flex bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer text-xs"
                        onClick={() => {
                            setEditingItemIndex(idx)
                            setShowOrderItemModal(true)
                        }}
                    >
                        {/* LEFT: Image (Fixed Aspect) */}
                        <div className="w-24 bg-gray-50 flex items-center justify-center border-r border-secondary-100 flex-shrink-0 relative">
                            {(() => {
                                // Resolving Image Logic: Item Image -> Selected Variant Image -> Product Image -> Product First Gallery Image
                                // Resolving Image Logic: Item Image -> Selected Variant Image -> Product Image
                                const imgSrc = item.image ||
                                    item.selectedVariant?.image_url ||
                                    item.product?.image_url

                                if (imgSrc) {
                                    return (
                                        <img
                                            src={imgSrc}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )
                                }
                                return <Package size={24} className="text-secondary-300" />
                            })()}
                            {/* Index Badge */}
                            <div className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm z-10">
                                {idx + 1}
                            </div>
                        </div>

                        {/* RIGHT: Content 5 Rows Redesign */}
                        <div className="flex-1 min-w-0 p-3 space-y-3">
                            {/* Row 1: Header Info & Price */}
                            <div className="flex justify-between items-start gap-2 w-full">
                                {/* LEFT: Product Info */}
                                <div className="flex flex-wrap items-center gap-2 min-w-0">

                                    {/* Category */}
                                    {(item.category || item.subcategory) && (
                                        <span className="text-secondary-500 font-medium text-xs">
                                            {item.category?.startsWith('01') || item.category?.startsWith('02') ? item.category.substring(2) : item.category}
                                            {item.subcategory ? ` / ${item.subcategory}` : ''}
                                        </span>
                                    )}
                                    {/* Code Badge */}
                                    <span className="bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200 text-[10px] font-mono text-secondary-500">
                                        {item.code || item.product_code || item.product?.product_code || '-'}
                                    </span>
                                    {/* Name */}
                                    <span className="text-sm font-bold text-secondary-900 truncate">{item.name || item.product?.name || 'สินค้าใหม่'}</span>

                                    {/* Price & Stock - Moved from Right */}
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                        <div className="flex items-center gap-1">
                                            <div className="text-secondary-500 font-medium text-[11px]">
                                                {currency(item.unitPrice || item.price || item.unit_price || 0)}
                                            </div>
                                            <div className="text-secondary-400 text-[10px]">
                                                x {item.qty}
                                            </div>
                                            <div className="font-bold text-primary-700 text-[11px] ml-1">
                                                {currency((item.unitPrice || 0) * (item.qty || 0))}
                                            </div>
                                        </div>
                                        <span className={`px-1.5 rounded text-[10px] ${Number(item.stock) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Stock: {item.stock || 0}
                                        </span>
                                        {item.id && typeof item.id === 'string' && item.id.length > 20 && (
                                            <span className="bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-200 text-[10px] font-mono text-secondary-500 ml-1">
                                                IT{item.id.slice(-6)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT: Stock & Price */}

                            </div>

                            {/* Row 2: Specs & Description */}
                            <div className="flex justify-between items-center gap-4 text-xs text-secondary-600">
                                {/* LEFT: Specs */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {/* Dimensions - Moved from Row 1 */}
                                    {item.material && (
                                        <div className="flex items-center gap-1" title="วัสดุ">
                                            <Layers size={12} />
                                            <span>{item.material}</span>
                                        </div>
                                    )}
                                    {/* Dimensions */}
                                    {(() => {
                                        const getDims = (obj) => {
                                            if (!obj) return null
                                            // 1. Try parsed dimensions object (from DataManager)
                                            if (obj.dimensions) {
                                                return { w: obj.dimensions.width, l: obj.dimensions.length, h: obj.dimensions.height }
                                            }
                                            // 2. Try parsing 'size' string (Raw DB format)
                                            if (obj.size && typeof obj.size === 'string') {
                                                const parts = obj.size.split('x').map(p => parseInt(p) || 0)
                                                if (parts.length >= 3) return { l: parts[0], w: parts[1], h: parts[2] }
                                            }
                                            // 3. Try legacy individual fields
                                            if (obj.width || obj.length || obj.height) {
                                                return { w: obj.width, l: obj.length, h: obj.height }
                                            }
                                            return null
                                        }

                                        // Priority: Selected Variant (Golden Source) -> Product -> Item (Fallback/Legacy)
                                        const dims = getDims(item.selectedVariant) ||
                                            getDims(item.product) ||
                                            (item.product?.variants?.[0] ? getDims(item.product.variants[0]) : null) ||
                                            getDims(item)

                                        if (dims && (dims.w || dims.l || dims.h)) {
                                            return (
                                                <div className="flex items-center gap-1" title="ขนาด">
                                                    <Scaling size={12} />
                                                    <span>
                                                        {dims.l ? `${dims.l}x` : ''}
                                                        {dims.w ? `${dims.w}x` : ''}
                                                        {dims.h ? `${dims.h}` : ''}
                                                        {' cm'}
                                                    </span>
                                                </div>
                                            )
                                        }
                                        return null
                                    })()}
                                    {/* Color */}
                                    {(item.selectedVariant?.color || item.color) && (
                                        <div className="flex items-center gap-1" title="สี">
                                            <Palette size={12} />
                                            <span>{item.selectedVariant?.color || item.color}</span>
                                        </div>
                                    )}
                                    {/* Crystal Data - Strict DB Column: crystal_color */}
                                    {(item.selectedVariant?.crystal_color || item.crystal_color) && (
                                        <div className="flex items-center gap-1" title="สีคริสตัล">
                                            <Gem size={12} />
                                            <span>{item.selectedVariant?.crystal_color || item.crystal_color}</span>
                                        </div>
                                    )}
                                    {item.lightColor && (
                                        <div className="flex items-center gap-1" title="แสงไฟ">
                                            <Zap size={12} />
                                            <span>{item.lightColor}</span>
                                        </div>
                                    )}
                                    {/* FIX: Display Bulb Type (light) */}
                                    {item.light && (
                                        <div className="flex items-center gap-1" title="ขั้วไฟ">
                                            <Lightbulb size={12} />
                                            <span>{item.light}</span>
                                        </div>
                                    )}
                                    {item.remote && (
                                        <div className="flex items-center gap-1" title="รีโมท">
                                            <Power size={12} />
                                            <span>{item.remote}</span>
                                        </div>
                                    )}

                                    {/* Description / Remark - Moved to follow Bulb Type */}
                                    {(item.remark || item.description) && (
                                        <div className="flex items-center gap-1 text-secondary-500" title="หมายเหตุ">
                                            <FileText size={12} />
                                            <span className="truncate max-w-[200px]">
                                                {item.remark || item.description}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* RIGHT: Description */}

                            </div>

                            {/* Row 3: Job Info & Dates */}
                            {(() => {
                                // Get latest job (last job in array, sorted by sequence_number)
                                const latestJob = item.jobs && item.jobs.length > 0
                                    ? item.jobs[item.jobs.length - 1]
                                    : item.latestJob || null

                                return (
                                    <div className="flex justify-between items-center gap-4 text-xs text-secondary-600">
                                        {/* LEFT: Job Info: Inspector, Location */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            {/* Inspector (Swapped from Row 4) */}
                                            <div className="flex items-center gap-1">
                                                <UserCheck size={12} />
                                                <span>
                                                    {(latestJob?.inspector?.name || latestJob?.inspector1?.name) || '-'}
                                                    {(latestJob?.inspector?.phone || latestJob?.inspector1?.phone) && ` (${latestJob?.inspector?.phone || latestJob?.inspector1?.phone})`}
                                                </span>
                                            </div>

                                            {(latestJob?.distance || latestJob?.installLocationName) && (
                                                <div className="flex items-center gap-1 text-secondary-500">
                                                    {latestJob?.distance && <span>{latestJob?.distance}</span>}
                                                    {latestJob?.installLocationName && <span>{latestJob?.installLocationName}</span>}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} className="flex-shrink-0" />
                                                <span>
                                                    {latestJob?.installAddress || latestJob?.installLocationName || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* RIGHT: Dates - Moved to Row 4 */}
                                    </div>
                                )
                            })()}

                            {/* Row 4: Job Type, Team, Details & Dates */}
                            <div className="flex justify-between items-center gap-4 text-xs text-secondary-500">
                                {/* LEFT Group: Job Type, Team, Details */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    {(() => {
                                        // Get latest job (last job in array, sorted by sequence_number)
                                        const latestJob = item.jobs && item.jobs.length > 0
                                            ? item.jobs[item.jobs.length - 1]
                                            : item.latestJob || null

                                        return (
                                            <>
                                                {/* Job Type */}
                                                <div
                                                    className="flex items-center gap-1 p-1 -ml-1 rounded text-secondary-500"
                                                    title="ประเภทงาน"
                                                >
                                                    {(latestJob?.jobType || latestJob?.job_type) === 'delivery' ? <Truck size={14} /> : <Wrench size={14} />}
                                                </div>

                                                {/* Dates - Moved to 2nd position */}
                                                <div className="flex items-center gap-3">
                                                    {/* Job Sequence Indicator */}
                                                    <div
                                                        className="flex items-center gap-1 text-secondary-500 font-medium text-[11px] bg-secondary-50 px-1.5 py-0.5 rounded border border-secondary-100"
                                                    >
                                                        <List size={10} />
                                                        <span>{item.latestJobIndex || item.jobs?.length || 1}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        <span>
                                                            {(latestJob?.appointmentDate || latestJob?.appointment_date)
                                                                ? new Date(latestJob?.appointmentDate || latestJob?.appointment_date).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-green-700">
                                                        <CheckCircle size={12} />
                                                        <span>
                                                            {(latestJob?.completionDate || latestJob?.completion_date)
                                                                ? new Date(latestJob?.completionDate || latestJob?.completion_date).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Team */}
                                                <div className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    <span>{latestJob?.team || latestJob?.assigned_team || '-'}</span>
                                                </div>

                                                {/* Details/Note */}
                                                <div className="flex items-center gap-1 text-secondary-400">
                                                    <FileText size={12} />
                                                    <span className="truncate max-w-[300px]">
                                                        {latestJob?.description || latestJob?.notes || '-'}
                                                    </span>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>

                                {/* RIGHT: Dates (Moved from Row 3) */}

                            </div>

                            {/* Row 5: SNs */}
                            <div className="flex items-start gap-2 pt-1">
                                <QrCode size={16} className="text-secondary-400 mt-0.5 flex-shrink-0" />
                                <div className="flex flex-wrap gap-2">
                                    {item.serialNumbers && item.serialNumbers.length > 0 && item.serialNumbers.map((sn, i) => (
                                        <span key={i} className="text-[10px] font-mono bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                            {sn}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Button */}
                <button
                    onClick={() => {
                        setEditingItemIndex(null)
                        setShowOrderItemModal(true)
                    }}
                    className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2 border-2 border-dashed border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                >
                    <Plus size={18} />
                    เพิ่มรายการสินค้า
                </button>
            </div>

            {/* Order Item Modal */}
            <OrderItemModal
                isOpen={showOrderItemModal}
                onClose={() => {
                    setShowOrderItemModal(false)
                    setEditingItemIndex(null)  // Reset when closing
                }}
                onSave={(itemData) => {
                    onSaveItem(itemData)
                    setEditingItemIndex(null)  // CRITICAL FIX: Reset after save
                    setShowOrderItemModal(false)  // Close modal
                }}
                // FIX: Pass explicit index to delete handler
                onDelete={() => onDeleteItem(editingItemIndex)}
                item={editingItemIndex !== null ? items[editingItemIndex] : null}
                productsData={productsData}
                isEditing={editingItemIndex !== null}

                onAddNewProduct={onAddNewProduct}
                onEditProduct={onEditProduct}
                lastCreatedProduct={lastCreatedProduct}
                onConsumeLastCreatedProduct={onConsumeLastCreatedProduct}
            />
        </div>
    );
}
