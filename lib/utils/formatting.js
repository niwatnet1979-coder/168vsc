/**
 * Formatting Utilities
 * Helper functions for formatting data (dates, currency, addresses, etc.)
 */

/**
 * Format currency (Thai Baht)
 */
export function currency(amount, options = {}) {
    const {
        decimals = 2,
        symbol = '฿',
        showSymbol = true
    } = options

    const num = Number(amount) || 0
    const formatted = num.toLocaleString('th-TH', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    })

    return showSymbol ? `${symbol}${formatted}` : formatted
}

/**
 * Format date to Thai format
 */
export function formatDate(date, format = 'short') {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const options = {
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        long: { year: 'numeric', month: 'long', day: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' }
    }

    return d.toLocaleDateString('th-TH', options[format] || options.short)
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    return d.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Format phone number (Thai format)
 */
export function formatPhone(phone) {
    if (!phone) return ''

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '')

    // Format as XXX-XXX-XXXX or XX-XXXX-XXXX
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 9) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
    }

    return phone
}

/**
 * Format address for display
 */
export function formatAddress(address) {
    if (!address) return ''

    if (typeof address === 'string') return address

    const parts = []
    if (address.address) parts.push(address.address)
    if (address.district) parts.push(address.district)
    if (address.province) parts.push(address.province)
    if (address.postalCode) parts.push(address.postalCode)

    return parts.join(', ')
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 2) {
    const num = Number(value) || 0
    return `${num.toFixed(decimals)}%`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}
