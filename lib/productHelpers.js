/**
 * Product Helper Functions
 * Shared logic for Product Management components
 */

// Clean prefix like "AA " or "01 " from category/material
export const cleanPrefix = (str) => {
    if (!str) return null
    if (str.match(/^[A-Z]{2}\s/)) return str.substring(3)
    if (str.match(/^\d{2}\s/)) return str.substring(3)
    return str
}

// Calculate summary from variants (Price range, total stock)
export const getVariantSummary = (variants) => {
    if (!variants || variants.length === 0) return null

    const colorCount = variants.length
    const prices = variants.map(v => v.price || 0).filter(p => p > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)
    const totalMinStock = variants.reduce((sum, v) => sum + (v.minStock || 0), 0)

    // Note: totalPending is usually at Product level, not Variant level in current schema.
    // So we return 0 here and relying on passed product prop for pending counts.
    return { colorCount, minPrice, maxPrice, totalStock, totalMinStock, totalPending: 0 }
}
