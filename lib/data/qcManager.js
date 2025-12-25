/**
 * QC Manager - Quality Control Operations
 * Handles QC queue, records, and evidence
 */

import { supabase } from '../supabaseClient'
import { logTrackingEvent } from './inventoryManager'

/**
 * Get QC queue (items pending inspection)
 */
export const getQCQueue = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
                *,
                product:products (id, name, code, image)
            `)
            .eq('status', 'in_stock')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching QC queue:", error)
        return []
    }
}

/**
 * Save QC record with evidence and inventory updates
 */
export const saveQCRecord = async (recordData) => {
    if (!supabase) return false
    try {
        // 1. Insert QC Record
        const { data: qcRecord, error: qcError } = await supabase
            .from('qc_records')
            .insert({
                inventory_item_id: recordData.inventory_item_id,
                inspector_name: recordData.inspector_name,
                status: recordData.status,
                checklist_results: recordData.checklist_results,
                notes: recordData.notes
            })
            .select()
            .single()

        if (qcError) throw qcError

        // 2. Upload Evidence (if any)
        if (recordData.evidenceFiles && recordData.evidenceFiles.length > 0) {
            for (const file of recordData.evidenceFiles) {
                const timestamp = Date.now()
                const fileExt = file.name.split('.').pop()
                const filePath = `qc/${qcRecord.id}/${timestamp}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('job-media')
                    .upload(filePath, file)

                if (!uploadError) {
                    const { data: publicData } = supabase.storage
                        .from('job-media')
                        .getPublicUrl(filePath)

                    await supabase.from('qc_evidence').insert({
                        qc_record_id: qcRecord.id,
                        media_type: file.type.startsWith('video') ? 'video' : 'image',
                        media_url: publicData.publicUrl,
                        description: 'Inspection Evidence'
                    })
                }
            }
        }

        // 3. Update Inventory Status
        const updates = {}
        let newStatus = 'in_stock'
        if (recordData.status === 'fail') newStatus = 'damaged'
        if (recordData.status === 'rework') newStatus = 'maintenance'
        updates.status = newStatus

        if (recordData.serial_number) {
            updates.serial_number = recordData.serial_number
        }

        // Handle Product Swap (Blind Check-in)
        if (recordData.new_product_id) {
            const { data: oldItem } = await supabase
                .from('inventory_items')
                .select('product_id')
                .eq('id', recordData.inventory_item_id)
                .single()

            if (oldItem && oldItem.product_id !== recordData.new_product_id) {
                updates.product_id = recordData.new_product_id

                // Log the swap
                await logTrackingEvent(
                    recordData.inventory_item_id,
                    'Product Identified',
                    'QC Station',
                    `Changed Product ID from ${oldItem.product_id} to ${recordData.new_product_id}`
                )
            }
        }

        await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', recordData.inventory_item_id)

        // 4. Log Tracking
        await logTrackingEvent(
            recordData.inventory_item_id,
            `QC: ${recordData.status.toUpperCase()}`,
            'QC Station',
            `Result: ${recordData.status}, Notes: ${recordData.notes}`
        )

        return true
    } catch (error) {
        console.error("Error saving QC record:", error)
        throw error
    }
}

/**
 * Get QC history for an item
 */
export const getQCRecords = async (inventoryItemId) => {
    try {
        const { data, error } = await supabase
            .from('qc_records')
            .select('*')
            .eq('inventory_item_id', inventoryItemId)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error("Error getting QC records:", error)
        return []
    }
}

/**
 * Get low stock items (for reordering)
 */
export const getLowStockItems = async () => {
    if (!supabase) return []
    try {
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select(`
                uuid, 
                name, 
                product_code, 
                category, 
                variants:product_variants(id, color, size, crystal_color, image_url)
            `)

        if (prodError) throw prodError

        const { data: activeItems, error: itemError } = await supabase
            .from('order_items')
            .select('product_id, quantity, product_variant_id, status')
            .in('status', ['Pending', 'Processing', 'Confirmed', 'pending', 'processing', 'confirmed'])

        const contentMap = {}

        if (!itemError && activeItems) {
            activeItems.forEach(item => {
                const product = products.find(p => p.uuid === item.product_id)
                if (product) {
                    const variantIndex = (product.variants || []).findIndex(v => v.id === item.product_variant_id)
                    const key = `${product.product_code}_${variantIndex >= 0 ? variantIndex : 0}`
                    contentMap[key] = (contentMap[key] || 0) + (parseInt(item.quantity) || 0)
                }
            })
        }

        const lowStock = []

        products.forEach(product => {
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach((variant, index) => {
                    const minStock = parseInt(variant.minStock || 0)
                    const currentStock = parseInt(variant.stock || 0)

                    const matchKey = `${product.product_code}_${index}`
                    const allocatedQty = contentMap[matchKey] || 0
                    const totalNeeded = minStock + allocatedQty

                    if (currentStock < totalNeeded) {
                        lowStock.push({
                            id: `${product.uuid}_v${index}`,
                            product_id: product.uuid,
                            uuid: product.uuid,
                            name: product.name,
                            category: product.category,
                            variant_color: variant.color,
                            variant_crystal: variant.crystalColor,
                            current_stock: currentStock,
                            min_stock_level: minStock,
                            allocated_qty: allocatedQty,
                            reorder_qty: totalNeeded - currentStock
                        })
                    }
                })
            }
        })

        return lowStock
    } catch (error) {
        console.error("Error fetching low stock items:", error)
        return []
    }
}
