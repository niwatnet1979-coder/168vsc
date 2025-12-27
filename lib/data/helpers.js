/**
 * Shared Helper Functions for Data Managers
 * Provides retry logic, error handling, and common utilities
 */

/**
 * Format a date string to "dd/MM/yyyy HH:mm"
 * @param {string|Date} date - The date to format
 * @param {boolean} includeTime - Whether to include the time (default: true)
 * @returns {string} Formatted date string or "-" if invalid
 */
export const formatDate = (date, includeTime = true) => {
    if (!date) return '-'
    try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return '-'

        // Asia/Bangkok Time (Indochina Time)
        // We can use native Intl for robustness
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Bangkok'
        }

        if (!includeTime) {
            delete options.hour
            delete options.minute
        }

        // Intl format usually returns dd/MM/yyyy, HH:mm depending on locale
        // For 'en-GB' it is dd/mm/yyyy
        const formatted = new Intl.DateTimeFormat('en-GB', options).format(d)

        // Ensure format dd/MM/yyyy HH:mm (Intl usually puts a comma)
        return formatted.replace(',', '')
    } catch (e) {
        console.error('Error formatting date:', e)
        return '-'
    }
}

/**
 * Helper to calculate Order Status from Items (Updated for 1:N Jobs)
 */
export const calculateOrderStatus = (items = []) => {
    if (!items || items.length === 0) return 'Pending'

    const statuses = items.map(i => {
        // 1. Try to use explicit item status (backward compat)
        if (i.status) return i.status.toLowerCase()

        // 2. Derive from Latest Job
        if (i.jobs && i.jobs.length > 0) {
            // Sort by sequence or created_at desc (assuming jobs ordered in query or we sort here)
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
 * Async delay helper
 */
export const _sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if error is a transient network error
 */
export const _isTransientNetworkError = (err) => {
    const msg = String(err?.message || '')
    return (
        err?.name === 'TypeError' ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('ERR_FAILED')
    )
}

/**
 * Retry logic with exponential backoff
 * @param {string} label - Operation label for logging
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of fn()
 */
export const _withRetry = async (label, fn, { retries = 3, baseDelayMs = 600 } = {}) => {
    let lastErr
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            lastErr = err
            const transient = _isTransientNetworkError(err)
            if (!transient || attempt === retries) throw err
            const waitMs = baseDelayMs * attempt
            console.warn(`[${label}] transient error, retrying in ${waitMs}ms (attempt ${attempt}/${retries})`, err)
            await _sleep(waitMs)
        }
    }
    throw lastErr
}
