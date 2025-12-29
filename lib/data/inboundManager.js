/**
 * Inbound Manager
 * Handles logic for Inbound Station (Binding LPN, Evidence, etc.)
 */

import { supabase } from '../supabaseClient'

/**
 * Search Products by Keyword (SKU or Name)
 */
export const searchProducts = async (keyword) => {
    if (!keyword || keyword.length < 2) return []

    const { data, error } = await supabase
        .from('products')
        .select(`
            uuid, 
            name, 
            code:product_code,
            material,
            description,
            variants:product_variants(id, sku, color, size, crystal_color, image_url)
        `)
        .or(`name.ilike.%${keyword}%,product_code.ilike.%${keyword}%`)
        .limit(10)

    if (error) {
        console.error("Error searching products:", error)
        return []
    }

    // Map data to include a main image from the first variant if available
    return data.map(p => ({
        ...p,
        image: p.variants?.[0]?.image_url || null
    }))
}

/**
 * Bind LPN to Product (Create Inventory Item)
 */
export const bindLpnToProduct = async ({
    lpnCode,
    product,
    variantId = null,
    evidencePhotos = [],
    userId = 'system'
}) => {
    try {
        // 1. Validate LPN Uniqueness
        const { data: existing } = await supabase
            .from('inventory_items')
            .select('id')
            .eq('qr_code', lpnCode)
            .single()

        if (existing) {
            throw new Error(`LPN ${lpnCode} is already in use!`)
        }

        // 2. Create Inventory Item
        const isSwift = !product
        const newItem = {
            qr_code: lpnCode,
            product_id: product?.uuid || null,
            variant_id: variantId,
            status: isSwift ? 'pending_binding' : 'in_stock',
            current_location: 'Inbound Station',
            lpn_type: 'master',
            created_at: new Date().toISOString()
        }

        const { data: inventoryItem, error: insertError } = await supabase
            .from('inventory_items')
            .insert(newItem)
            .select()
            .single()

        if (insertError) throw insertError

        // 3. Save Evidence Photos
        if (evidencePhotos && evidencePhotos.length > 0) {
            const photosPayload = evidencePhotos.map(photo => {
                const photoUrl = typeof photo === 'string' ? photo : photo.url
                // Default tags for backward compatibility
                const photoTags = typeof photo === 'string' ? ['inbound'] : (photo.tags || ['inbound'])

                return {
                    inventory_item_id: inventoryItem.id,
                    photo_url: photoUrl,
                    tags: photoTags,
                    category: photo.category || 'Other',
                    captured_text: photo.captured_text || null,
                    custom_notes: photo.custom_notes || null,
                    created_by: userId
                }
            })

            const { error: photoError } = await supabase
                .from('evidence_photos')
                .insert(photosPayload)

            if (photoError) console.error("Error saving evidence photos:", photoError)
        }

        // 4. Log Tracking Event
        await supabase.from('item_tracking').insert({
            inventory_item_id: inventoryItem.id,
            step_status: 'Inbound/Bound',
            location_name: 'Inbound Station',
            notes: `Bound LPN ${lpnCode} to ${product.code}`,
            recorded_at: new Date().toISOString()
        })

        return inventoryItem
    } catch (error) {
        console.error("Error binding LPN:", error)
        throw error
    }
}

/**
 * Upload Evidence Photo
 */
export const uploadEvidencePhoto = async (file) => {
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `evidence/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('job-media') // Re-using existing bucket
        .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
        .from('job-media')
        .getPublicUrl(fileName)

    return data.publicUrl
}

/**
 * Bind Multiple LPNs as a Set (Multi-Box Item)
 */
export const bindLpnSetToProduct = async ({
    lpnList, // Array of strings ['LPN-001', 'LPN-002']
    product,
    variantId = null,
    evidencePhotos = [],
    userId = 'system'
}) => {
    try {
        if (!lpnList || lpnList.length === 0) throw new Error("No LPNs provided for binding")

        const totalBoxes = lpnList.length
        // Generate a human-readable 6-char Set ID (e.g. #7E4A2B)
        const setId = Math.random().toString(16).substring(2, 8).toUpperCase()
        const results = []

        // 1. Process each LPN in the set
        for (let i = 0; i < totalBoxes; i++) {
            const lpnCode = lpnList[i]
            const boxNumber = i + 1

            // Check Uniqueness
            const { data: existing } = await supabase
                .from('inventory_items')
                .select('id')
                .eq('qr_code', lpnCode)
                .single()

            if (existing) {
                throw new Error(`LPN ${lpnCode} is already in use!`)
            }

            // Create Item Payload
            const isSwift = !product
            const newItem = {
                qr_code: lpnCode,
                product_id: product?.uuid || null,
                variant_id: variantId,
                status: isSwift ? 'pending_binding' : 'in_stock',
                current_location: 'Inbound Station',
                lpn_type: 'master',
                set_id: setId,
                box_number: boxNumber,
                total_boxes: totalBoxes,
                created_at: new Date().toISOString()
            }

            // Insert Item
            const { data: inventoryItem, error: insertError } = await supabase
                .from('inventory_items')
                .insert(newItem)
                .select()
                .single()

            if (insertError) throw insertError
            results.push(inventoryItem)

            // Save Evidence
            if (evidencePhotos && evidencePhotos.length > 0) {
                const photosPayload = evidencePhotos.map(photo => {
                    const photoUrl = typeof photo === 'string' ? photo : photo.url
                    const photoTags = typeof photo === 'string' ? ['inbound', 'multi-box'] : (photo.tags || ['inbound', 'multi-box'])

                    return {
                        inventory_item_id: inventoryItem.id,
                        photo_url: photoUrl,
                        tags: photoTags,
                        category: photo.category || 'Other',
                        captured_text: photo.captured_text || null,
                        custom_notes: photo.custom_notes || null,
                        created_by: userId
                    }
                })

                await supabase.from('evidence_photos').insert(photosPayload)
            }

            // Log Tracking
            await supabase.from('item_tracking').insert({
                inventory_item_id: inventoryItem.id,
                step_status: 'Inbound/Bound',
                location_name: 'Inbound Station',
                notes: `Bound Multi-Box Item (${boxNumber}/${totalBoxes}) to ${product.code}`,
                recorded_at: new Date().toISOString()
            })
        }

        return results
    } catch (error) {
        console.error("Error binding LPN Set:", error)
        throw error
    }
}

/**
 * Check LPN for Resume (Find pending items to complete binding)
 */
export const checkLpnForResume = async (qrCode) => {
    const { data, error } = await supabase
        .from('inventory_items')
        .select(`
            *,
            product:products(*),
            variants:product_variants(*),
            photos:evidence_photos(*)
        `)
        .eq('qr_code', qrCode)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error("Error checking LPN:", error)
    }

    return data
}
