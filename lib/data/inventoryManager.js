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
                product:products(*),
                variants:product_variants!variant_id(*),
                boxes:inventory_boxes(*)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching inventory items:", error)
        throw error
    }
}

/**
 * Add inventory item
 */


/**
 * Add inventory item with boxes (Transactional-like)
 */
export const addInventoryItemWithBoxes = async (itemData) => {
    if (!supabase) return null
    try {
        // 1. Insert Parent Item
        const { data: item, error } = await supabase
            .from('inventory_items')
            .insert(itemData)
            .select()
            .single()

        if (error) throw error

        // 2. If multi-box, insert boxes
        if (itemData.box_count > 1) {
            const boxes = []
            for (let i = 1; i <= itemData.box_count; i++) {
                boxes.push({
                    inventory_item_id: item.id,
                    box_number: i,
                    total_boxes: itemData.box_count,
                    qr_code: `${itemData.qr_code}-BOX-${i}`,
                    status: 'in_stock'
                })
            }

            const { error: boxError } = await supabase
                .from('inventory_boxes')
                .insert(boxes)

            if (boxError) {
                console.error("Error creating boxes:", boxError)
                // Optional: Rollback item? 
                // For MVP we just log error, but ideally we should delete the item.
                await supabase.from('inventory_items').delete().eq('id', item.id)
                throw new Error("Failed to create inventory boxes. Transaction rolled back.")
            }
        }

        return item
    } catch (error) {
        console.error("Error adding inventory item with boxes:", error)
        throw error
    }
}

/**
 * Find inventory item by QR (Item QR or Box QR)
 */
export const getInventoryItemByQR = async (qrCode) => {
    if (!supabase) return null
    try {
        // 1. Try finding parent item directly
        let { data: item, error } = await supabase
            .from('inventory_items')
            .select(`
                *,
                product:products(*),
                variants:product_variants!variant_id(*),
                boxes:inventory_boxes(*)
            `)
            .eq('qr_code', qrCode)
            .single()

        if (item) {
            return { ...item, scanned_type: 'item' }
        }

        // 2. If not found, try finding via Box QR
        const { data: box, error: boxError } = await supabase
            .from('inventory_boxes')
            .select(`
                *,
                item:inventory_items (
                    *,
                    product:products(*),
                    variants:product_variants!variant_id(*),
                    boxes:inventory_boxes(*)
                )
            `)
            .eq('qr_code', qrCode)
            .single()

        if (box && box.item) {
            return { ...box.item, scanned_type: 'box', scanned_box: box }
        }

        return null
    } catch (error) {
        console.error("Error finding item by QR:", error)
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
 * Update purchase order with items
 */
export const updatePurchaseOrder = async (id, poData, items) => {
    if (!supabase) return null
    try {
        // 1. Update PO Header
        const { data: po, error: poError } = await supabase
            .from('purchase_orders')
            .update(poData)
            .eq('id', id)
            .select()
            .single()

        if (poError) throw poError

        // 2. Replace Items (Delete all and re-insert for simplicity)
        // A. Delete existing
        const { error: deleteError } = await supabase
            .from('purchase_order_items')
            .delete()
            .eq('purchase_order_id', id)

        if (deleteError) throw deleteError

        // B. Insert new
        const itemsWithPoId = items.map(item => ({
            ...item,
            purchase_order_id: id
        }))

        const { error: insertError } = await supabase
            .from('purchase_order_items')
            .insert(itemsWithPoId)

        if (insertError) throw insertError

        return po
    } catch (error) {
        console.error("Error updating purchase order:", error)
        return null
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
/**
 * Delete inventory item
 */
export const deleteInventoryItem = async (id) => {
    if (!supabase) return false
    try {
        // Delete related logs/tracking first if no cascade (safeguard)
        await supabase.from('item_tracking').delete().eq('inventory_item_id', id)
        await supabase.from('inventory_logs').delete().eq('inventory_item_id', id)

        // Delete item (boxes will cascade if configured, otherwise we should delete them too)
        // Given we created boxes with cascade, that's fine.

        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error("Error deleting inventory item:", error)
        return false
    }
}

/**
 * Update purchase order payment status and details
 */
export const updatePurchaseOrderPayment = async (id, paymentData) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .update(paymentData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error updating PO payment:", error)
        return null
    }
}

/**
 * Get payable purchase orders (Unpaid or Partial)
 */
export const getPayablePurchaseOrders = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(*)
            `)
            .neq('payment_status', 'paid')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching payable orders:", error)
        return []
    }
}

/**
 * Get reimbursement queue (Paid by someone, but not reimbursed yet)
 */
export const getReimbursementQueue = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                items:purchase_order_items(*)
            `)
            .neq('payer_name', null)
            .neq('payer_name', '') // Ensure payer name exists
            .eq('is_reimbursed', false)
            .order('payment_date', { ascending: true })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching reimbursement queue:", error)
        return []
    }
}
/**
 * Get low stock items
 */
/**
 * Get low stock items
 */
export const getLowStockItems = async () => {
    if (!supabase) return []
    try {
        // 1. Fetch Variants with key info
        const { data: variants, error: vError } = await supabase
            .from('product_variants')
            .select(`
                *,
                product:products(name, product_code)
            `)

        if (vError) throw vError

        // 2. Fetch Live Stock View
        const { data: liveStock, error: viewError } = await supabase
            .from('view_product_stock_live')
            .select('*')

        if (viewError) console.warn("Could not fetch live stock view", viewError)

        // 3. Create stock map
        const stockMap = {}
        if (liveStock) {
            liveStock.forEach(item => {
                stockMap[item.variant_id] = item
            })
        }

        // 4. Map & Filter
        const lowStock = variants.map(v => {
            const sInfo = stockMap[v.id] || {}
            // Use physical stock or fallback to v.stock (legacy)
            const currentStock = sInfo.physical_stock ?? v.stock ?? 0
            const minStock = v.min_stock_level || 0

            return {
                id: v.id,
                product_id: v.product_id,
                name: v.product?.name || 'Unknown',
                code: v.product?.product_code || 'N/A',
                variant_sku: v.sku,
                variant_dims: v.size,
                variant_color: v.color,
                current_stock: currentStock,
                min_stock_level: minStock,
                image_url: v.product?.image_url || v.image_url,
                reorder_qty: Math.max(0, minStock * 2 - currentStock), // Suggestion logic
                is_low: minStock > 0 && currentStock <= minStock
            }
        }).filter(item => item.is_low)

        return lowStock

    } catch (error) {
        console.error("Error fetching low stock items:", error)
        return []
    }
}

/**
 * Get inventory items suitable for shipping (in_stock or packed)
 */
export const getInventoryItemsForShipping = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
                *,
                product:products(name, product_code),
                variants:product_variants!variant_id(sku, color, size, image_url)
            `)
            .in('status', ['in_stock', 'packed'])
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error("Error fetching inventory for shipping:", error)
        return []
    }
}
