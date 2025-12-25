/**
 * Inventory Manager - Inventory and Tracking Operations
 * Handles inventory items, purchase orders, and item tracking
 */

import { supabase } from '../supabaseClient'

/**
 * Get item tracking history
 */
export const getItemTrackingHistory = async (inventoryItemId) => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('item_tracking')
            .select('*')
            .eq('inventory_item_id', inventoryItemId)
            .order('recorded_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching tracking history:", error)
        return []
    }
}

/**
 * Log tracking event
 */
export const logTrackingEvent = async (inventoryItemId, status, location, notes = '') => {
    if (!supabase) return false
    try {
        const { error } = await supabase
            .from('item_tracking')
            .insert({
                inventory_item_id: inventoryItemId,
                step_status: status,
                location_name: location,
                notes: notes,
                recorded_at: new Date().toISOString()
            })

        if (error) throw error
        return true
    } catch (error) {
        console.error("Error logging tracking event:", error)
        return false
    }
}

/**
 * Receive Purchase Order (Convert to Inventory)
 */
export const receivePurchaseOrder = async (poId) => {
    try {
        // Get PO with items
        const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(
                    *,
                    product:products(*)
                )
            `)
            .eq('id', poId)
            .single()

        if (poError) throw poError
        if (!po || !po.items || po.items.length === 0) throw new Error("PO not found or empty")

        const inventoryItemsToInsert = []
        const timestamp = Date.now().toString(36)

        // Loop through PO items
        for (const item of po.items) {
            const qty = item.quantity || 1
            const productCode = item.product?.product_code || item.product?.code || 'ITEM'

            for (let i = 0; i < qty; i++) {
                const random = Math.random().toString(36).substring(2, 6)
                const uniqueQR = `${productCode}-${timestamp}-${random}-${i}`.toUpperCase()

                inventoryItemsToInsert.push({
                    product_id: item.product.id || item.product.uuid,
                    qr_code: uniqueQR,
                    status: 'in_stock',
                    current_location: 'Warehouse_Main',
                    lot_number: `PO-${po.id.substring(0, 6)}`
                })
            }
        }

        // Batch Insert Inventory Items
        const { data: insertedItems, error: insertError } = await supabase
            .from('inventory_items')
            .insert(inventoryItemsToInsert)
            .select()

        if (insertError) throw insertError

        // Create Logs
        const logs = insertedItems.map(invItem => ({
            inventory_item_id: invItem.id,
            action: 'check_in',
            quantity_change: 1,
            reason: `Received from PO #${po.id.substring(0, 8)}`,
            created_by: 'System'
        }))

        await supabase.from('inventory_logs').insert(logs)

        // Log Initial Tracking Event
        const trackingEvents = insertedItems.map(invItem => ({
            inventory_item_id: invItem.id,
            step_status: 'Received',
            location_name: 'Warehouse_Main (Receiving Dock)',
            notes: `Initial Receipt from PO #${po.id.substring(0, 8)}`,
            recorded_at: new Date().toISOString()
        }))

        await supabase.from('item_tracking').insert(trackingEvents)

        // Update PO Status
        const { error: updateError } = await supabase
            .from('purchase_orders')
            .update({ status: 'received' })
            .eq('id', poId)

        if (updateError) throw updateError

        return true
    } catch (error) {
        console.error("Error receiving PO:", error)
        throw error
    }
}

/**
 * Get inventory items
 */
export const getInventoryItems = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
                *,
                product:products(*)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching inventory items:", error)
        return []
    }
}

/**
 * Add inventory item
 */
export const addInventoryItem = async (itemData) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .insert(itemData)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error adding inventory item:", error)
        return null
    }
}

/**
 * Update inventory item
 */
export const updateInventoryItem = async (id, updates) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error updating inventory item:", error)
        return null
    }
}

/**
 * Log inventory action
 */
export const logInventoryAction = async (logData) => {
    if (!supabase) return false
    try {
        const { error } = await supabase
            .from('inventory_logs')
            .insert(logData)

        if (error) throw error
        return true
    } catch (error) {
        console.error("Error logging inventory action:", error)
        return false
    }
}

/**
 * Get purchase orders
 */
export const getPurchaseOrders = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(
                    *,
                    product:products(*)
                )
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching purchase orders:", error)
        return []
    }
}

/**
 * Create purchase order with items
 */
export const createPurchaseOrderWithItems = async (poData, items) => {
    if (!supabase) return null
    try {
        // Create PO header
        const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .insert(poData)
            .select()
            .single()

        if (poError) throw poError

        // Create PO items
        const itemsWithPoId = items.map(item => ({
            ...item,
            purchase_order_id: po.id
        }))

        const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsWithPoId)

        if (itemsError) throw itemsError

        return po
    } catch (error) {
        console.error("Error creating purchase order:", error)
        return null
    }
}

/**
 * Delete purchase order
 */
export const deletePurchaseOrder = async (id) => {
    if (!supabase) return false
    try {
        // Delete items first
        await supabase
            .from('purchase_order_items')
            .delete()
            .eq('purchase_order_id', id)

        // Delete PO
        const { error } = await supabase
            .from('purchase_orders')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error("Error deleting purchase order:", error)
        return false
    }
}

/**
 * Get purchase order by ID
 */
export const getPurchaseOrderById = async (id) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(
                    *,
                    product:products(*)
                )
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching purchase order:", error)
        return null
    }
}

/**
 * Update purchase order costs
 */
export const updatePurchaseOrderCosts = async (id, costData) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .update(costData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error updating purchase order costs:", error)
        return null
    }
}
