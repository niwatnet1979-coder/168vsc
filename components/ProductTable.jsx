import React from 'react'
import Link from 'next/link'
import {
    Edit2, Trash2, ChevronDown, ChevronUp, Package,
    Scaling, Palette, Gem, ImageIcon
} from 'lucide-react'
import { cleanPrefix, getVariantSummary } from '../lib/productHelpers'

export default function ProductTable({
    products,
    totalItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    sortConfig,
    requestSort,
    handleEdit,
    handleDelete,
    toggleExpand,
    expandedProducts
}) {
    // Helper for sort icons
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null
        return sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return (
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-secondary-50 border-b border-secondary-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase w-12">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase w-20">รูปภาพ</th>
                            <th onClick={() => requestSort('product_code')} className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100">
                                <div className="flex items-center gap-2">สินค้า {getSortIcon('product_code')}</div>
                            </th>
                            <th onClick={() => requestSort('price')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-32">
                                <div className="flex items-center justify-end gap-2">ราคา {getSortIcon('price')}</div>
                            </th>
                            <th onClick={() => requestSort('total_purchased')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-24">
                                <div className="flex items-center justify-end gap-2">ซื้อสะสม {getSortIcon('total_purchased')}</div>
                            </th>
                            <th onClick={() => requestSort('total_sold')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-24">
                                <div className="flex items-center justify-end gap-2">ขายสะสม {getSortIcon('total_sold')}</div>
                            </th>
                            <th onClick={() => requestSort('total_lost')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-24">
                                <div className="flex items-center justify-end gap-2">สูญหาย {getSortIcon('total_lost')}</div>
                            </th>
                            <th onClick={() => requestSort('stock')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-36">
                                <div className="flex items-center justify-end gap-2">คงเหลือ {getSortIcon('stock')}</div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-700 uppercase w-24">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                        {products.length > 0 ? (
                            products.map((product, index) => {
                                const materialName = cleanPrefix(product.material)
                                const hasVariants = product.variants && product.variants.length > 0
                                const isExpanded = expandedProducts.has(product.uuid)

                                return (
                                    <React.Fragment key={product.uuid}>
                                        <tr className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-4 py-4 text-sm text-secondary-500 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {hasVariants && (
                                                        <button
                                                            onClick={() => toggleExpand(product.uuid)}
                                                            className="p-1 hover:bg-secondary-200 rounded transition-colors"
                                                            title={isExpanded ? "ย่อ" : "ขยาย"}
                                                        >
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    )}
                                                    <span>{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="w-14 h-14 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex items-center justify-center">
                                                    {(() => {
                                                        if (product.images && product.images[0]) {
                                                            return <img src={product.images[0]} alt={product.product_code} className="w-full h-full object-cover" />
                                                        }
                                                        if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images[0]) {
                                                            return <img src={product.variants[0].images[0]} alt={product.product_code} className="w-full h-full object-cover" />
                                                        }
                                                        return <ImageIcon size={20} className="text-secondary-300" />
                                                    })()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <Link href={`/products/${product.uuid}`} className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline block mb-1">
                                                        {product.product_code}
                                                    </Link>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-500">
                                                        {product.name && <span className="font-medium text-secondary-700">{product.name}</span>}
                                                        {materialName && <span>• {materialName}</span>}
                                                        {product.subcategory && <span>• {product.subcategory}</span>}

                                                        {(() => {
                                                            if (product.length || product.width || product.height) {
                                                                return (
                                                                    <div className="flex items-center gap-1 text-secondary-500" title="ขนาด">
                                                                        <Scaling size={14} />
                                                                        <span>{product.length || '-'}×{product.width || '-'}×{product.height || '-'} cm</span>
                                                                    </div>
                                                                )
                                                            }
                                                            if (product.variants && product.variants.length > 0) {
                                                                const firstVariant = product.variants[0]
                                                                if (firstVariant.dimensions && (firstVariant.dimensions.length || firstVariant.dimensions.width || firstVariant.dimensions.height)) {
                                                                    return (
                                                                        <div className="flex items-center gap-1 text-secondary-500" title="ขนาด">
                                                                            <Scaling size={14} />
                                                                            <span>{firstVariant.dimensions.length || '-'}×{firstVariant.dimensions.width || '-'}×{firstVariant.dimensions.height || '-'} cm</span>
                                                                        </div>
                                                                    )
                                                                }
                                                            }
                                                            return null
                                                        })()}

                                                        {hasVariants && (
                                                            <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] rounded-full font-medium whitespace-nowrap flex items-center gap-1">
                                                                🎨 {product.variants.length} แบบ
                                                            </span>
                                                        )}
                                                    </div>
                                                    {product.description && (
                                                        <div className="text-[10px] text-secondary-400 mt-0.5 line-clamp-1">{product.description}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {(() => {
                                                    const summary = getVariantSummary(product.variants)
                                                    if (summary) {
                                                        if (summary.minPrice === summary.maxPrice) {
                                                            return <span className="text-sm font-semibold text-secondary-900">฿{summary.minPrice.toLocaleString()}</span>
                                                        } else {
                                                            return (
                                                                <div className="text-sm font-semibold text-secondary-900">
                                                                    <div>฿{summary.minPrice.toLocaleString()}</div>
                                                                    <div className="text-xs text-secondary-500">- ฿{summary.maxPrice.toLocaleString()}</div>
                                                                </div>
                                                            )
                                                        }
                                                    } else {
                                                        const prices = product.price ? [product.price] : []
                                                        if (prices.length === 0) return <span className="text-sm text-secondary-400">-</span>
                                                        return <span className="text-sm font-semibold text-secondary-900">฿{prices[0].toLocaleString()}</span>
                                                    }
                                                })()}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm text-secondary-600 font-medium">
                                                    {product.total_purchased ? product.total_purchased.toLocaleString() : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm text-secondary-600 font-medium">
                                                    {product.total_sold ? product.total_sold.toLocaleString() : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`text-sm font-semibold ${product.total_lost > 0 ? 'text-danger-600' : 'text-secondary-400'}`}>
                                                    {product.total_lost > 0 ? `- ${product.total_lost}` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                {(() => {
                                                    const summary = getVariantSummary(product.variants)
                                                    const stockValue = summary ? summary.totalStock : (product.stock || 0)
                                                    const minStockValue = summary ? summary.totalMinStock : (product.min_stock_level || 0)

                                                    return (
                                                        <div className="flex flex-col items-end">
                                                            {minStockValue > 0 ? (
                                                                <>
                                                                    {(() => {
                                                                        const pendingValue = product.total_pending || 0
                                                                        const balance = stockValue - pendingValue - minStockValue
                                                                        return (
                                                                            <>
                                                                                <span className={`text-sm font-semibold ${balance < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                                                                    {balance > 0 ? `+${balance}` : balance}
                                                                                </span>
                                                                                <div className="flex flex-col items-end text-xs text-secondary-400">
                                                                                    <span>(Stock: {stockValue})</span>
                                                                                    {pendingValue > 0 && <span>(Order: {pendingValue})</span>}
                                                                                </div>
                                                                            </>
                                                                        )
                                                                    })()}
                                                                </>
                                                            ) : (
                                                                <span className={`text-sm font-semibold ${stockValue > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                                                    {stockValue}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(product)} className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="แก้ไข">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(product.uuid)} className="p-2 text-secondary-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="ลบ">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && hasVariants && (
                                            <>
                                                {product.variants.map((variant, i) => (
                                                    <tr key={variant.id || `variant-${i}`} className="bg-secondary-50 border-t border-secondary-200">
                                                        <td className="px-4 py-3"></td>
                                                        <td className="px-4 py-3">
                                                            <div className="w-14 h-14 rounded-lg border border-secondary-200 overflow-hidden bg-white flex items-center justify-center">
                                                                {variant.images && variant.images[0] ? (
                                                                    <img src={variant.images[0]} alt={variant.color} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ImageIcon size={20} className="text-secondary-300" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-sm font-semibold text-secondary-900 block mb-1">
                                                                    {variant.sku}
                                                                </span>
                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-500">
                                                                    {product.name && <span className="font-medium text-secondary-700">{product.name}</span>}
                                                                    {product.material && (
                                                                        <span>
                                                                            • {cleanPrefix(product.material)}
                                                                        </span>
                                                                    )}
                                                                    {variant.dimensions && (variant.dimensions.length || variant.dimensions.width || variant.dimensions.height) && (
                                                                        <div className="flex items-center gap-1 text-secondary-500" title="ขนาด">
                                                                            <Scaling size={14} />
                                                                            <span>{variant.dimensions.length}×{variant.dimensions.width}×{variant.dimensions.height}cm</span>
                                                                        </div>
                                                                    )}
                                                                    {variant.color && (
                                                                        <div className="flex items-center gap-1 text-secondary-500" title="สี">
                                                                            <Palette size={14} />
                                                                            <span>{cleanPrefix(variant.color)}</span>
                                                                        </div>
                                                                    )}
                                                                    {variant.crystalColor && (
                                                                        <div className="flex items-center gap-1 text-secondary-500" title="สีคริสตัล">
                                                                            <Gem size={14} />
                                                                            <span>{cleanPrefix(variant.crystalColor)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {product.description && (
                                                                    <div className="text-[10px] text-secondary-400 mt-0.5 line-clamp-1">{product.description}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm font-semibold text-secondary-900">฿{variant.price?.toLocaleString() || 0}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm text-secondary-500">{variant.total_purchased?.toLocaleString() || '-'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm text-secondary-900 font-medium">{variant.total_sold?.toLocaleString() || '-'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="text-sm text-secondary-500">{variant.total_lost?.toLocaleString() || '-'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {(() => {
                                                                const stock = variant.stock || 0
                                                                const min = variant.minStock || 0
                                                                const pending = variant.pending_count || 0
                                                                const balance = stock - pending - min

                                                                return (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`text-sm font-semibold ${balance < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                                                            {balance > 0 ? `+${balance}` : balance}
                                                                        </span>
                                                                        <div className="flex flex-col items-end text-xs text-secondary-400">
                                                                            <span>(Stock: {stock})</span>
                                                                            {pending > 0 && <span>(Order: {pending})</span>}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })()}
                                                        </td>
                                                        <td className="px-4 py-3"></td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan="10" className="px-4 py-12 text-center text-secondary-500">
                                    <Package size={48} className="mx-auto mb-3 text-secondary-300" />
                                    <p className="text-lg font-medium">ไม่พบสินค้า</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between">
                    <div className="text-sm text-secondary-600">
                        แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            ก่อนหน้า
                        </button>
                        <span className="text-sm text-secondary-600">หน้า {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
