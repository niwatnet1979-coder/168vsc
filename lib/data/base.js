/**
 * Base Data Module
 * Supabase client and shared utilities for data operations
 */

import { supabase } from '../supabaseClient'

// Re-export supabase client
export { supabase }

/**
 * Sleep utility for retry logic
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if error is a transient network error
 */
export const isTransientNetworkError = (err) => {
    const msg = String(err?.message || '')
    return (
        err?.name === 'TypeError' ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('ERR_FAILED')
    )
}

/**
 * Retry wrapper for transient errors
 * @param {string} label - Label for logging
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.retries - Number of retries (default: 3)
 * @param {number} options.baseDelayMs - Base delay in ms (default: 600)
 */
export const withRetry = async (label, fn, { retries = 3, baseDelayMs = 600 } = {}) => {
    let lastErr
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (err) {
            lastErr = err
            const transient = isTransientNetworkError(err)
            if (!transient || attempt === retries) throw err
            const waitMs = baseDelayMs * attempt
            console.warn(`[${label}] transient error, retrying in ${waitMs}ms (attempt ${attempt}/${retries})`, err)
            await sleep(waitMs)
        }
    }
    throw lastErr
}

/**
 * Execute query with retry logic
 */
export const executeWithRetry = async (label, queryFn, options = {}) => {
    return await withRetry(label, queryFn, options)
}

/**
 * Check if value is a valid UUID
 */
export const isValidUUID = (str) => {
    if (!str || typeof str !== 'string') return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
}

/**
 * Generate a simple ID (for temporary use)
 */
export const generateTempId = (prefix = 'temp') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Handle Supabase error
 */
export const handleSupabaseError = (error, context = '') => {
    console.error(`[Supabase Error${context ? ` - ${context}` : ''}]:`, error)

    return {
        success: false,
        error: error.message || 'Unknown error',
        code: error.code,
        details: error.details
    }
}

/**
 * Handle Supabase success
 */
export const handleSupabaseSuccess = (data, message = 'Success') => {
    return {
        success: true,
        data,
        message
    }
}
