import React from 'react'
import { Wrench } from 'lucide-react'
import ProductCard from './ProductCard'
import { currency } from '../lib/utils'

export default function ProductDetailView({ product, onEdit, hideEditButton = false }) {
    if (!product) return null

    // Helper to safety check strings
    const val = (v) => v || '-'

    // Construct a display product that forces the resolved image/price/stock
    // This represents the "Job Item" rather than the "Catalog Product"
    const displayProduct = {
        ...product,
        name: product.name || product.productName,
        product_code: product.code || product.productId,
        variants: [{
            price: product.unitPrice || product.price || 0,
            stock: product.stock || 0,
            // Prioritize resolved image_url from DataManager, then image, then first variant image
            images: [
                product.image_url ||
                product.image ||
                (product.variants && product.variants.length > 0 ? product.variants[0].images?.[0] : null) ||
                ''
            ].filter(Boolean)
        }]
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-4 h-full flex flex-col">
            {/* Product Card Summary */}
            <div className="mb-4">
                <ProductCard
                    product={displayProduct}
                    showPrice={true}
                    showStock={true}
                />
            </div>

            <div className="flex-1 space-y-4">
                {/* Variant */}
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                    <label className="block text-xs font-medium text-secondary-500 mb-1">Variant</label>
                    <div className="text-sm font-medium text-secondary-900">
                        {(() => {
                            if (product.variantStr) return product.variantStr

                            // Try to get from selectedVariant object
                            if (product.selectedVariant) {
                                const v = product.selectedVariant
                                const parts = []
                                if (v.color) parts.push(v.color)
                                if (v.dimensions) parts.push(`${v.dimensions.length || 0}x${v.dimensions.width || 0}x${v.dimensions.height || 0}cm`)
                                if (parts.length > 0) return parts.join(' • ')
                            }

                            // Try to get from array index
                            if (product.selectedVariantIndex !== undefined && product.variants?.length > product.selectedVariantIndex) {
                                const v = product.variants[product.selectedVariantIndex]
                                return v.color || 'Selected'
                            }

                            return '-'
                        })()}
                    </div>
                </div>

                {/* Grid Options */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">สีแสงไฟ</label>
                        <div className="text-sm text-secondary-900">{val(product.lightColor)}</div>
                    </div>
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">สีคริสตัล</label>
                        <div className="text-sm text-secondary-900">{val(product.crystalColor)}</div>
                    </div>
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทหลอดไฟ</label>
                        <div className="text-sm text-secondary-900">{val(product.bulbType)}</div>
                    </div>
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">รีโมท</label>
                        <div className="text-sm text-secondary-900">{val(product.remote)}</div>
                    </div>
                </div>

                {/* Remark */}
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                    <label className="block text-xs font-medium text-secondary-500 mb-1">หมายเหตุ</label>
                    <div className="text-sm text-secondary-900">{val(product.remark)}</div>
                </div>

                {/* Price Calculation */}
                <div className="border-t border-secondary-200 pt-3 flex justify-between items-center">
                    <div className="text-sm text-secondary-600">
                        {product.qty || 1} x {currency(product.unitPrice || product.price)}
                    </div>
                    <div className="text-lg font-bold text-primary-600">
                        {currency((product.qty || 1) * (product.unitPrice || product.price || 0))}
                    </div>
                </div>
            </div>

            {/* Edit Button */}
            {!hideEditButton && (
                <div className="mt-6">
                    <button
                        onClick={onEdit}
                        className="w-full py-2.5 bg-white border border-secondary-300 text-secondary-700 font-medium rounded-lg hover:bg-secondary-50 flex items-center justify-center gap-2"
                    >
                        <Wrench size={18} />
                        แก้ไขข้อมูล
                    </button>
                </div>
            )}
        </div>
    )
}
