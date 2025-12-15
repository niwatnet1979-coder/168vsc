import React from 'react'
import { Package } from 'lucide-react'

/**
 * ProductCard - Reusable component for displaying product information
 * Used in: OrderItemModal (selected product), Product search dropdown
 */
export default function ProductCard({
    product,
    variant = 'default', // 'default' | 'compact' | 'search'
    showImage = true,
    showPrice = true,
    showStock = true,
    className = ''
}) {
    if (!product) return null

    // Calculate price range from variants
    const getPriceDisplay = () => {
        if (!product.variants || product.variants.length === 0) {
            return '฿0'
        }

        const prices = product.variants.map(v => v.price).filter(p => p > 0)
        if (prices.length === 0) return '฿0'

        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)

        if (minPrice === maxPrice) {
            return `฿${minPrice.toLocaleString()}`
        }
        return `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`
    }

    // Calculate total stock from variants
    const getTotalStock = () => {
        if (!product.variants || product.variants.length === 0) return 0
        return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    }

    const priceDisplay = getPriceDisplay()
    const totalStock = getTotalStock()
    const productCode = product.product_code || product.id || product.code

    // Compact variant (for search dropdown)
    if (variant === 'compact') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                {showImage && (
                    <div className="w-12 h-12 flex-shrink-0 bg-secondary-100 rounded overflow-hidden">
                        {product.variants?.[0]?.images?.[0] ? (
                            <img
                                src={product.variants[0].images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package size={20} className="text-secondary-400" />
                            </div>
                        )}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-secondary-900 truncate">{product.name}</div>
                    <div className="text-xs text-secondary-500">
                        {productCode}
                        {product.category && ` • ${product.category}`}
                        {product.material && ` • ${product.material}`}
                    </div>
                </div>
                {showPrice && (
                    <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-primary-600">{priceDisplay}</div>
                        {showStock && (
                            <div className="text-xs text-secondary-500">คงเหลือ {totalStock}</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // Search variant (for dropdown list)
    if (variant === 'search') {
        return (
            <div className={`flex items-start gap-3 p-3 hover:bg-secondary-50 rounded-lg transition-colors ${className}`}>
                {showImage && (
                    <div className="w-16 h-16 flex-shrink-0 bg-secondary-100 rounded overflow-hidden">
                        {product.variants?.[0]?.images?.[0] ? (
                            <img
                                src={product.variants[0].images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} className="text-secondary-400" />
                            </div>
                        )}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-secondary-900">{product.name}</div>
                    <div className="text-sm text-secondary-600 mt-0.5">
                        {productCode}
                        {product.category && ` • ${product.category}`}
                        {product.material && ` • ${product.material}`}
                    </div>
                    {product.description && (
                        <div className="text-xs text-secondary-500 mt-1 line-clamp-2">
                            {product.description}
                        </div>
                    )}
                </div>
                {showPrice && (
                    <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-primary-600 text-sm">{priceDisplay}</div>
                        {showStock && (
                            <div className="text-xs text-secondary-500 mt-0.5">คงเหลือ {totalStock}</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // Ghost variant (for seamless embedding)
    if (variant === 'ghost') {
        return (
            <div className={`bg-transparent ${className}`}>
                <div className="flex items-start gap-3">
                    {showImage && (
                        <div className="w-12 h-12 flex-shrink-0 bg-white rounded overflow-hidden border border-secondary-200">
                            {product.variants?.[0]?.images?.[0] ? (
                                <img
                                    src={product.variants[0].images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={20} className="text-secondary-400" />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-secondary-900">{product.name}</div>
                        <div className="text-sm text-secondary-600 mt-0.5">
                            {productCode}
                            {product.category && ` • ${product.category}`}
                        </div>
                        {product.description && (
                            <div className="text-xs text-secondary-500 mt-1 truncate">
                                {product.description}
                            </div>
                        )}
                    </div>
                    {showPrice && (
                        <div className="text-right flex-shrink-0">
                            <div className="font-bold text-primary-600">{priceDisplay}</div>
                            {showStock && (
                                <div className="text-xs text-secondary-500 mt-0.5">คงเหลือ {totalStock}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Default variant (for selected product display)
    return (
        <div className={`bg-white border border-secondary-200 rounded-xl shadow-sm ${className}`}>
            <div className="p-3 flex items-start gap-3">
                {showImage && (
                    <div className="w-16 h-16 flex-shrink-0 bg-secondary-100 rounded overflow-hidden">
                        {product.variants?.[0]?.images?.[0] ? (
                            <img
                                src={product.variants[0].images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} className="text-secondary-400" />
                            </div>
                        )}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-secondary-900">{product.name}</div>
                    <div className="text-sm text-secondary-600 mt-1">
                        {productCode}
                        {product.category && ` • ${product.category}`}
                        {product.material && ` • ${product.material}`}
                    </div>
                    {product.description && (
                        <div className="text-xs text-secondary-500 mt-2">
                            {product.description}
                        </div>
                    )}
                </div>
                {showPrice && (
                    <div className="text-right flex-shrink-0">
                        <div className="font-bold text-primary-600">{priceDisplay}</div>
                        {showStock && (
                            <div className="text-sm text-secondary-600 mt-1">คงเหลือ {totalStock}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
