/**
 * Calculation Utilities
 * Helper functions for business calculations
 */

/**
 * Calculate order status from items
 */
export function calculateOrderStatus(items = []) {
    if (!items || items.length === 0) return 'Pending'

    const statuses = items.map(i => {
        // 1. Try to use explicit item status (backward compat)
        if (i.status) return i.status.toLowerCase()

        // 2. Derive from Latest Job
        if (i.jobs && i.jobs.length > 0) {
            // Sort by created_at desc
            const jobs = [...i.jobs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            const latestJob = jobs[0]
            const s = latestJob.status || 'รอดำเนินการ'

            if (s === 'เสร็จสิ้น' || s === 'completed') return 'completed'
            if (s === 'ยกเลิก' || s === 'cancelled') return 'cancelled'
            if (s === 'กำลังดำเนินการ' || s === 'processing') return 'processing'
            return 'pending'
        }

        return 'pending'
    })

    if (statuses.every(s => s === 'cancelled')) return 'Cancelled'
    if (statuses.every(s => s === 'completed' || s === 'cancelled')) return 'Completed'
    if (statuses.some(s => s === 'processing' || s === 'completed')) return 'Processing'

    return 'Pending'
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d
}

/**
 * Convert degrees to radians
 */
export function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

/**
 * Calculate subtotal from items
 */
export function calculateSubtotal(items = []) {
    return items.reduce((sum, item) => {
        const qty = Number(item.qty || 0)
        const price = Number(item.unitPrice || 0)
        return sum + (qty * price)
    }, 0)
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal, discount) {
    if (!discount || !discount.value) return 0

    if (discount.mode === 'percent') {
        return subtotal * (Number(discount.value) / 100)
    }

    return Number(discount.value)
}

/**
 * Calculate VAT amount
 */
export function calculateVAT(amount, vatRate, vatIncluded = false) {
    const rate = Number(vatRate) || 0
    if (rate === 0) return 0

    if (vatIncluded) {
        // VAT is already included in amount
        return amount - (amount / (1 + rate / 100))
    } else {
        // VAT needs to be added
        return amount * (rate / 100)
    }
}

/**
 * Calculate total amount
 */
export function calculateTotal(subtotal, shippingFee = 0, discount = 0, vatRate = 0, vatIncluded = false) {
    const afterDiscount = Math.max(0, subtotal + Number(shippingFee) - discount)
    const vatAmount = calculateVAT(afterDiscount, vatRate, vatIncluded)

    if (vatIncluded) {
        return afterDiscount
    } else {
        return afterDiscount + vatAmount
    }
}

/**
 * Calculate payment balance
 */
export function calculateBalance(total, payments = []) {
    const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    return total - paid
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
    if (!total || total === 0) return 0
    return (value / total) * 100
}
