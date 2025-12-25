import React from 'react'
import Link from 'next/link'
import {
    Edit2, Trash2, Package, ImageIcon
} from 'lucide-react'
import { cleanPrefix } from '../lib/productHelpers'

export default function ProductCardGrid({
    products,
    totalItems,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleEdit,
    handleDelete
}) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.length > 0 ? (
                    products.map((product) => {
                        const hasVariants = product.variants && product.variants.length > 0
                        // Extract simplified info
                        const categoryName = cleanPrefix(product.category)
                        const materialName = cleanPrefix(product.material)

                        return (
                            <div key={product.uuid} className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                                <div className="aspect-square bg-secondary-50 relative overflow-hidden">
                                    {(() => {
                                        if (product.images && product.images[0]) {
                                            return <img src={product.images[0]} alt={product.product_code} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        }
                                        if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images[0]) {
                                            return <img src={product.variants[0].images[0]} alt={product.product_code} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        }
                                        return (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon size={48} className="text-secondary-300" />
                                            </div>
                                        )
                                    })()}
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link href={`/products/${product.uuid}`} className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                                            {product.product_code}
                                        </Link>
                                        {hasVariants && (
                                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium whitespace-nowrap flex items-center gap-1">
                                                🎨 {product.variants.length} สี
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-sm text-secondary-700 leading-relaxed mb-4 min-h-[3rem]">
                                        {(() => {
                                            const info = [
                                                categoryName,
                                                product.name,
                                                product.subcategory,
                                                materialName,
                                                (product.length || product.width || product.height) ? `${product.length || '-'}×${product.width || '-'}×${product.height || '-'} cm` : null
                                            ].filter(Boolean).join(' • ')

                                            return info || '-'
                                        })()}
                                    </div>

                                    {product.description && (
                                        <div className="text-xs text-secondary-500 mb-3 line-clamp-2">
                                            {product.description}
                                        </div>
                                    )}

                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between mb-3 border-t border-secondary-100 pt-3">
                                            {(() => {
                                                // Simplified Summary Logic (matching Table)
                                                // Ideally use getVariantSummary, but here we render minimal info
                                                const variants = product.variants || []

                                                // If no variants, use Product Price/Stock
                                                if (variants.length === 0) {
                                                    const price = product.price || 0
                                                    const stock = product.stock || 0
                                                    return (
                                                        <>
                                                            <span className="text-base font-bold text-secondary-900">
                                                                {price > 0 ? `฿${price.toLocaleString()}` : '-'}
                                                            </span>
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stock > 0 ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                                                                คงเหลือ {stock}
                                                            </span>
                                                        </>
                                                    )
                                                }

                                                // If variants, summarize
                                                const prices = variants.map(v => v.price || 0).filter(p => p > 0)
                                                const minPrice = prices.length > 0 ? Math.min(...prices) : 0
                                                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
                                                const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)

                                                return (
                                                    <>
                                                        <span className="text-base font-bold text-secondary-900">
                                                            {minPrice === maxPrice
                                                                ? (minPrice > 0 ? `฿${minPrice.toLocaleString()}` : '-')
                                                                : `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`
                                                            }
                                                        </span>
                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${totalStock > 0 ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                                                            คงเหลือ {totalStock}
                                                        </span>
                                                    </>
                                                )
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleEdit(product)} className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                                                <Edit2 size={14} />
                                                แก้ไข
                                            </button>
                                            <button onClick={() => handleDelete(product.uuid)} className="px-3 py-2 bg-danger-50 text-danger-700 rounded-lg hover:bg-danger-100 transition-colors" title="ลบ">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full py-12 text-center text-secondary-500">
                        <Package size={48} className="mx-auto mb-3 text-secondary-300" />
                        <p className="text-lg font-medium">ไม่พบสินค้า</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-secondary-200 px-6 py-4 mt-6">
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
        </>
    )
}
