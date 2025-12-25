/**
 * Validation Utilities
 * Helper functions for data validation
 */

/**
 * Check if a string is a valid UUID v4
 */
export function validUUID(str) {
    if (!str || typeof str !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

/**
 * Check if error is a transient network error
 */
export function isTransientNetworkError(err) {
    const msg = String(err?.message || '')
    return (
        err?.name === 'TypeError' ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('ERR_FAILED')
    )
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    if (!email) return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate phone number (Thai format)
 */
export function isValidPhone(phone) {
    if (!phone) return false
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '')
    // Thai phone: 10 digits starting with 0, or 9 digits
    return /^0\d{9}$/.test(cleaned) || /^\d{9}$/.test(cleaned)
}

/**
 * Validate required fields in an object
 */
export function validateRequired(obj, requiredFields) {
    const missing = []
    for (const field of requiredFields) {
        if (!obj[field]) {
            missing.push(field)
        }
    }
    return {
        isValid: missing.length === 0,
        missing
    }
}

/**
 * Sanitize string input
 */
export function sanitizeString(str) {
    if (!str || typeof str !== 'string') return ''
    return str.trim()
}

/**
 * Validate number range
 */
export function isInRange(value, min, max) {
    const num = Number(value)
    if (isNaN(num)) return false
    return num >= min && num <= max
}
