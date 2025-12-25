/**
 * Upload Manager - File Upload Operations
 * Handles all file uploads to Supabase Storage
 */

import { supabase } from '../supabaseClient'

/**
 * Generic file upload
 */
export const uploadFile = async (file, path) => {
    if (!supabase) return null
    try {
        const bucket = 'employee-documents'
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `${path}/${fileName}`

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file)

        if (error) throw error

        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return publicData.publicUrl
    } catch (error) {
        console.error('Error uploading file:', error)
        return null
    }
}

/**
 * Upload shop asset (e.g., PromptPay QR)
 */
export const uploadShopAsset = async (file) => {
    if (!supabase) return null
    try {
        const bucket = 'shop-assets'
        const fileExt = file.name.split('.').pop()
        const fileName = `promptpay_qr_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file)

        if (error) throw error

        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return { success: true, url: publicData.publicUrl }
    } catch (error) {
        console.error('Error uploading shop asset:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Upload signature (base64 to storage)
 */
export const uploadSignature = async (signatureBase64, orderId, paymentIndex, type) => {
    console.log(`[uploadSignature] Called for ${type} signature, order: ${orderId}, index: ${paymentIndex}`)

    if (!supabase) {
        console.log('[uploadSignature] No supabase client')
        return null
    }

    if (!signatureBase64) {
        console.log('[uploadSignature] No signature data')
        return null
    }

    try {
        // Convert base64 to blob
        const base64Data = signatureBase64.replace(/^data:image\/\w+;base64,/, '')
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })

        // Generate unique filename
        const timestamp = Date.now()
        const filePath = `${orderId}/${type}-signature-${paymentIndex}-${timestamp}.png`

        console.log(`[uploadSignature] Uploading to: ${filePath}`)

        // Upload to storage
        const { data, error } = await supabase.storage
            .from('signatures')
            .upload(filePath, blob)

        if (error) {
            console.error('[uploadSignature] Upload error:', error)
            throw error
        }

        console.log('[uploadSignature] Upload successful:', data)

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('signatures')
            .getPublicUrl(filePath)

        console.log('[uploadSignature] Public URL:', publicData.publicUrl)
        return publicData.publicUrl
    } catch (error) {
        console.error('[uploadSignature] Error uploading signature:', error)
        return null
    }
}

/**
 * Upload product image
 */
export const uploadProductImage = async (imageFile, productId) => {
    console.log(`[uploadProductImage] Called for product: ${productId}`)

    if (!supabase) {
        console.log('[uploadProductImage] No supabase client')
        return null
    }

    if (!imageFile) {
        console.log('[uploadProductImage] No image file provided')
        return null
    }

    try {
        // Generate unique filename
        const timestamp = Date.now()
        const fileExt = imageFile.name.split('.').pop()
        const filePath = `${productId}/${timestamp}.${fileExt}`

        console.log(`[uploadProductImage] Uploading to: ${filePath}`)

        // Upload file
        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, imageFile)

        if (error) {
            console.error('[uploadProductImage] Upload error:', error)
            throw error
        }

        console.log('[uploadProductImage] Upload successful:', data)

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

        console.log('[uploadProductImage] Public URL:', publicData.publicUrl)
        return publicData.publicUrl
    } catch (error) {
        console.error('[uploadProductImage] Error uploading image:', error)
        return null
    }
}

/**
 * Upload payment slip
 */
export const uploadPaymentSlip = async (imageFile, orderId, paymentIndex) => {
    console.log(`[uploadPaymentSlip] Called for order: ${orderId}, payment: ${paymentIndex}`)

    if (!supabase) {
        console.log('[uploadPaymentSlip] No supabase client')
        return null
    }

    if (!imageFile) {
        console.log('[uploadPaymentSlip] No image file provided')
        return null
    }

    try {
        // Generate unique filename
        const timestamp = Date.now()
        const fileExt = imageFile.name?.split('.').pop() || 'jpg'
        const filePath = `${orderId}/payment-${paymentIndex}-${timestamp}.${fileExt}`

        console.log(`[uploadPaymentSlip] Uploading to: ${filePath}`)

        // Upload file
        const { data, error } = await supabase.storage
            .from('payment-slips')
            .upload(filePath, imageFile)

        if (error) {
            console.error('[uploadPaymentSlip] Upload error:', error)
            throw error
        }

        console.log('[uploadPaymentSlip] Upload successful:', data)

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('payment-slips')
            .getPublicUrl(filePath)

        console.log('[uploadPaymentSlip] Public URL:', publicData.publicUrl)
        return publicData.publicUrl
    } catch (error) {
        console.error('[uploadPaymentSlip] Error uploading slip:', error)
        return null
    }
}

/**
 * Upload job media (photos/videos)
 */
export const uploadJobMedia = async (file, jobId) => {
    if (!supabase || !file) return null
    try {
        const timestamp = Date.now()
        const fileExt = file.name?.split('.').pop() || 'jpg'
        // Organize by jobId
        const filePath = `${jobId}/${timestamp}.${fileExt}`

        // Normalize Content-Type for videos to ensure browser compatibility (iOS .MOV -> video/mp4)
        let contentType = file.type
        if (file.type === 'video/quicktime' || fileExt.toLowerCase() === 'mov' || file.type.startsWith('video/')) {
            contentType = 'video/mp4'
        }

        const { data, error } = await supabase.storage
            .from('job-media')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: contentType,
                upsert: false
            })

        if (error) throw error

        const { data: publicData } = supabase.storage
            .from('job-media')
            .getPublicUrl(filePath)

        return publicData.publicUrl
    } catch (error) {
        console.error('Error uploading job media:', error)
        return null
    }
}
