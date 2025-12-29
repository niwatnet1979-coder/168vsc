import React from 'react'
import { Package, Tag, Box } from 'lucide-react'

const CodeIcon = () => <Package size={12} className="text-secondary-400" />
const TagIcon = () => <Tag size={12} className="text-secondary-400" />
const MaterialIcon = () => <Box size={12} className="text-secondary-400" />

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
    className = '',
    image = null // FIX: Accept explicit image override
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
    const productCode = product.product_code || product.code

    // Compact variant (for search dropdown)
    if (variant === 'compact') {
        return (
            <div className={`flex items-center gap-3 w-full ${className}`}>
                {showImage && (
                    <div className="w-12 h-12 flex-shrink-0 bg-secondary-100 rounded-lg overflow-hidden border border-secondary-100 flex items-center justify-center text-secondary-300 relative">
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
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-sm truncate pr-2 text-secondary-900">
                            {product.name}
                        </div>
                        <div className="text-primary-600 font-bold text-sm whitespace-nowrap">
                            {priceDisplay}
                        </div>
                    </div>

                    <div className="text-[11px] text-secondary-500 flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 leading-none">
                        <div className="flex items-center gap-1">
                            <CodeIcon />
                            <span>{productCode}</span>
                        </div>
                        {product.category && (
                            <div className="flex items-center gap-1">
                                <TagIcon />
                                <span>{product.category}</span>
                            </div>
                        )}
                        {product.material && (
                            <div className="flex items-center gap-1">
                                <MaterialIcon />
                                <span>{product.material}</span>
                            </div>
                        )}
                        <div className="ml-auto flex items-center gap-1.5 px-0.5">
                            {showStock && (
                                <span className="text-secondary-400 text-[10px]">คงเหลือ {totalStock}</span>
                            )}
                        </div>
                    </div>
                </div>
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
                <div className="flex items-start gap-4">
                    {showImage && (
                        <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-secondary-100">
                            {product.variants?.[0]?.images?.[0] ? (
                                <img
                                    src={product.variants[0].images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package size={32} className="text-secondary-400" />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0 py-1">
                        <div className="font-bold text-lg text-secondary-900 leading-tight">{product.name}</div>
                        <div className="text-sm text-secondary-500 mt-1">
                            {productCode}
                            {product.category && ` • ${product.category}`}
                            {product.material && ` • ${product.material}`}
                        </div>
                        {product.description && (
                            <div className="text-sm text-secondary-500 mt-2 line-clamp-2">
                                {product.description}
                            </div>
                        )}
                    </div>
                    {showPrice && (
                        <div className="text-right flex-shrink-0 py-1">
                            <div className="font-bold text-primary-600 text-xl">{priceDisplay}</div>
                            {showStock && (
                                <div className="text-sm text-secondary-600 mt-1">คงเหลือ {totalStock}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Default variant (for selected product display)
    return (
        <div className={`bg-transparent ${className}`}>
            <div className="px-0 py-0">
                <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-secondary-500 font-medium whitespace-nowrap text-sm">{productCode}</span>
                        <span className="font-bold text-secondary-900 truncate text-sm">{product.name}</span>
                    </div>
                    <div className="font-bold text-primary-600 whitespace-nowrap text-sm">{priceDisplay}</div>
                </div>

                <div className="flex justify-between items-center text-xs text-secondary-500">
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                        <span>{product.material || 'ไม่ระบุวัสดุ'}</span>
                    </div>
                    <div>{product.variants?.length || 0} แบบ • คงเหลือ {totalStock}</div>
                </div>
            </div>
        </div>
    )
}
