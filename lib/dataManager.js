import { supabase } from './supabaseClient'

/**
 * DataManager - Promisified Data Access Layer for 168VSC
 * Fetches data from Supabase and maps snake_case DB columns to camelCase app properties.
 */
// Helper to calculate Order Status from Items
// Helper to calculate Order Status from Items (Updated for 1:N Jobs)
const calculateOrderStatus = (items = []) => {
    if (!items || items.length === 0) return 'Pending'

    const statuses = items.map(i => {
        // 1. Try to use explicit item status (backward compat)
        if (i.status) return i.status.toLowerCase()

        // 2. Derive from Latest Job
        if (i.jobs && i.jobs.length > 0) {
            // Sort by sequence or created_at desc (assuming jobs ordered in query or we sort here)
            // But usually i.jobs comes from getOrders which sorts them.
            // Let's assume index 0 is latest if sorted, or sort safely.
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

export const DataManager = {
    // Export supabase for Realtime subscriptions
    supabase,

    // --- Internal helpers (network/transient resilience) ---
    _sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    _isTransientNetworkError: (err) => {
        const msg = String(err?.message || '')
        return (
            err?.name === 'TypeError' ||
            msg.includes('Failed to fetch') ||
            msg.includes('NetworkError') ||
            msg.includes('ERR_FAILED')
        )
    },
    _withRetry: async (label, fn, { retries = 3, baseDelayMs = 600 } = {}) => {
        let lastErr
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await fn()
            } catch (err) {
                lastErr = err
                const transient = DataManager._isTransientNetworkError(err)
                if (!transient || attempt === retries) throw err
                const waitMs = baseDelayMs * attempt
                console.warn(`[${label}] transient error, retrying in ${waitMs}ms (attempt ${attempt}/${retries})`, err)
                await DataManager._sleep(waitMs)
            }
        }
        throw lastErr
    },

    // Generate Next Order ID
    getNextOrderId: async () => {
        try {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })

            if (error) throw error
            // Default to 1 if count is 0, otherwise count + 1
            // Padded to 4 digits e.g. 0001?
            // Actually usually returning raw number is safer for adding prefix later.
            // But let's check strict requirements. Usually just number.
            return count ? count + 1 : 1
        } catch (error) {
            console.error('Error fetching order count:', error)
            return 1 // Fallback
        }
    },

    // Receive PO (Convert to Inventory)
    receivePurchaseOrder: async (poId) => {
        try {
            // 1. Get PO with items and product details (for code/pack_size)
            const po = await DataManager.getPurchaseOrderById(poId)
            if (!po || !po.items || po.items.length === 0) throw new Error("PO not found or empty")

            const inventoryItemsToInsert = []
            const logsToInsert = []
            const timestamp = Date.now().toString(36)

            // 2. Loop through PO items
            for (const item of po.items) {
                // Determine how many physical items to create based on PO quantity
                // Assuming PO qty = Number of boxes/units to track
                const qty = item.quantity || 1
                const productCode = item.product?.product_code || item.product?.code || 'ITEM'

                for (let i = 0; i < qty; i++) {
                    const random = Math.random().toString(36).substring(2, 6)
                    const uniqueQR = `${productCode}-${timestamp}-${random}-${i}`.toUpperCase()

                    inventoryItemsToInsert.push({
                        product_id: item.product.id || item.product.uuid, // Handle both ID types just in case
                        qr_code: uniqueQR,
                        status: 'in_stock',
                        current_location: 'Warehouse_Main', // Default location
                        lot_number: `PO-${po.id.substring(0, 6)}`, // Track Source PO
                    })
                }
            }

            // 3. Batch Insert Inventory Items
            const { data: insertedItems, error: insertError } = await supabase
                .from('inventory_items')
                .insert(inventoryItemsToInsert)
                .select()

            if (insertError) throw insertError

            // 4. Create Logs (One log entry per batch usually, or per item? 
            // Logging per item is safer for history, but might be heavy. 
            // Let's log per item using the returned IDs)

            const logs = insertedItems.map(invItem => ({
                inventory_item_id: invItem.id,
                action: 'check_in',
                quantity_change: 1,
                reason: `Received from PO #${po.id.substring(0, 8)}`,
                created_by: 'System'
            }))

            await supabase.from('inventory_logs').insert(logs)

            // 4.1 Log Initial Tracking Event (Received)
            const trackingEvents = insertedItems.map(invItem => ({
                inventory_item_id: invItem.id,
                step_status: 'Received',
                location_name: 'Warehouse_Main (Receiving Dock)',
                notes: `Initial Receipt from PO #${po.id.substring(0, 8)}`,
                recorded_at: new Date().toISOString()
            }))

            await supabase.from('item_tracking').insert(trackingEvents)

            // 5. Update PO Status
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
    },

    // --- Item Tracking (Supply Chain) ---

    getItemTrackingHistory: async (inventoryItemId) => {
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
    },

    logTrackingEvent: async (inventoryItemId, status, location, notes = '') => {
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
    },


    // --- Team Service Fees (Batch Payments) ---

    // 1. Teams Management
    getTeams: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*') // Select all including status, team_type
                .order('name')
            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching teams:', error)
            return []
        }
    },

    findOrCreateTeam: async (name) => {
        if (!supabase || !name) return null
        try {
            const normalizedName = String(name).trim()
            if (!normalizedName) return null

            // 1. Try to find existing
            const { data: existing, error: findError } = await supabase
                .from('teams')
                .select('*')
                .or(`name.eq.${normalizedName},name.eq.${normalizedName.toLowerCase()}`)
                .maybeSingle()

            if (existing) return existing

            // 2. Create if not found
            console.log('[DataManager] Auto-creating team:', normalizedName)
            const { data: newTeam, error: createError } = await supabase
                .from('teams')
                .insert({ name: normalizedName, status: 'active' })
                .select()
                .single()

            if (createError) throw createError
            return newTeam
        } catch (error) {
            console.error('Error finding/creating team:', error)
            return null
        }
    },

    saveTeam: async (teamData) => {
        try {
            const payload = {
                name: teamData.name,
                payment_qr_url: teamData.payment_qr_url,
                team_type: teamData.teamType || 'General',
                status: teamData.status || 'active',
                updated_at: new Date().toISOString()
            }
            if (teamData.id) payload.id = teamData.id

            const { data, error } = await supabase
                .from('teams')
                .upsert(payload)
                .select()
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Error saving team:', error)
            return { success: false, error: error.message }
        }
    },

    // 2. Service Fee Batches
    getTeamServiceFees: async (teamId = null) => {
        if (!supabase) return []
        try {
            let query = supabase
                .from('team_service_fees')
                .select(`
                    *,
                    team:teams(name),
                    adjustments:team_service_fee_adjustments(*),
                    payments:team_service_fee_payments(*),
                    jobs:team_service_fee_jobs(job_id)
                `)
                .order('created_at', { ascending: false })

            if (teamId) {
                query = query.eq('team_id', teamId)
            }

            const { data, error } = await query
            if (error) throw error

            // Calculate aggregated fields for UI
            return data.map(batch => {
                const labor = Number(batch.labor_cost) || 0
                const material = Number(batch.material_cost) || 0
                const travel = Number(batch.travel_cost) || 0
                const adjustmentsTotal = (batch.adjustments || []).reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0)

                const base = labor + material + travel
                const deduct = base * ((Number(batch.deduct_percent) || 3) / 100)
                const totalDue = (base - deduct) + adjustmentsTotal

                const totalPaid = (batch.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                const remaining = totalDue - totalPaid

                return {
                    ...batch,
                    totalBeforeDeduct: base,
                    deductAmount: deduct,
                    adjustmentsTotal,
                    totalDue,
                    totalPaid,
                    remaining,
                    jobs: (batch.jobs || []).map(j => ({ id: j.job_id })) // Simplified mapping
                }
            })

        } catch (error) {
            console.error('Error fetching service fees:', error)
            return []
        }
    },

    getTeamServiceFeeById: async (id) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('team_service_fees')
                .select(`
                    *,
                    team:teams(*),
                    adjustments:team_service_fee_adjustments(*),
                    payments:team_service_fee_payments(*),
                    jobs:team_service_fee_jobs(job_id, created_at)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) return null

            // Recalculate Logic (Same as above)
            const labor = Number(data.labor_cost) || 0
            const material = Number(data.material_cost) || 0
            const travel = Number(data.travel_cost) || 0
            const adjustmentsTotal = (data.adjustments || []).reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0)

            const base = labor + material + travel
            const deduct = base * ((Number(data.deduct_percent) || 3) / 100)
            const totalDue = (base - deduct) + adjustmentsTotal

            const totalPaid = (data.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
            const remaining = totalDue - totalPaid

            return {
                ...data,
                totalBeforeDeduct: base,
                deductAmount: deduct,
                adjustmentsTotal,
                totalDue,
                totalPaid,
                remaining,
                jobs: (data.jobs || []).map(j => ({ id: j.job_id }))
            }

        } catch (error) {
            console.error('Error fetching service fee by ID:', error)
            return null
        }
    },

    saveTeamServiceFee: async (data) => {
        try {
            // Upsert header
            const payload = {
                team_id: data.team_id,
                labor_cost: data.labor_cost,
                material_cost: data.material_cost,
                travel_cost: data.travel_cost,
                deduct_percent: data.deduct_percent,
                note: data.note,
                status: data.status || 'active',
                updated_at: new Date().toISOString()
            }
            if (data.id) payload.id = data.id

            const { data: savedBatch, error } = await supabase
                .from('team_service_fees')
                .upsert(payload)
                .select()
                .single()

            if (error) throw error

            // Handle Adjustments (Upsert/Delete approach not needed, just Add? Or Edit?)
            // For now, if adjustments are passed, we assume they are new or edits.
            // Let's rely on specific 'saveAdjustment' for items to be cleaner, 
            // OR if 'adjustments' array is passed, try to sync.
            // Simplest: The UI usually calls addAdjustment separately. 
            // So we just save header here.

            return { success: true, data: savedBatch }
        } catch (error) {
            console.error('Error saving service fee batch:', error)
            return { success: false, error: error.message }
        }
    },

    // 3. Sub-items (Adjustments, Jobs, Payments)

    addServiceFeeAdjustment: async (adjustmentData) => {
        try {
            const { data, error } = await supabase
                .from('team_service_fee_adjustments')
                .insert(adjustmentData)
                .select()
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    deleteServiceFeeAdjustment: async (id) => {
        try {
            const { error } = await supabase.from('team_service_fee_adjustments').delete().eq('id', id)
            if (error) throw error
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    linkServiceFeeJobs: async (serviceFeeId, jobIds = []) => {
        try {
            if (!jobIds.length) return { success: true }

            // 1. Remove these jobs from any existing service fees (Ensure Job belongs to only one Batch)
            const { error: deleteError } = await supabase
                .from('team_service_fee_jobs')
                .delete()
                .in('job_id', jobIds)

            if (deleteError) throw deleteError

            // 2. Insert new links
            const payload = jobIds.map(jid => ({
                service_fee_id: serviceFeeId,
                job_id: jid
            }))

            // Use upsert to be safe, though insert would work after delete
            const { error } = await supabase
                .from('team_service_fee_jobs')
                .upsert(payload, { onConflict: 'service_fee_id, job_id', ignoreDuplicates: true })

            if (error) throw error
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    unlinkServiceFeeJob: async (jobId) => {
        try {
            const { error } = await supabase
                .from('team_service_fee_jobs')
                .delete()
                .eq('job_id', jobId)

            if (error) throw error
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    addServiceFeePayment: async (paymentData) => {
        try {
            const { data, error } = await supabase
                .from('team_service_fee_payments')
                .insert({
                    service_fee_id: paymentData.service_fee_id,
                    amount: paymentData.amount,
                    payment_method: paymentData.payment_method,
                    slip_url: paymentData.slip_url,
                    note: paymentData.note,
                    paid_at: paymentData.paid_at || new Date().toISOString()
                })
                .select()
            if (error) throw error
            return { success: true, data }
        } catch (error) {
            return { success: false, error: error.message }
        }
    },

    // 4. Team Level Stats
    getTeamOutstanding: async (teamId) => {
        if (!teamId) return 0
        try {
            // Fetch all active batches for team (this might be heavy, but accurate)
            // or use specific RPC if performance issue.
            // Client-side calc for MVP:
            const batches = await DataManager.getTeamServiceFees(teamId)
            const totalOutstanding = batches.reduce((sum, b) => sum + (b.remaining || 0), 0)
            return totalOutstanding
        } catch (error) {
            console.error('Error calculating team outstanding:', error)
            return 0
        }
    },

    // --- Quality Control (QC) ---

    getQCQueue: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select(`
                    *,
                    product:products (id, name, code, image)
                `)
                .eq('status', 'in_stock') // Only check items currently in stock?
                // In real world, might filter by those NOT yet inspected. 
                // For now, we fetch all in_stock and let UI filter or show status.
                .order('created_at', { ascending: false })

            if (error) throw error

            // To be more precise, we could join with qc_records to see if already passed, 
            // but Supabase simple join is easier. 
            // We'll fetch QC records separately or let the UI handle "already checked" logic?
            // Better: Let's fetch recent QC records to map status.

            // For MVP: Just return items. The QC Page will handle display logic.
            return data
        } catch (error) {
            console.error("Error fetching QC queue:", error)
            return []
        }
    },

    // --- Purchasing / Reordering ---

    getLowStockItems: async () => {
        if (!supabase) return []
        try {
            // Logic (Updated for Variants): 
            // 1. Get all products with variants
            // 2. Check each variant's stock vs minStock
            // 3. Return flattened list of low stock variants

            // 1. Get all products with variants
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

            // 2. Get Active Items (Pending, Processing) to calculate Allocated Stock
            const { data: activeItems, error: itemError } = await supabase
                .from('order_items')
                .select('product_id, quantity, product_variant_id, status')
                .in('status', ['Pending', 'Processing', 'Confirmed', 'pending', 'processing', 'confirmed'])

            const contentMap = {} // Key: "ProductCode_VariantIndex" -> qty needed

            if (!itemError && activeItems) {
                activeItems.forEach(item => {
                    // Match by Product ID + Variant lookup (more robust)
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

                        // 3. Generate Variant Code (For Display Only)
                        const codePrefix = product.product_code || ''
                        const dims = variant.dimensions
                        const colorCode = variant.color ? variant.color.substring(0, 2).toUpperCase() : 'XX'

                        let variantCode = codePrefix

                        // Add Dimensions
                        if (dims && (dims.length || dims.width || dims.height)) {
                            const dimStr = `${dims.length || 0}x${dims.width || 0}x${dims.height || 0}`
                            variantCode += `-D${dimStr}`
                        }

                        // Add Color
                        variantCode += `-${colorCode}`

                        // Add Crystal Color
                        const getCrystalCode = (name) => {
                            if (!name) return ''
                            const map = {
                                'ใส': 'CL', 'Clear': 'CL', 'Gold': 'GD',
                                'Smoke': 'SM', 'Amber': 'AM', 'Tea': 'TE'
                            }
                            return map[name] || name.substring(0, 2).toUpperCase()
                        }

                        if (variant.crystalColor) {
                            variantCode += `-${getCrystalCode(variant.crystalColor)}`
                        }

                        // 4. Calculate Demand using Code + Index
                        // Match key: ProductCode_VariantIndex
                        const matchKey = `${product.product_code}_${index}`
                        const allocatedQty = contentMap[matchKey] || 0
                        const totalNeeded = minStock + allocatedQty

                        // Check if we need to reorder
                        // Logic: If (Stock < TotalNeeded)
                        if (currentStock < totalNeeded) {

                            // 5. Prepare Display Data
                            lowStock.push({
                                id: `${product.uuid}_v${index}`,
                                product_id: product.uuid,
                                uuid: product.uuid,
                                name: product.name,
                                category: product.category,
                                code: variantCode,
                                image_url: (variant.images && variant.images[0]) || null,

                                // Variant Specifics
                                variant_color: variant.color,
                                variant_crystal: variant.crystalColor,
                                variant_dims: variant.dimensions ? `${variant.dimensions.length}x${variant.dimensions.width}x${variant.dimensions.height}cm` : null,

                                current_stock: currentStock,
                                min_stock_level: minStock,
                                allocated_qty: allocatedQty, // Info for UI if needed
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
    },

    saveQCRecord: async (recordData) => {
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
                        .from('job-media') // Re-use bucket or create 'qc-evidence'
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

            // 3. Update Inventory Status & Product (if changed)
            const updates = {}
            let newStatus = 'in_stock'
            if (recordData.status === 'fail') newStatus = 'damaged'
            if (recordData.status === 'rework') newStatus = 'maintenance'
            updates.status = newStatus

            // Update Serial Number if provided
            if (recordData.serial_number) {
                updates.serial_number = recordData.serial_number
            }

            // Handle Product Swap (Blind Check-in)
            if (recordData.new_product_id) {
                // Get current item to know OLD product_id
                const { data: oldItem } = await supabase
                    .from('inventory_items')
                    .select('product_id')
                    .eq('id', recordData.inventory_item_id)
                    .single()

                if (oldItem && oldItem.product_id !== recordData.new_product_id) {
                    updates.product_id = recordData.new_product_id

                    // STOCK ADJUSTMENT: Old -1, New +1

                    // Decrement OLD
                    if (oldItem.product_id) {
                        const { data: oldProd } = await supabase.from('products').select('stock').eq('uuid', oldItem.product_id).single()
                        if (oldProd) {
                            await supabase.from('products').update({ stock: Math.max(0, (oldProd.stock || 0) - 1) }).eq('uuid', oldItem.product_id)
                        }
                    }

                    // Increment NEW
                    const { data: newProd } = await supabase.from('products').select('stock').eq('uuid', recordData.new_product_id).single()
                    if (newProd) {
                        await supabase.from('products').update({ stock: (newProd.stock || 0) + 1 }).eq('uuid', recordData.new_product_id)
                    }

                    // Log the swap
                    await DataManager.logTrackingEvent(
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
            await DataManager.logTrackingEvent(
                recordData.inventory_item_id,
                `QC: ${recordData.status.toUpperCase()}`,
                'QC Station',
                `Result: ${recordData.status}, Notes: ${recordData.notes}`
            )

            return true
        } catch (error) {
            console.error("Error saving QC record:", error)
            throw error // Propagate error for UI handling
        }
    },

    // Get QC History for an item
    getQCRecords: async (inventoryItemId) => {
        try {
            const { data, error } = await supabase
                .from('qc_records')
                .select('*')
                .eq('inventory_item_id', inventoryItemId)
                .order('created_at', { ascending: true }) // Oldest first to count rounds 1, 2, 3...

            if (error) throw error
            return data || []
        } catch (error) {
            console.error("Error getting QC records:", error)
            return []
        }
    },

    // --- Master Data Access ---

    getCustomers: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    contacts:customer_contacts(*),
                    addresses:customer_addresses(*),
                    taxInvoices:customer_tax_invoices(*)
                `)
                .order('name')

            if (error) throw error

            return data.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                lineId: c.line_id,
                line: c.line_id, // Alias for app
                facebook: c.facebook,
                instagram: c.instagram,
                mediaSource: c.media_source,
                mediaSourceOther: c.media_source_other,
                address: c.address, // Legacy/Simple
                // Use relational data from JOINs
                contacts: (c.contacts || []).map(contact => ({
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone,
                    lineId: contact.line_id,
                    email: contact.email,
                    position: contact.position,
                    note: contact.note
                })),
                addresses: (c.addresses || []).map(addr => ({
                    id: addr.id,
                    label: addr.label,
                    // Direct mapping - column names now match UI
                    addrNumber: addr.addr_number || addr.house_number,
                    addrMoo: addr.addr_moo || addr.village_no,
                    addrVillage: addr.addr_village || addr.building,
                    addrSoi: addr.addr_soi || addr.soi,
                    addrRoad: addr.addr_road || addr.road,
                    addrTambon: addr.addr_tambon || addr.subdistrict,
                    addrAmphoe: addr.addr_amphoe || addr.district,
                    addrProvince: addr.addr_province || addr.province,
                    province: addr.addr_province || addr.province,
                    zipcode: addr.zipcode || addr.postcode,
                    googleMapsLink: addr.google_maps_link || addr.google_map_link,
                    address: addr.address
                })),
                taxInvoices: (c.taxInvoices || []).map(tax => ({
                    id: tax.id,
                    companyName: tax.company_name,
                    taxId: tax.tax_id,

                    address: tax.address,
                    // Map branch fields to UI expectations
                    branch: tax.branch_number,
                    branchNumber: tax.branch_number,
                    branchName: tax.branch_name,
                    // Map back granular fields for UI editing
                    addrNumber: tax.house_number,
                    addrMoo: tax.village_no,
                    addrVillage: tax.building,
                    addrSoi: tax.soi,
                    addrRoad: tax.road,
                    addrTambon: tax.sub_district,
                    addrAmphoe: tax.district,
                    addrProvince: tax.province,
                    province: tax.province,
                    addrZipcode: tax.postal_code
                }))
            }))
        } catch (error) {
            console.error('Error fetching customers:', error)
            return []
        }
    },

    getCustomerById: async (id) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    contacts:customer_contacts(*),
                    addresses:customer_addresses(*),
                    taxInvoices:customer_tax_invoices(*)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) return null

            return {
                id: data.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                lineId: data.line_id,
                line: data.line_id,
                facebook: data.facebook,
                instagram: data.instagram,
                mediaSource: data.media_source,
                mediaSourceOther: data.media_source_other,
                address: data.address,
                // Use relational data from JOINs
                contacts: (data.contacts || [])
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(contact => ({
                        id: contact.id,
                        name: contact.name,
                        phone: contact.phone,
                        lineId: contact.line_id,
                        email: contact.email,
                        position: contact.position,
                        note: contact.note
                    })),
                addresses: (data.addresses || [])
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(addr => ({
                        id: addr.id,
                        label: addr.label,
                        // Direct mapping - column names now match UI
                        addrNumber: addr.addr_number || addr.house_number,
                        addrMoo: addr.addr_moo || addr.village_no,
                        addrVillage: addr.addr_village || addr.building,
                        addrSoi: addr.addr_soi || addr.soi,
                        addrRoad: addr.addr_road || addr.road,
                        addrTambon: addr.addr_tambon || addr.subdistrict,
                        addrAmphoe: addr.addr_amphoe || addr.district,
                        addrProvince: addr.addr_province || addr.province,
                        province: addr.addr_province || addr.province,
                        zipcode: addr.zipcode || addr.postcode,
                        googleMapsLink: addr.google_maps_link || addr.google_map_link,
                        address: addr.address
                    })),
                taxInvoices: (data.taxInvoices || [])
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(tax => ({
                        id: tax.id,
                        companyName: tax.company_name,
                        taxId: tax.tax_id,

                        address: tax.address,
                        // Map branch fields to UI expectations
                        branch: tax.branch_number,
                        branchNumber: tax.branch_number,
                        branchName: tax.branch_name,
                        // Map back granular fields for UI editing
                        addrNumber: tax.house_number,
                        addrMoo: tax.village_no,
                        addrVillage: tax.building,
                        addrSoi: tax.soi,
                        addrRoad: tax.road,
                        addrTambon: tax.sub_district,
                        addrAmphoe: tax.district,
                        addrProvince: tax.province,
                        addrZipcode: tax.postal_code
                    }))
            }
        } catch (error) {
            console.error('Error fetching customer by ID:', error)
            return null
        }
    },

    getProducts: async () => {
        if (!supabase) return []
        try {
            // New Realtime Logic: Fetch from 'view_product_stock_live' which pre-calculates stock/allocation
            // Also join with 'product_variants' to get full details

            // 1. Fetch Products
            const { data: products, error: prodError } = await supabase
                .from('products')
                .select(`
                    *,
                    variants:product_variants (
                        id,
                        product_id,
                        color,
                        size,
                        sku,
                        price,
                        image_url,
                        crystal_color
                    )
                `)
                .order('name')

            if (prodError) throw prodError

            // 2. Fetch Live Stock View used for Realtime status
            const { data: liveStock, error: viewError } = await supabase
                .from('view_product_stock_live')
                .select('*')

            if (viewError) console.warn("Could not fetch live stock view", viewError)

            // Create a Map for fast lookup: variant_id -> stock_data
            const stockMap = {}
            if (liveStock) {
                liveStock.forEach(item => {
                    stockMap[item.variant_id] = item
                })
            }

            return products.map(p => {
                // Map Variants using new Table Structure
                // If product has no variants in DB yet (legacy), we might need fallback? 
                // Migration should have handled it.

                const variants = (p.variants || []).map(v => {
                    const sInfo = stockMap[v.id] || {}
                    return {
                        ...v,
                        // Normalize fields for UI
                        stock: sInfo.physical_stock ?? v.stock ?? 0,
                        allocated: sInfo.allocated_stock ?? 0,
                        available: sInfo.available_stock ?? (v.stock ?? 0),

                        // Legacy UI expects these:
                        total_sold: 0, // Todo: If needed, query aggregated sales
                        total_pending: sInfo.allocated_stock ?? 0,
                        images: v.image_url ? [v.image_url] : [], // Compatibility with UI expecting array
                        image: v.image_url, // Direct access preferred
                        crystal_color: v.crystal_color,
                        crystalColor: v.crystal_color,
                        dimensions: (() => {
                            if (!v.size) return { length: 0, width: 0, height: 0 };
                            const parts = v.size.split('x');
                            return {
                                length: parseInt(parts[0]) || 0,
                                width: parseInt(parts[1]) || 0,
                                height: parseInt(parts[2]) || 0
                            };
                        })()
                    }
                })

                // Aggregates for Product Level
                const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                const totalAllocated = variants.reduce((acc, v) => acc + (v.allocated || 0), 0)
                const totalAvailable = variants.reduce((acc, v) => acc + (v.available || 0), 0)

                return {
                    uuid: p.uuid,
                    id: p.uuid || p.id,
                    product_code: p.product_code,
                    name: p.name,
                    category: p.category,
                    subcategory: p.subcategory,
                    description: p.description,
                    material: p.material,

                    // Product Level Stock (Sum of variants)
                    stock: totalStock,
                    available: totalAvailable,
                    allocated: totalAllocated,

                    // Variants
                    variants: variants,

                    // Legacy Interop: If UI uses root level dimensions/price from 1st variant?
                    price: p.price, // Base price
                    image_url: p.image_url || ((variants[0] && variants[0].image_url) ? variants[0].image_url : null),
                    images: p.image_url ? [p.image_url] : (variants.map(v => v.image_url).filter(Boolean)),

                    min_stock_level: p.min_stock_level
                }
            })

        } catch (error) {
            console.error('Error fetching products (Realtime Refactor):', error)
            return []
        }
    },



    // --- Employees (Formerly Teams in UI) ---
    // --- Employees (Formerly Teams in UI) ---
    getEmployees: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('employees')
                .select(`
                    *,
                    team_link:teams(id, name, team_type)
                `)
                .order('eid')

            if (error) throw error

            // Map DB snake_case to UI camelCase
            return data.map(e => {
                // Helper to restore percentage format
                const restorePercent = (val) => {
                    if (!val && val !== 0) return ''
                    // Convert to string and add % if not already present
                    const strVal = String(val)
                    if (!strVal.includes('%')) {
                        return strVal + '%'
                    }
                    return strVal
                }

                return {
                    id: e.id,
                    eid: e.eid,
                    nickname: e.nickname,
                    firstname: e.firstname,
                    lastname: e.lastname,
                    fullname: `${e.firstname || ''} ${e.lastname || ''}`.trim() || e.nickname || 'Unknown',

                    // Team Link (Priority: UUID -> Legacy String)
                    teamId: e.team_id,
                    team: e.team_link?.name || e.team, // Show name
                    teamType: e.team_link?.team_type || e.team_type, // Prefer linked type

                    job: e.job_position,
                    level: e.job_level,
                    userType: e.role,
                    email: e.email,
                    phone1: e.phone1,
                    phone2: e.phone2,
                    address: e.address,
                    startDate: e.start_date,
                    endDate: e.end_date,
                    workType: e.work_type,
                    payType: e.pay_type,
                    payRate: e.pay_rate,
                    incentiveRate: restorePercent(e.incentive_rate),
                    citizenId: e.citizen_id,
                    birthDay: e.birth_date,
                    bank: e.bank_name,
                    acNumber: e.account_number,
                    status: e.status || 'current',
                    photos: e.photos || {}
                }
            })
        } catch (error) {
            console.error('Error fetching employees:', error)
            return []
        }
    },

    saveEmployee: async (empData) => {
        if (!supabase) {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            return {
                success: false,
                error: `Supabase client not initialized. Debug: URL=${url ? 'Set' : 'Missing'}, Key=${key ? 'Set' : 'Missing'}`
            }
        }
        try {
            // Helper to sanitize numeric/date fields
            const sanitize = (val) => {
                if (val === '' || val === null || val === undefined) return null
                return val
            }

            // Helper to clean percentage strings
            const cleanPercent = (val) => {
                if (!val) return null
                if (typeof val === 'string') {
                    const cleaned = val.replace('%', '').trim()
                    return cleaned === '' ? null : cleaned
                }
                return val
            }

            const dbPayload = {
                // id: empData.id, // ID is auto-generated or passed if update
                eid: empData.eid,
                nickname: empData.nickname,
                firstname: empData.firstname,
                lastname: empData.lastname,
                // fullname is now computed in JS - stop sending it to DB
                // fullname: employeeData.fullname, 
                // Link Team ID if available, else fallback to text (or NULL if strictly migrated)
                team_id: empData.teamId || null,
                team: empData.team,
                team_type: empData.teamType,
                job_position: empData.job,
                job_level: empData.level,
                role: empData.userType,
                email: empData.email,
                phone1: empData.phone1,
                phone2: empData.phone2,
                address: empData.address,
                start_date: sanitize(empData.startDate),
                end_date: sanitize(empData.endDate),
                work_type: empData.workType,
                pay_type: empData.payType,
                pay_rate: sanitize(empData.payRate),
                incentive_rate: cleanPercent(empData.incentiveRate),
                citizen_id: empData.citizenId,
                birth_date: sanitize(empData.birthDay),
                bank_name: empData.bank,
                account_number: empData.acNumber,
                status: empData.status || 'current',
                photos: empData.photos // { profile, id_card, house_reg }
            }

            if (empData.id && !empData.id.toString().startsWith('temp')) {
                dbPayload.id = empData.id
            }

            const { data, error } = await supabase
                .from('employees')
                .upsert(dbPayload)
                .select()

            if (error) throw error
            return { success: true, data: data ? data[0] : null }
        } catch (error) {
            console.error('Error saving employee:', error)
            return { success: false, error: error.message || 'Unknown error' }
        }
    },

    uploadFile: async (file, path) => {
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
    },

    uploadShopAsset: async (file) => {
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
    },

    uploadSignature: async (signatureBase64, orderId, paymentIndex, type) => {
        console.log(`[uploadSignature] Called for ${type} signature, order: ${orderId}, index: ${paymentIndex}`)

        if (!supabase) {
            console.log('[uploadSignature] No supabase client')
            return signatureBase64
        }

        if (!signatureBase64 || !signatureBase64.startsWith('data:image')) {
            console.log('[uploadSignature] Not a base64 image, returning as-is')
            return signatureBase64 // Return as-is if not base64
        }

        console.log('[uploadSignature] Processing base64 signature...')

        try {
            // Convert base64 to blob
            const base64Data = signatureBase64.split(',')[1]
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'image/png' })

            console.log(`[uploadSignature] Blob created: ${blob.size} bytes`)

            // Upload to storage
            const filePath = `${orderId}/${paymentIndex}/${type}.png`
            console.log(`[uploadSignature] Uploading to: ${filePath}`)


            // Delete existing file first (to avoid upsert RLS issues)
            await supabase.storage
                .from('payment-signatures')
                .remove([filePath])

            // Then upload new file
            const { data, error } = await supabase.storage
                .from('payment-signatures')
                .upload(filePath, blob, {
                    contentType: 'image/png'
                })

            if (error) {
                console.error('[uploadSignature] Upload error:', error)
                throw error
            }

            console.log('[uploadSignature] Upload successful:', data)

            // Get public URL
            const { data: publicData } = supabase.storage
                .from('payment-signatures')
                .getPublicUrl(filePath)

            console.log('[uploadSignature] Public URL:', publicData.publicUrl)
            return publicData.publicUrl
        } catch (error) {
            console.error('[uploadSignature] Error uploading signature:', error)
            return signatureBase64 // Fallback to base64 if upload fails
        }
    },

    uploadProductImage: async (imageFile, productId) => {
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

            // Upload file (same as uploadFile for employees)
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
    },

    uploadPaymentSlip: async (imageFile, orderId, paymentIndex) => {
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
    },

    // Helper: Generate Document ID (RPC Call)
    _generateDocumentId: async (type, dateStr) => {
        if (!supabase) return null
        try {
            // Type: 'IV' or 'RC'
            // Date: '2025-12-22' -> '202512'
            const dateObj = new Date(dateStr || Date.now())
            const year = dateObj.getFullYear()
            const month = String(dateObj.getMonth() + 1).padStart(2, '0')
            const yearMonth = `${year}${month}`

            const { data: seq, error } = await supabase.rpc('get_next_document_sequence', {
                doc_type: type,
                doc_year_month: yearMonth
            })

            if (error) throw error

            // Format: type-YYYYMM-XXXX (e.g. IV-2025120001)
            const seqStr = String(seq).padStart(5, '0')
            return `${type}-${yearMonth}${seqStr}`
        } catch (error) {
            console.error('Error generating document ID:', error)
            return null
        }
    },

    uploadJobMedia: async (file, jobId) => {
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
                // Assuming 'job-media' bucket exists, if not using 'documents' or 'orders' might be safer?
                // Request says "save as file in storage supabase". I'll try 'job-media'.
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
    },

    // --- Job Completion ---
    getJobCompletion: async (jobId) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('job_completions')
                .select('*')
                .eq('job_id', jobId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') return null // Not found
                throw error
            }
            return data
        } catch (error) {
            console.error('Error fetching job completion:', error)
            return null
        }
    },

    saveJobCompletion: async (data) => {
        if (!supabase) return false
        try {
            const { error } = await supabase
                .from('job_completions')
                .upsert({
                    job_id: data.job_id,
                    signature_url: data.signature_url,
                    rating: data.rating,
                    comment: data.comment,
                    media: data.media,
                    created_at: new Date().toISOString()
                })

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error saving job completion:', error)
            return false
        }
    },



    deleteEmployee: async (id) => {
        if (!supabase) return false
        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting employee:', error)
            return false
        }
    },


    // --- Customer Address Management (Added for Distance Logic) ---
    updateCustomerAddress: async (id, addressData) => {
        if (!supabase) return null
        try {
            console.log('Updating customer address:', id, addressData)
            const { data, error } = await supabase
                .from('customer_addresses')
                .update(addressData)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating customer address:', error)
            return null
        }
    },

    // --- Transaction Data Access (with Joins) ---

    getOrders: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await DataManager._withRetry(
                'getOrders',
                async () => {
                    return await supabase
                        .from('orders')
                        .select(`
                            *,
                            customer:customers!customer_id(id, name, phone, email),
                        purchaserContact:customer_contacts!purchaser_contact_id(*),
                    receiverContact:customer_contacts!receiver_contact_id(*),
                    taxInvoice:customer_tax_invoices!tax_invoice_id(*),
                        items:order_items(
                            *, 
                            jobs(
                                *, 
                                siteAddressRecord:site_address_id(*), 
                                siteInspectorRecord:site_inspector_id(*)
                            ), 
                            product:products(name, description), 
                            variant:product_variants!product_variant_id(*)
                        ),
                        paymentSchedule:order_payments(*)
                    `)
                        .order('created_at', { ascending: false })
                }
            )

            if (error) throw error

            return data.map(o => ({
                id: o.id,
                customerId: o.customer_id,
                // Map properties to match what UI/Reports expect
                date: o.created_at, // Use created_at as main date
                orderDate: o.order_date, // Keep original if needed
                createdAt: o.created_at,
                status: calculateOrderStatus(o.items), // Runtime Derivation (Phase 11)
                // Customer info - Use JOIN data (always up-to-date)
                customer: o.customer?.name || 'Unknown Customer',
                customerName: o.customer?.name || 'Unknown Customer',
                customerId: o.customer_id,
                customerPhone: o.customer?.phone || '',
                customerEmail: o.customer?.email || '',
                // Job info - Derived from First Item's Latest Job (Status Quo for Unified Mode)
                // Note: If distinct_items mode, this only shows main/first job.
                // FIXED: Use o.items[0].jobs[0] because order_items columns are dropped.
                jobType: o.job_type || o.items?.[0]?.jobs?.[0]?.job_type || '-',
                team: o.items?.[0]?.jobs?.[0]?.assigned_team || '-',
                appointmentDate: o.items?.[0]?.jobs?.[0]?.appointment_date || null,
                completionDate: o.items?.[0]?.jobs?.[0]?.completion_date || null,
                notes: o.items?.[0]?.jobs?.[0]?.notes || '',
                // Financial info
                totalAmount: o.total || 0, // Use total from database
                discount: { mode: o.discount_mode || 'percent', value: o.discount_value || 0 },
                totalAmount: o.total || 0, // Use total from database
                discount: { mode: o.discount_mode || 'percent', value: o.discount_value || 0 },
                deposit: (o.paymentSchedule || []).reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
                paymentSchedule: (o.paymentSchedule || []).map(p => ({
                    // Map DB snake_case to UI camelCase
                    date: p.payment_date,
                    amount: p.amount,
                    method: p.payment_method,
                    paymentMethod: p.payment_method,
                    type: p.payment_type,
                    slip: p.proof_url,
                    proofUrl: p.proof_url,
                    receiverSignature: p.receiver_signature,
                    payerSignature: p.payer_signature,
                    status: p.status,
                    isDeposit: p.is_deposit,
                    // New Columns
                    invoiceNo: p.invoice_no,
                    invoiceDate: p.invoice_date,
                    receiptNo: p.receipt_no,
                    receiptDate: p.receipt_date
                })).sort((a, b) => new Date(a.date) - new Date(b.date)),
                items: (o.items || []).map(i => {
                    // Sorting Jobs: Recent first (Created At DESC)
                    const itemJobs = (i.jobs || []).sort((a, b) => {
                        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                    });
                    const latestJob = itemJobs[0] || {} // The latest job

                    return {
                        id: i.id || i.code,
                        name: i.product?.name || 'Unknown Product', // Prioritize Master Product Name (Live Only)
                        image: i.variant?.image_url || i.image || null,
                        qty: Number(i.quantity || i.qty || 1), // Prioritize quantity column
                        quantity: Number(i.quantity || i.qty || 1),
                        price: Number(i.unit_price || i.unitPrice || i.price || 0),
                        unitPrice: Number(i.unit_price || i.unitPrice || i.price || 0),
                        total: Number(i.total_price || i.total || ((Number(i.unit_price || i.unitPrice || i.price || 0)) * (Number(i.quantity || i.qty || 1))) || 0),

                        // Relational Metadata (Phase 13)
                        // NOW: Derived from Latest Job
                        jobs: itemJobs, // Pass full list for UI
                        latestJobIndex: itemJobs.length, // simple sequence count

                        job_id: latestJob.id,
                        jobType: latestJob.job_type,
                        appointmentDate: latestJob.appointment_date,
                        completionDate: latestJob.completion_date,
                        team: latestJob.assigned_team,
                        jobNotes: latestJob.notes, // jobs table uses 'notes'

                        // Old fields for fallback/historical
                        // remark: i.remark || i.variation_data?.remark,
                        // Old fields for fallback/historical
                        // remark: i.remark || i.variation_data?.remark,
                        description: i.product?.description || i.variation_notes || i.variation_data?.description,
                        googleMapLink: (latestJob.siteAddressRecord?.google_maps_link) || i.google_map_link || i.sub_job_data?.googleMapLink,
                        // location logic is typically in 'site_address_id' which is now in jobs table.
                        // But we haven't migrated address fetch to join jobs.site_address_id yet. 
                        // Let's rely on 'latestJob.site_address_id' if we fetched it? 
                        // We need to fetch nested relations for jobs. 
                        // To keep it simple for this step: stick to order_items relations if they still exist (migration hasn't dropped them yet)
                        // BUT for display, we want the latest job's info.

                        light: i.light || i.variation_data?.light,
                        lightColor: i.light_color || i.variation_data?.lightColor,
                        remote: i.remote || i.variation_data?.remote
                    }
                })
            }))
        } catch (error) {
            console.error('Error fetching orders:', error)
            if (DataManager._isTransientNetworkError?.(error)) {
                // Keep behavior (return []) but surface a clearer hint in console
                console.warn('[getOrders] transient network/Supabase issue - returning empty list temporarily')
            }
            return []
        }
    },

    getOrdersByCustomerId: async (customerId) => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, items:order_items(*, jobs(status, created_at)), paymentSchedule:order_payments(*)')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })

            if (error) throw error

            return data.map(o => ({
                id: o.id,
                customerId: o.customer_id,
                date: o.created_at,
                totalAmount: o.total_amount || o.total || 0,
                status: calculateOrderStatus(o.items), // Runtime Derivation (Phase 11)
                paymentSchedule: (o.paymentSchedule || []).map(p => ({
                    // Map DB snake_case to UI camelCase
                    date: p.payment_date,
                    amount: p.amount,
                    method: p.payment_method,
                    invoiceNo: p.invoice_no,
                    receiptNo: p.receipt_no
                }))
            }))
        } catch (error) {
            console.error('Error fetching orders by customer ID:', error)
            return []
        }
    },

    getJobs: async () => {
        if (!supabase) return []
        try {
            console.log('[getJobs] Fetching from jobs table...')
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    order:orders!order_id (
                        id, order_number, customer_id,
                        customer:customers!customer_id(*)
                    ),
                    orderItem:order_items!order_item_id (
                        id, product_id, product_variant_id,
                        product:products!product_id (name, description, product_code),
                        variant:product_variants (image_url)
                    ),
                    siteAddressRecord:site_address_id(*),
                    siteInspectorRecord:site_inspector_id(*),
                    teamPayment:team_service_fees!team_payment_batch_id(*)
                `)
                .neq('status', 'cancelled')
                .order('appointment_date', { ascending: true })

            if (error) throw error

            return data.map(job => {
                // Resolve Product
                // Priority: Link -> Snapshot (if exists) -> Placeholder
                // Priority: Link -> Snapshot (if exists) -> Placeholder
                const product = job.orderItem?.product
                const variant = job.orderItem?.variant
                const productName = product?.name || job.product_name || 'สินค้าไม่ระบุ'
                const productImage = variant?.image_url || job.product_image_url || null
                const productId = product?.product_code || job.orderItem?.product_id || '-'

                // Resolve Customer
                const customer = job.order?.customer
                const customerName = customer?.name || '-'
                const customerPhone = customer?.phone || '-'

                return {
                    uniqueId: job.id, // Legacy compat
                    id: job.id,
                    orderId: job.order_id,
                    orderNumber: job.order?.order_number,

                    customerName,
                    customerPhone,
                    customer: customer, // Pass full object if needed

                    productId,
                    productName,
                    productImage,
                    product: {
                        id: productId,
                        name: productName,
                        image: productImage
                    },

                    jobType: job.job_type,
                    status: job.status,

                    assignedTeam: job.assigned_team,
                    team: job.assigned_team, // Legacy field

                    appointmentDate: job.appointment_date,
                    completionDate: job.completion_date,

                    // Address
                    address: job.siteAddressRecord?.address || job.install_address || '-',
                    installLocationName: job.siteAddressRecord?.label || job.install_location_name || '-',
                    googleMapLink: job.siteAddressRecord?.google_maps_link || job.google_map_link || '',

                    // Inspector
                    inspectorName: job.siteInspectorRecord?.name || job.site_inspector_name || '-',
                    inspectorPhone: job.siteInspectorRecord?.phone || '-',

                    // Payment
                    teamPaymentBatchId: job.team_payment_batch_id,
                    teamPayment: job.teamPayment, // Pass full object

                    notes: job.notes,

                    // Legacy raw helpers (for sorting/filtering logic in UI)
                    rawJobType: job.job_type === 'ติดตั้ง' ? 'installation' : (job.job_type === 'ขนส่ง' ? 'delivery' : 'other')
                }
            })

        } catch (error) {
            console.error('[getJobs] Error:', error)
            return []
        }
    },

    getJobById: async (id) => {
        try {
            console.log('[getJobById] Fetching job from REAL jobs table for ID:', id)

            const { data: job, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    service_fee_link:team_service_fee_jobs(service_fee_id),
                    order:orders(
                        *,
                        customer:customers(
                            *,
                            addresses:customer_addresses(*),
                            contacts:customer_contacts(*)
                        )
                    ),
                    orderItem:order_items!order_item_id (
                        id, product_id, product_variant_id,
                        product:products!product_id (name, product_code, description),
                        variant:product_variants (image_url)
                    ),
                    siteAddressRecord:site_address_id(*),
                    siteInspectorRecord:site_inspector_id(*),
                    teamPaymentBatch:team_service_fees!team_payment_batch_id(*)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            if (!job) return null

            // Flatten structure for UI
            const product = job.orderItem?.product
            const variant = job.orderItem?.variant
            const productName = product?.name || job.product_name || 'สินค้าไม่ระบุ'
            const productImage = variant?.image_url || job.product_image_url || null

            return {
                ...job,
                serviceFeeId: job.service_fee_link?.[0]?.service_fee_id || null, // Resolve Service Fee ID

                // Compatibility mapping for existing UI
                customer: job.order?.customer,
                customerName: job.order?.customer?.name,
                customerPhone: job.order?.customer?.phone,
                orderDate: job.order?.order_date,
                orderId: job.order_id,

                // Map snake_case to camelCase for UI components (JobInfoCard)
                appointmentDate: job.appointment_date,
                completionDate: job.completion_date,
                note: job.notes || job.description || job.note, // Handle various potential column names (usually 'notes' or 'description')
                jobType: job.job_type,

                // Ensure team is mapped
                team: job.assigned_team || job.team_id || (job.team_name || job.team), // Prefer assigned_team mapping

                // Images/Products (Resolved from relation)
                productName: productName,
                productImage: productImage,
                productId: product?.product_code || job.orderItem?.product_id,

                // Address (Prioritize Relation)
                installLocationName: job.siteAddressRecord?.label || job.install_location_name,
                installAddress: job.siteAddressRecord?.address || job.install_address,
                googleMapLink: job.siteAddressRecord?.google_maps_link || job.google_map_link,
                distance: job.siteAddressRecord?.distance || job.distance, // Ensure distance is mapped

                // Inspector
                inspector: job.siteInspectorRecord?.name || job.site_inspector_name,
                inspector1: job.siteInspectorRecord ? {
                    id: job.siteInspectorRecord.id,
                    name: job.siteInspectorRecord.name,
                    phone: job.siteInspectorRecord.phone,
                    lineId: job.siteInspectorRecord.line_id,
                    email: job.siteInspectorRecord.email,
                    position: job.siteInspectorRecord.position,
                    note: job.siteInspectorRecord.note
                } : { name: job.site_inspector_name || '', phone: '' },

                // Team Payment Info
                teamPaymentBatch: job.teamPaymentBatch,
                teamPaymentBatchId: job.team_payment_batch_id
            }

        } catch (error) {
            console.error('[getJobById] Error:', error)
            return null
        }
    },
    // getJobById: OLD LOGIC REMOVED



    // --- Data Modification Helpers ---

    updateJob: async (id, jobData) => {
        try {
            console.log('Updating job:', id, jobData)

            const { data, error } = await supabase
                .from('jobs')
                .update(jobData)
                .eq('id', id)
                .select()
                .single()

            if (error) {
                console.error('Error updating job:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('Error in DataManager.updateJob:', error)
            return null
        }
    },

    saveCustomer: async (customerData) => {
        try {
            // Generate ID if missing (client-side UUID) or let DB handle it.
            // But we need the ID for related tables.
            // Using crypto.randomUUID() if available, else relying on DB return.
            // Since we need to save related inputs using the ID, we must know it.
            let customerId = customerData.id;
            if (!customerId) {
                // For new customers, we can let DB generate it, but we need it for contacts/addresses.
                // So we'll use a placeholder or 2-step save?
                // Better: Upsert main customer first, get ID, then save others.
            }

            console.log('[saveCustomer] processing:', customerData.name)

            const dbPayload = {
                // If it's a new customer (no ID), don't send ID to let DB generate default
                ...(customerId ? { id: customerId } : {}),
                name: customerData.name,
                phone: customerData.phone,
                email: customerData.email,
                line_id: customerData.line || customerData.lineId,
                facebook: customerData.facebook,
                instagram: customerData.instagram,
                media_source: customerData.mediaSource,
                media_source: customerData.mediaSource,
            }

            // 1. Upsert customer
            const { data, error } = await supabase
                .from('customers')
                .upsert(dbPayload)
                .select()
                .single() // Expect single result

            if (error) {
                console.error('Supabase Error saving customer:', error)
                throw error
            }

            const c = data
            if (!c) return null

            // Update local ID with the one from DB (real UUID)
            customerId = c.id;

            // Helper to checklist UUID (now redundant but keeping for safety if needed)
            const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

            // Helper to prepare payload
            const preparePayload = (item, extraFields = {}) => {
                const payload = { ...extraFields }
                if (item.id && isValidUUID(item.id)) {
                    payload.id = item.id
                }
                return payload
            }

            // 2. Save contacts to customer_contacts table
            if (Array.isArray(customerData.contacts) && customerData.contacts.length > 0) {
                const validContacts = customerData.contacts.filter(c => c.name && c.name.trim() !== '')

                if (validContacts.length > 0) {
                    const contactsPayload = validContacts.map(contact => preparePayload(contact, {
                        customer_id: customerId,
                        name: contact.name,
                        phone: contact.phone,
                        line_id: contact.lineId,
                        email: contact.email,
                        position: contact.position,
                        note: contact.note
                    }))

                    // Split: Existing (has ID) vs New (no ID)
                    const newContacts = contactsPayload.filter(c => !c.id)
                    const existingContacts = contactsPayload.filter(c => c.id)

                    // Insert new contacts
                    let insertedContacts = []
                    if (newContacts.length > 0) {
                        const { data: insData, error: insertError } = await supabase.from('customer_contacts').insert(newContacts).select()
                        if (insertError) throw insertError
                        insertedContacts = insData
                    }
                    if (existingContacts.length > 0) {
                        const { error: upsertError } = await supabase.from('customer_contacts').upsert(existingContacts)
                        if (upsertError) throw upsertError
                    }

                    // Sync/Delete Logic
                    const { data: currentContacts } = await supabase
                        .from('customer_contacts')
                        .select('id')
                        .eq('customer_id', customerId)

                    if (currentContacts) {
                        const existingIds = existingContacts.map(c => c.id)
                        const newIds = insertedContacts ? insertedContacts.map(c => c.id) : []
                        const validIds = [...existingIds, ...newIds] // Keep both existing AND newly inserted

                        const idsToDelete = currentContacts
                            .map(c => c.id)
                            .filter(id => !validIds.includes(id))

                        if (idsToDelete.length > 0) {
                            const { error: deleteError } = await supabase.from('customer_contacts').delete().in('id', idsToDelete)
                            if (deleteError) throw deleteError
                        }
                    }
                } else {
                    const { error: deleteError } = await supabase.from('customer_contacts').delete().eq('customer_id', customerId)
                    if (deleteError) throw deleteError
                }
            }

            // 3. Save addresses to customer_addresses table
            if (Array.isArray(customerData.addresses) && customerData.addresses.length > 0) {
                const validAddresses = customerData.addresses.filter(addr => {
                    if (isValidUUID(addr.id)) return true
                    return addr.label || addr.addrNumber || addr.addrProvince || addr.address
                })

                if (validAddresses.length > 0) {
                    const addressesPayload = validAddresses.map(addr => {
                        // Construct full address from detailed fields (required for NOT NULL constraint)
                        const addressParts = [
                            addr.addrNumber && `เลขที่ ${addr.addrNumber}`,
                            addr.addrMoo && `หมู่ ${addr.addrMoo}`,
                            addr.addrVillage && addr.addrVillage,
                            addr.addrSoi && `ซอย ${addr.addrSoi}`,
                            addr.addrRoad && `ถนน ${addr.addrRoad}`,
                            addr.addrTambon && `ตำบล${addr.addrTambon}`,
                            addr.addrAmphoe && `อำเภอ${addr.addrAmphoe}`,
                            (addr.addrProvince || addr.province) && `จังหวัด${addr.addrProvince || addr.province}`,
                            (addr.addrZipcode || addr.zipcode) && (addr.addrZipcode || addr.zipcode)
                        ].filter(Boolean).join(' ')

                        return preparePayload(addr, {
                            customer_id: customerId,
                            label: addr.label,
                            addr_number: addr.addrNumber,
                            addr_moo: addr.addrMoo,
                            addr_village: addr.addrVillage,
                            addr_soi: addr.addrSoi,
                            addr_road: addr.addrRoad,
                            addr_tambon: addr.addrTambon,
                            addr_amphoe: addr.addrAmphoe,
                            addr_province: addr.province || addr.addrProvince,
                            zipcode: addr.zipcode || addr.addrZipcode,
                            google_maps_link: addr.googleMapsLink,
                            address: addressParts || addr.address || 'ไม่ระบุ'
                        })
                    })

                    const newAddresses = addressesPayload.filter(a => !a.id)
                    const existingAddresses = addressesPayload.filter(a => a.id)

                    let insertedAddresses = []
                    if (newAddresses.length > 0) {
                        const { data: insData, error: insertError } = await supabase.from('customer_addresses').insert(newAddresses).select()
                        if (insertError) throw insertError
                        insertedAddresses = insData
                    }
                    if (existingAddresses.length > 0) {
                        const { error: upsertError } = await supabase.from('customer_addresses').upsert(existingAddresses)
                        if (upsertError) throw upsertError
                    }

                    const { data: currentAddresses } = await supabase
                        .from('customer_addresses')
                        .select('id')
                        .eq('customer_id', customerId)

                    if (currentAddresses) {
                        const existingIds = existingAddresses.map(a => a.id)
                        const newIds = insertedAddresses ? insertedAddresses.map(a => a.id) : []
                        const validIds = [...existingIds, ...newIds]

                        const idsToDelete = currentAddresses
                            .map(a => a.id)
                            .filter(id => !validIds.includes(id))

                        if (idsToDelete.length > 0) {
                            const { error: deleteError } = await supabase.from('customer_addresses').delete().in('id', idsToDelete)
                            if (deleteError) throw deleteError
                        }
                    }
                } else {
                    const { error: deleteError } = await supabase.from('customer_addresses').delete().eq('customer_id', customerId)
                    if (deleteError) throw deleteError
                }
            }

            // 4. Save tax invoices to customer_tax_invoices table
            if (Array.isArray(customerData.taxInvoices) && customerData.taxInvoices.length > 0) {
                console.log('[saveCustomer] Processing tax invoices:', customerData.taxInvoices.length)

                // Filter out incomplete tax invoices
                const validTaxInvoices = customerData.taxInvoices.filter(tax => {
                    const isUUID = isValidUUID(tax.id)
                    // For new records check required fields (Relaxed: allow companyName OR taxId)
                    // Previously required BOTH, which caused silent data loss if Tax ID was missing.
                    const hasData = (tax.companyName && tax.companyName.trim() !== '') || (tax.taxId && tax.taxId.trim() !== '')

                    console.log(`[saveCustomer] Tax Check: ID=${tax.id} isUUID=${isUUID} hasData=${hasData}`, tax)
                    return isUUID || hasData
                })

                console.log('[saveCustomer] Valid tax invoices:', validTaxInvoices.length)

                if (validTaxInvoices.length > 0) {
                    const taxInvoicesPayload = validTaxInvoices.map(tax => {
                        const addressParts = [
                            tax.addrNumber && `เลขที่ ${tax.addrNumber}`,
                            tax.addrMoo && `หมู่ ${tax.addrMoo}`,
                            tax.addrVillage && tax.addrVillage,
                            tax.addrSoi && `ซอย ${tax.addrSoi}`,
                            tax.addrRoad && `ถนน ${tax.addrRoad}`,
                            tax.addrTambon && `ตำบล${tax.addrTambon}`,
                            tax.addrAmphoe && `อำเภอ${tax.addrAmphoe}`,
                            tax.addrProvince && `จังหวัด${tax.addrProvince}`,
                            tax.addrZipcode && tax.addrZipcode
                        ].filter(Boolean).join(' ')

                        const extraFields = {
                            customer_id: customerId,
                            company_name: tax.companyName,
                            tax_id: tax.taxId,
                            branch_number: tax.branchNumber || tax.branch,
                            // New Granular Address Fields
                            house_number: tax.addrNumber,
                            village_no: tax.addrMoo,
                            building: tax.addrVillage,
                            soi: tax.addrSoi,
                            road: tax.addrRoad,
                            sub_district: tax.addrTambon,
                            district: tax.addrAmphoe,
                            province: tax.addrProvince,
                            postal_code: tax.addrZipcode
                        }
                        return preparePayload(tax, extraFields)
                    })

                    const newTaxInvoices = taxInvoicesPayload.filter(t => !t.id)
                    const existingTaxInvoices = taxInvoicesPayload.filter(t => t.id)

                    console.log('[saveCustomer] New Tax Payload:', newTaxInvoices)
                    console.log('[saveCustomer] Existing Tax Payload:', existingTaxInvoices)

                    // Insert new tax invoices
                    let insertedTaxInvoices = []
                    if (newTaxInvoices.length > 0) {
                        console.log('[saveCustomer] Inserting New Tax Invoices...', JSON.stringify(newTaxInvoices, null, 2))
                        const { data: insertData, error: insertError } = await supabase.from('customer_tax_invoices').insert(newTaxInvoices).select()

                        if (insertError) {
                            console.error('[saveCustomer] Error inserting tax invoices:', insertError)
                            throw insertError
                        } else {
                            console.log('[saveCustomer] Insert Success. Result:', insertData)
                            insertedTaxInvoices = insertData
                        }
                    }

                    // Upsert existing tax invoices
                    if (existingTaxInvoices.length > 0) {
                        const { error: upsertError } = await supabase.from('customer_tax_invoices').upsert(existingTaxInvoices)
                        if (upsertError) {
                            console.error('Error updating tax invoices:', upsertError)
                            throw upsertError
                        }
                    }

                    // Sync/Delete tax invoices
                    const { data: currentTaxInvoices } = await supabase
                        .from('customer_tax_invoices')
                        .select('id')
                        .eq('customer_id', customerId)

                    if (currentTaxInvoices) {
                        const existingIds = existingTaxInvoices.map(t => t.id)
                        const newIds = insertedTaxInvoices ? insertedTaxInvoices.map(t => t.id) : []
                        const validIds = [...existingIds, ...newIds] // FIX: Don't delete just-inserted items

                        const idsToDelete = currentTaxInvoices
                            .map(t => t.id)
                            .filter(id => !validIds.includes(id))

                        if (idsToDelete.length > 0) {
                            const { error: deleteError } = await supabase.from('customer_tax_invoices').delete().in('id', idsToDelete)
                            if (deleteError) {
                                console.error('Error deleting tax invoices:', deleteError)
                                throw deleteError
                            }
                        }
                    }
                } else {
                    await supabase.from('customer_tax_invoices').delete().eq('customer_id', customerId)
                }
            }

            // Return mapped object to match getCustomers format
            // Return updated object by re-fetching (ensures we get generated IDs/relations)
            return await DataManager.getCustomerById(customerId)
        } catch (error) {
            console.error('DataManager Error saving customer:', error)
            return null
        }
    },

    deleteCustomer: async (id) => {
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting customer:', error)
            return false
        }
    },

    saveProduct: async (productData) => {
        try {
            if (!supabase) throw new Error('Supabase client not initialized')

            const variants = productData.variants || []

            // 1. Calculate Aggregated Fields
            const prices = variants.map(v => parseFloat(v.price) || 0).filter(p => p > 0)
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0
            const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
            const allImages = []
            variants.forEach(v => {
                if (v.images && Array.isArray(v.images)) {
                    v.images.forEach(img => {
                        if (img && !allImages.includes(img)) allImages.push(img)
                    })
                }
            })

            // 2. Prepare Product Payload (Synced with legacy-to-modern aliases)
            const dbPayload = {
                name: productData.name || '',
                category: productData.category || '',
                description: productData.description || '',
                material: productData.material || '',
                // min_stock_level: productData.min_stock_level || 0, // REMOVED: Column dropped
                // variants: variants, // REMOVED: JSONB column dropped
                // image_url: allImages[0] || null, // REMOVED: Column dropped from products. Images are in variants.

                // Legacy Aliases (Synced by trigger but good to have in payload)
                // code: productData.product_code || productData.id, // REMOVED: Column dropped
                product_code: productData.product_code || productData.id,
                // image: allImages[0] || null, // REMOVED: Redundant
                updated_at: new Date().toISOString()
            }

            if (productData.uuid) dbPayload.uuid = productData.uuid
            if (!dbPayload.product_code) throw new Error('Product code is required')

            // 3. Upsert Main Product
            const { data, error } = await supabase
                .from('products')
                .upsert(dbPayload, { onConflict: 'product_code' })
                .select()

            if (error) throw error
            const savedProduct = data?.[0]
            if (!savedProduct) throw new Error('Failed to retrieve saved product record')

            // 4. Sync Variants to product_variants table (Safe Upsert)
            try {
                if (variants.length > 0) {
                    const variantsToUpsert = variants.map(v => {
                        // SKU Generation (consistent with VariantManager)
                        const getColorCode = (c) => {
                            if (!c) return 'XX'
                            if (c.includes('ทองเหลือง')) return 'BS'
                            if (c.includes('ทอง') || c.includes('Gold') || c.includes('GD')) return 'GD'
                            if (c.includes('โรสโกลด์') || c.includes('พิงค์โกลด์') || c.includes('PG')) return 'PG'
                            if (c.includes('เงิน') || c.includes('SL')) return 'SL'
                            if (c.includes('ดำ') || c.includes('BK')) return 'BK'
                            if (c.includes('ขาว') || c.includes('WH')) return 'WH'
                            if (c.includes('ใส') || c.includes('CL')) return 'CL'
                            return 'XX'
                        }
                        const getCryCode = (c) => {
                            if (!c) return null
                            if (c.includes('ใส')) return 'CL'
                            if (c.includes('ทอง')) return 'GD'
                            if (c.includes('ชา')) return 'TEA'
                            if (c.includes('ควันบุหรี่')) return 'SM'
                            return 'XX'
                        }
                        let sizeStr = ''
                        if (v.dimensions) {
                            const { length: l, width: w, height: h } = v.dimensions
                            if (l || w || h) sizeStr = `D${l || 0}x${w || 0}x${h || 0}`
                        }
                        const cCode = getColorCode(v.color)
                        const cryCode = getCryCode(v.crystalColor)
                        let skuParts = [savedProduct.product_code]
                        if (sizeStr) skuParts.push(sizeStr)
                        skuParts.push(cCode)
                        if (cryCode) skuParts.push(cryCode)
                        const generatedSku = skuParts.join('-')

                        return {
                            product_id: savedProduct.uuid,
                            color: v.color,
                            size: sizeStr.replace(/^D/, ''),
                            sku: v.sku || generatedSku,
                            price: parseFloat(v.price) || 0,
                            // stock: parseInt(v.stock) || 0, // REMOVED: Managed via inventory_in/out
                            // min_stock_level: parseInt(v.minStock) || 0, // REMOVED: Dropped
                            crystal_color: v.crystalColor,
                            image_url: (v.images && v.images.length > 0) ? v.images[0] : null
                        }
                    });

                    // We use upsert on 'sku' to avoid deleting referenced variants
                    const { error: variantError } = await supabase
                        .from('product_variants')
                        .upsert(variantsToUpsert, { onConflict: 'sku' })

                    if (variantError) throw variantError;

                    // Deletion of orphaned variants (those not in the current set)
                    const activeSkus = variantsToUpsert.map(v => v.sku);
                    if (activeSkus.length > 0) {
                        await supabase
                            .from('product_variants')
                            .delete()
                            .eq('product_id', savedProduct.uuid)
                            .not('sku', 'in', `(${activeSkus.map(s => `"${s}"`).join(',')})`);
                    }
                } else {
                    // No variants provided, delete all for this product
                    await supabase.from('product_variants').delete().eq('product_id', savedProduct.uuid);
                }
            } catch (syncErr) {
                console.error('[Sync] product_variants synchronization failed:', syncErr.message);
                // We don't throw here to avoid failing the whole save if sync fails
            }

            // 5. Build return object
            return {
                uuid: savedProduct.uuid,
                id: savedProduct.uuid,
                product_code: savedProduct.product_code,
                name: savedProduct.name,
                category: savedProduct.category,
                price: savedProduct.price,
                stock: savedProduct.stock,
                description: savedProduct.description,
                material: savedProduct.material,
                variants: savedProduct.variants || [],
                images: savedProduct.image_url ? [savedProduct.image_url] : []
            }
        } catch (error) {
            console.error('CRITICAL: Error saving product:', error.message);
            return null
        }
    },

    deleteProduct: async (productId) => {
        try {
            // productId can be either uuid or old id
            // Try to find the product first to get its uuid
            const { data: product } = await supabase
                .from('products')
                .select('uuid')
                .or('uuid.eq.' + productId + ',product_code.eq.' + productId)
                .single()

            if (!product) {
                throw new Error('Product not found')
            }

            // Delete using uuid (primary key)
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('uuid', product.uuid)

            if (error) {
                console.error('Error deleting product:', error)
                throw error
            }
            return { success: true }
        } catch (error) {
            console.error('Error deleting product:', error)

            // Check for Foreign Key Violation
            if (error.code === '23503') {
                return {
                    success: false,
                    error: 'ไม่สามารถลบสินค้าได้เนื่องจากมีการใช้งานอยู่ใน Order หรือรายการอื่นๆ'
                }
            }

            return {
                success: false,
                error: error.message || 'เกิดข้อผิดพลาดในการลบสินค้า'
            }
        }
    },

    saveOrder: async (orderData) => {
        try {
            console.log('[saveOrder] Starting save order process')
            console.log('[saveOrder] Order ID:', orderData.id)
            console.log('[saveOrder] Items count:', orderData.items?.length)
            console.log('[saveOrder] Payment schedule:', orderData.paymentSchedule)

            // 0. Upload payment signatures to storage (if any)
            let uploadedPaymentSchedule = orderData.paymentSchedule
            if (orderData.paymentSchedule && orderData.paymentSchedule.length > 0) {
                console.log('[saveOrder] Processing ' + orderData.paymentSchedule.length + ' payment(s)')

                uploadedPaymentSchedule = await Promise.all(
                    orderData.paymentSchedule.map(async (payment, index) => {
                        console.log('[saveOrder] Processing payment ' + index + ': ', {
                            hasReceiverSig: !!payment.receiverSignature,
                            hasPayerSig: !!payment.payerSignature
                        })

                        const receiverUrl = await DataManager.uploadSignature(
                            payment.receiverSignature,
                            orderData.id,
                            index,
                            'receiver'
                        )

                        const payerUrl = await DataManager.uploadSignature(
                            payment.payerSignature,
                            orderData.id,
                            index,
                            'payer'
                        )

                        console.log('[saveOrder] Payment ' + index + ' URLs: ', {
                            receiver: receiverUrl ? receiverUrl.substring(0, 50) + '...' : '',
                            payer: payerUrl ? payerUrl.substring(0, 50) + '...' : ''
                        })

                        return {
                            ...payment,
                            receiverSignature: receiverUrl,
                            payerSignature: payerUrl
                        }
                    })
                )

                console.log('[saveOrder] All payments processed')
            } else {
                console.log('[saveOrder] No payment schedule to process')
            }

            // 1. Prepare Order Payload

            // Logic: Prefer standard delivery address, fallback to tax invoice delivery address
            const rawDelivery = (orderData.deliveryAddress?.address || orderData.deliveryAddress?.id)
                ? orderData.deliveryAddress
                : orderData.taxInvoiceDeliveryAddress;

            // UUID Check
            const isUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            let orderId = orderData.id;
            // If coming from UI as "new" or "OD...", it might not be a UUID.
            // If it looks like 'OD...' it's the order_number, not the new UUID PK.
            // In that case, we should treat it as a new order (assuming we didn't fetch a UUID).
            // But UI usually passes the UUID if editing.

            let orderNumber = orderData.order_number || orderData.orderNumber;

            // Handling New Order Case:
            // IF id is NULL or doesn't look like UUID, it's a NEW ORDER.
            // If id looks like 'OD...' it's likely the generated order number passed as ID from legacy UI code.

            const isNewOrder = !orderId || !isUUID(orderId);

            if (isNewOrder) {
                // If ID was passed as "OD...", use it as order_number
                if (orderId && typeof orderId === 'string' && orderId.startsWith('OD')) {
                    orderNumber = orderId;
                }
                // Clear ID to let DB generate UUID
                orderId = undefined; // Will be omitted from generic upsert if we construct properly, 
                // BUT supabase upsert needs a PK to update, or none to insert.
                // Since we are inserting a NEW order, we leave `id` out or generate one.
            }

            // Helper to validate UUID
            const validUUID = (id) => {
                if (!id) return null
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
                if (!isUUID) {
                    console.warn(`[saveOrder] Invalid UUID encountered and nulled: ${id}`)
                    return null
                }
                return id
            }

            // 1. Prepare Order Payload

            const orderPayload = {
                // id: orderData.id, // Only include if valida UUID
                ...(orderId ? { id: orderId } : {}),

                order_number: orderNumber, // Ensure this is saved

                customer_id: validUUID(orderData.customer?.id),
                // customer_name: orderData.customer?.name, // Removed: Relation-only

                // FK references
                purchaser_contact_id: validUUID(orderData.purchaserContact?.id),
                receiver_contact_id: validUUID(orderData.receiverContact?.id),

                tax_invoice_id: validUUID(orderData.taxInvoice?.id),

                // JSONB Fallbacks: PHYSICALLY REMOVED (Option B)
                // Columns delivery_address_info, selected_contact_info, etc. are gone.

                // Standard Fields
                order_date: orderData.date,
                total: orderData.total,
                shipping_fee: orderData.shippingFee,
                vat_rate: 0.07,

                // Relational Fields (Phase 11)
                job_type: orderData.jobInfo?.job_type || orderData.jobInfo?.jobType || null,
                // assigned_team: REMOVED (Moved to items)
                // appointment_date: REMOVED (Moved to items)
                // completion_date: REMOVED (Moved to items)
                // notes: REMOVED (Moved to items)

                discount_mode: orderData.discount?.mode || 'percent',
                discount_value: Number(orderData.discount?.value || 0)
            }

            // 2. Upsert Order Header (retry transient network/Supabase edge issues)
            const { data: savedOrder, error: orderError } = await DataManager._withRetry(
                'saveOrder:upsertOrder',
                async () => {
                    return await supabase
                        .from('orders')
                        .upsert(orderPayload)
                        .select() // Return the saved row to get UUID
                        .single()
                }
            )

            if (orderError) {
                console.error('[saveOrder] Error upserting order header:', orderError)
                throw orderError
            }

            // Update IDs for child records
            const finalOrderId = savedOrder.id;


            // 3. Save Items to order_items Table
            // 3.1 PREPARE ITEMS PAYLOAD WITH IDs (Upsert Strategy)

            // PRE-ASSIGN IDs to ensure stability (Fix index mismatch issues)
            const itemsWithIds = orderData.items.map(item => {
                // If item has a valid UUID, use it. Otherwise, generate a new one.
                const existingId = validUUID(item.id) || validUUID(item.uuid) // Support both fields
                const finalId = existingId || crypto.randomUUID()

                return {
                    ...item,
                    _finalId: finalId // Store for payload construction
                }
            })


            // 3.3 Prepare Items Payload
            const itemsPayload = itemsWithIds.map(item => {
                const productIdentifier = item.product_id || item.uuid || item.id
                // Use regex directly here or helper if needed, but item.product_id usually comes from DB
                const isUUID = productIdentifier && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdentifier)

                const itemCode = item.code || item.item_code || item.product_code
                // Fallback logic for productId
                const resolvedProductId = isUUID ? productIdentifier : (item.selectedVariant?.product_id || codeToIdMap[itemCode] || null)

                // Realtime: Resolve Variant ID
                const variantId = item.selectedVariant?.id || item.variant_id || item.variantId || null

                return {
                    id: item._finalId, // USE PRE-ASSIGNED ID
                    order_id: finalOrderId, // Use validated UUID
                    product_id: validUUID(resolvedProductId),
                    product_variant_id: validUUID(variantId),

                    // Common fields
                    quantity: Number(item.qty || item.quantity || 1),
                    unit_price: Number(item.unitPrice || item.price || 0),
                    // total: Number(item.total || 0), // Generated column

                    remark: item.remark || null,
                    light: item.light || item.bulbType || null,
                    light_color: item.lightColor || null,
                    remote: item.remote || null,
                }
            })

            console.log('[saveOrder] Prepared items payload:', itemsPayload.length, 'items')
            console.log('[saveOrder] First item sample:', itemsPayload[0])

            if (itemsPayload.length > 0) {
                const { data: insertedItems, error: itemsError } = await supabase
                    .from('order_items')
                    .upsert(itemsPayload)
                    .select()

                if (itemsError) {
                    console.error('[saveOrder] Error inserting order items:', itemsError)
                    console.error('[saveOrder] Failed payload:', JSON.stringify(itemsPayload, null, 2))
                    throw itemsError
                }
                console.log('[saveOrder] Successfully upserted', itemsPayload.length, 'items')

                // 3.2 DELETE ORPHANED Items
                // Delete items that are in DB but NOT in the new payload
                const currentItemIds = itemsPayload.map(i => i.id)
                console.log('[saveOrder] Current Item IDs:', currentItemIds)

                if (currentItemIds.length > 0) {
                    const { error: deleteOrphanItemsError } = await supabase
                        .from('order_items')
                        .delete()
                        .eq('order_id', finalOrderId)
                        .not('id', 'in', `(${currentItemIds.map(id => `"${id}"`).join(',')})`)

                    if (deleteOrphanItemsError) {
                        console.error('[saveOrder] Error deleting orphan items:', deleteOrphanItemsError)
                        // Non-critical (?)
                    }
                }

                // 3. Create Jobs (1:N Refactor) WITH UPSERT
                // Use insertedItems (which contains IDs) + original orderData.items map

                // We map insertedItems back to original orderData.items to get the full job list
                const allJobsPayload = []

                itemsWithIds.forEach((itemWithId, idx) => {
                    // Use 'jobs' array directly (source of truth)
                    // No more subJob fallback - jobs array is the single source of truth
                    let itemJobs = [...(itemWithId.jobs || [])]

                    // If no jobs exist, create a default one
                    if (itemJobs.length === 0) {
                        itemJobs = [{
                            jobType: 'installation',
                            status: 'รอดำเนินการ',
                            sequence_number: 1
                        }]
                    }

                    itemJobs.forEach((job, jobIdx) => {
                        const payload = {
                            id: validUUID(job.id) || crypto.randomUUID(), // PRESERVE Job ID or GEN NEW
                            order_item_id: itemWithId._finalId, // Persistent Item ID (Linked via Pre-assigned ID)
                            order_id: finalOrderId,
                            // sequence_number: job.sequence_number || (jobIdx + 1), // REMOVED

                            job_type: job.jobType || job.job_type || 'installation',
                            status: job.status || 'รอดำเนินการ',

                            assigned_team: job.team || job.assigned_team || null,
                            appointment_date: job.appointmentDate || job.appointment_date || null,
                            completion_date: job.completionDate || job.completion_date || null,

                            notes: job.description || job.notes || null,

                            site_address_id: validUUID(job.installLocationId || job.site_address_id),
                            site_inspector_id: validUUID(job.inspector1?.id || job.site_inspector_id),
                            team_payment_batch_id: job.serviceFeeId || job.team_payment_batch_id || null // Map service fee ID
                        }

                        // PRESERVE created_at:
                        // 1. If we have a 'created_at' in the job object (from DB via getOrderById), keep it.
                        // 2. If it's a new job (no ID or ID is 'NEW...'), DON'T send created_at, let DB default to now().
                        // Ensure created_at is never null (Backfill logic)
                        // If job.created_at is null/undefined, use current time (for new jobs or legacy data fix)
                        payload.created_at = job.created_at || new Date().toISOString()

                        allJobsPayload.push(payload)
                    })
                })

                // --- Global Sorting Removed to Preserve UI Order ---


                // Re-assign sequence_number globally (1, 2, 3...)
                // REMOVED sequence_number assignment
                // allJobsPayload.forEach((job, index) => {
                //    job.sequence_number = index + 1
                // })


                if (allJobsPayload.length > 0) {
                    const { data: createdJobs, error: jobsError } = await supabase
                        .from('jobs')
                        .upsert(allJobsPayload)
                        .select()

                    if (jobsError) {
                        console.error('[saveOrder] Error upserting jobs:', jobsError)
                        throw jobsError
                    }

                    // 3.4 DELETE ORPHANED Jobs
                    const currentJobIds = allJobsPayload.map(j => j.id)
                    if (currentJobIds.length > 0) {
                        const { error: deleteOrphanJobsError } = await supabase
                            .from('jobs')
                            .delete()
                            .eq('order_id', finalOrderId)
                            .not('id', 'in', `(${currentJobIds.map(id => `"${id}"`).join(',')})`)

                        if (deleteOrphanJobsError) {
                            console.error('[saveOrder] Error deleting orphan jobs:', deleteOrphanJobsError)
                        }
                    }


                    console.log('[saveOrder] Successfully created', allJobsPayload.length, 'jobs')

                    // 3.1 Sync Team Service Fee Links (Junction Table)
                    // Since jobs were recreated, we must re-establish the many-to-many links.
                    const serviceFeeLinks = createdJobs
                        .filter(job => job.team_payment_batch_id)
                        .map(job => ({
                            service_fee_id: job.team_payment_batch_id,
                            job_id: job.id
                        }))

                    if (serviceFeeLinks.length > 0) {
                        console.log('[saveOrder] Syncing service fee links:', serviceFeeLinks.length)
                        const { error: linkError } = await supabase
                            .from('team_service_fee_jobs')
                            .upsert(serviceFeeLinks, { onConflict: 'service_fee_id, job_id', ignoreDuplicates: true })

                        if (linkError) {
                            console.warn('[saveOrder] Warning: Failed to sync service fee links via upsert:', linkError)
                            // Non-blocking error, but worth logging
                        }
                    }
                }
                // (Block closed)
            }

            // 3. Handle Jobs (Relational) - REMOVED
            // Legacy 'jobs' table sync removed. 
            // All job data is now in 'order_items' (job_type, assigned_team, appointment_date, etc.)

            // 4. Save Payment Schedule (order_payments)
            // 4.1 Delete existing payments to sync
            const { error: deletePaymentError } = await supabase
                .from('order_payments')
                .delete()
                .eq('order_id', finalOrderId)

            if (deletePaymentError) {
                console.error('[saveOrder] Error clearing old payments:', deletePaymentError)
                throw deletePaymentError
            }

            // 4.2 Insert new payments
            if (uploadedPaymentSchedule && uploadedPaymentSchedule.length > 0) {
                const paymentsPayload = await Promise.all(uploadedPaymentSchedule.map(async p => {
                    // Auto-generate IDs if requested
                    let ivNo = p.invoiceNo
                    if (p.issueInvoice && !ivNo) {
                        ivNo = await DataManager._generateDocumentId('IV', p.invoiceDate || p.date)
                    }

                    let rcNo = p.receiptNo
                    if (p.issueReceipt && !rcNo) {
                        rcNo = await DataManager._generateDocumentId('RC', p.receiptDate || p.date)
                    }

                    return {
                        order_id: finalOrderId,
                        payment_date: p.date || null,
                        amount: p.amount,
                        // UI uses `paymentMethod` while DB uses `payment_method`
                        payment_method: p.method || p.paymentMethod || p.payment_method || null,
                        payment_type: p.type || 'deposit',
                        // UI uses `slip` while DB uses `proof_url`
                        proof_url: p.proofUrl || p.proof_url || p.slip || null,
                        // Signatures (stored as public URL in Supabase Storage)
                        receiver_signature: p.receiverSignature || p.receiver_signature || null,
                        payer_signature: p.payerSignature || p.payer_signature || null,
                        status: p.status || 'Completed',
                        is_deposit: p.type === 'deposit', // Derive or use existing
                        // Document Tracking
                        invoice_no: ivNo || null,
                        invoice_date: p.invoiceDate || (ivNo ? p.date : null),
                        receipt_no: rcNo || null,
                        receipt_date: p.receiptDate || (rcNo ? p.date : null)
                    }
                }))

                const { error: insertPaymentError } = await supabase
                    .from('order_payments')
                    .insert(paymentsPayload)

                if (insertPaymentError) {
                    console.error('[saveOrder] Error inserting payments:', insertPaymentError)
                    throw insertPaymentError
                }
                console.log('[saveOrder] Saved ' + paymentsPayload.length + ' payments')
            }

            return true
        } catch (error) {
            console.error('Error saving order:', error)
            // Provide a user-friendly message for UI (Order.jsx shows result.message)
            if (DataManager._isTransientNetworkError(error)) {
                return {
                    message: 'บันทึกไม่สำเร็จ: เชื่อมต่อฐานข้อมูลไม่ได้ชั่วคราว (เครือข่าย/Supabase) กรุณาลองใหม่อีกครั้ง',
                    original: { name: error?.name, message: error?.message }
                }
            }
            return error // Return error object for debugging
        }
    },

    deleteOrder: async (id) => {
        if (!supabase) return false
        try {
            // Delete related tables explicitly to prevent Foreign Key constraints
            await supabase.from('order_payments').delete().eq('order_id', id)
            await supabase.from('order_items').delete().eq('order_id', id)
            // await supabase.from('jobs').delete().eq('order_id', id) // Table Removed

            // Then delete the order
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Delete order error:', error)
                throw error
            }
            return true
        } catch (error) {
            console.error('Error deleting order:', error)
            alert('ไม่สามารถลบได้: ' + (error.message || 'Unknown error'))
            return false
        }
    },

    getNextOrderNumber: async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('order_number')
                .order('order_number', { ascending: false })
                .limit(1)

            if (error) throw error

            if (data && data.length > 0) {
                const lastId = data[0].order_number
                if (!lastId) return 'OD0000001'
                // Extract number: OD0000001
                const numStr = lastId.replace(/\D/g, '')
                const num = parseInt(numStr, 10)
                return 'OD' + (num + 1).toString().padStart(7, '0')
            }
            return 'OD0000001'
        } catch (error) {
            return 'OD0000001'
        }
    },

    getNextJobId: async () => {
        // Redundant if using UUIDs or derived counting
        // But for safe fallback, we can return a timestamp based mock
        return 'JB' + Date.now().toString().slice(-7)
    },

    saveJob: async (jobData) => {
        try {
            console.log('[saveJob] Updating order_items with:', jobData)

            // Convert camelCase app data back to snake_case for DB
            // Update order_items directly!
            const updatePayload = {
                // job_type: jobData.jobType, // Typically not changed by technician on mobile?
                appointment_date: jobData.jobDate, // Technician might update date
                // job_time: jobData.jobTime, // Not standard column in order_items yet? If not, ignore or put in notes.
                assigned_team: jobData.assignedTeam,
                status: jobData.status,
                job_notes: jobData.notes, // Map notes -> job_notes
                completion_date: jobData.completionDate, // if passed

                // Inspector update
                // inspector: jobData.inspector1?.name || jobData.inspector || '', // Computed
                // inspector1: jobData.inspector1 || {}, // Not usually editable by technician

                // Location update (unlikely by technician?)
                // install_location_name: jobData.installLocationName || ''
            }

            // If technician updates inspector, we should handle it:
            if (jobData.inspector1) {
                // update site_inspector_id? Reference phase 3.
                // For now, let's stick to what writes to order_items columns we KNOW exist.
            }

            // CRITICAL: Finding the row.
            // jobData.id IS the job_id (which is mapped to order_items.job_id)
            // or it is order_items.id if using uuid.
            // getJobs uses: jobId = item.job_id || subJob.jobId || `${order.id}-${itemIdx + 1}`
            // If it's a generated string, we might have trouble matching unless we stored it in job_id.

            const { error } = await supabase
                .from('order_items')
                .update(updatePayload)
                .or(`job_id.eq.${jobData.id},id.eq.${jobData.id}`) // Try both

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Error saving job:', error)
            return { success: false, error: error.message || JSON.stringify(error) }
        }
    },

    // Internal helper purely for compatibility if needed, but getJobs covers it.
    getJobsRaw: async () => {
        // const { data } = await supabase.from('jobs').select('*')
        // return data || []
        return [] // Deprecated
    },

    // =========================================================
    // ERP MODULE: INVENTORY (STOCK)
    // =========================================================

    // Get all inventory items with product details
    getInventoryItems: async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*, product:products(uuid, name, product_code, min_stock_level)')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error("Error getting inventory items:", error)
            return []
        }
    },

    // Add a new physical item (Check-in)
    addInventoryItem: async (itemData) => {
        try {
            // We are adding 'box_count' to the schema, so we can pass it through now.
            // If the column doesn't exist yet, this will fail until the SQL is run.
            // But the user asked to "make command for me", so I will provide the SQL.

            const { data, error } = await supabase
                .from('inventory_items')
                .insert([itemData])
                .select()
                .single()

            if (error) throw error

            // Log the creation
            await DataManager.logInventoryAction({
                inventory_item_id: data.id,
                action: 'check_in',
                new_location: itemData.current_location,
                reason: 'Initial Check-in',
                created_by: 'System' // Or pass user
            })

            // PRODUCT STOCK UPDATE
            // Legacy logic removed: 'stock' column dropped from products.
            // Stock is now calculated dynamically from inventory_items count or via triggers.
            // No need to manually update product table.

            return data
        } catch (error) {
            console.error("Error adding inventory item:", error)
            return null
        }
    },

    // Update item status/location
    updateInventoryItem: async (id, updates) => {
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
    },

    // Log movement/action
    logInventoryAction: async (logData) => {
        try {
            const { error } = await supabase
                .from('inventory_logs')
                .insert([logData])

            if (error) throw error
            return true
        } catch (error) {
            console.error("Error logging inventory action:", error)
            return false
        }
    },

    // =========================================================
    // ERP MODULE: PROCUREMENT (PURCHASING)
    // =========================================================

    // Get all Purchase Orders
    getPurchaseOrders: async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .order('created_at', { ascending: false })

            // Fallback for supplier name if using text column
            // (Adjust based on your actual schema choices in Step 1810 - we used supplier_name text)

            if (error) throw error
            return data || []
        } catch (error) {
            console.error("Error getting POs:", error)
            return []
        }
    },

    // Create a new PO with Items
    createPurchaseOrderWithItems: async (poData, items) => {
        try {
            // 1. Create PO Header
            const { data: po, error: poError } = await supabase
                .from('purchase_orders')
                .insert([poData])
                .select()
                .single()

            if (poError) throw poError

            // 2. Prepare Items with po_id
            const poItems = items.map(item => ({
                purchase_order_id: po.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price
            }))

            // 3. Insert Items
            const { error: itemsError } = await supabase
                .from('purchase_items')
                .insert(poItems)

            if (itemsError) {
                // Determine if we should delete the PO if items fail? 
                // For now, let's keep it simple and just throw. 
                // In a real app, we might want a transacton or cleanup.
                console.error("Error inserting PO items:", itemsError)
                // Optionally: await supabase.from('purchase_orders').delete().eq('id', po.id)
                throw itemsError
            }

            return po
        } catch (error) {
            console.error("Error creating PO with items:", error)
            return null
        }
    },

    // Delete PO
    deletePurchaseOrder: async (id) => {
        try {
            // Check if PO is received/completed? Maybe restrict?
            // For now, allow delete.
            const { error } = await supabase
                .from('purchase_orders')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error("Error deleting PO:", error)
            return false
        }
    },

    // Get PO by ID with Items
    getPurchaseOrderById: async (id) => {
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*, items:purchase_items(*, product:products(uuid, name, product_code))')
                .eq('id', id)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error("Error getting PO by ID:", error)
            return null
        }
    },

    // Update PO Costs
    updatePurchaseOrderCosts: async (id, costData) => {
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
            console.error("Error updating PO costs:", error)
            throw error
        }
    },

    getSettings: async () => {
        if (!supabase) return null
        try {
            const [settingsResult, optionsResult] = await Promise.all([
                DataManager._withRetry('getSettings', () =>
                    supabase.from('settings').select('*').eq('id', 'default').single()
                ),
                DataManager._withRetry('getSystemOptions', () =>
                    supabase.from('system_options_lists').select('*').eq('is_active', true).order('sort_order')
                )
            ])

            if (settingsResult.error) throw settingsResult.error

            const data = settingsResult.data
            const optionsData = optionsResult.data || []

            // Transform normalized list data back to object with arrays
            const systemOptions = {
                shopLat: data.shop_lat, // New column
                shopLon: data.shop_lon, // New column
            }

            // Group by category
            optionsData.forEach(item => {
                if (!systemOptions[item.category]) {
                    systemOptions[item.category] = []
                }
                systemOptions[item.category].push(item.value)
            })

            return {
                shopName: data.shop_name,
                shopAddress: data.shop_address,
                shopPhone: data.shop_phone,
                shopEmail: data.shop_email,
                shopTaxId: data.shop_tax_id,
                vatRegistered: data.vat_registered,
                vatRate: data.vat_rate,
                systemOptions: systemOptions, // Populated from table
                promptpayQr: data.promptpay_qr,
                // Quotation Settings
                quotationDefaultTerms: data.quotation_default_terms,
                quotationWarrantyPolicy: data.quotation_warranty_policy
            }
        } catch (error) {
            console.error('Error fetching settings (DataManager):', error)
            console.error('Error details:', error.message, error.details, error.hint)
            return null
        }
    },

    getOrderById: async (id) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                *,
                customer:customers(id, name, phone, email, line_id, facebook, instagram, addresses:customer_addresses(*), contacts:customer_contacts(*), taxInvoices:customer_tax_invoices(*)),
        items:order_items(*, jobs(*, siteAddressRecord:site_address_id(*), siteInspectorRecord:site_inspector_id(*)), product:products(name, description, product_code), variant:product_variants!product_variant_id(*)),
            paymentSchedule:order_payments(*)
    `)
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error fetching order:', error)
                throw error
            }

            // Debug: Log raw data to check if jobs are loaded
            console.log('[getOrderById] Raw data.items:', data.items?.map(item => ({
                id: item.id,
                name: item.name || item.product?.name,
                jobsCount: item.jobs?.length || 0,
                jobs: item.jobs
            })))

            // CRITICAL: Fetch jobs separately if not loaded via join
            // This is a workaround if Supabase join doesn't work due to FK relationship issues
            const { data: allJobs, error: jobsError } = await supabase
                .from('jobs')
                .select('id, order_item_id, order_id, job_type, status, assigned_team, appointment_date, completion_date, site_inspector_id, site_address_id, notes, team_payment_batch_id, created_at, updated_at, siteAddressRecord:site_address_id(*), siteInspectorRecord:site_inspector_id(*)')
                .eq('order_id', id)
                .order('created_at', { ascending: true })

            if (jobsError) {
                console.error('[getOrderById] Error fetching jobs separately:', jobsError)
            } else {
                console.log('[getOrderById] Fetched jobs separately:', allJobs?.length || 0, 'jobs')
                if (allJobs && allJobs.length > 0) {
                    console.log('[getOrderById] Jobs details:', allJobs.map(j => ({
                        id: j.id,
                        order_item_id: j.order_item_id,
                        order_item_id_type: typeof j.order_item_id,
                        order_item_id_full: String(j.order_item_id),
                        order_item_id_length: String(j.order_item_id).length,
                        order_id: j.order_id,
                        job_type: j.job_type,
                        // sequence_number: j.sequence_number
                    })))
                } else {
                    console.warn('[getOrderById] ⚠️ No jobs found for order:', id)
                }
            }

            // Map jobs to items by order_item_id
            // CRITICAL: Create a map of jobs by order_item_id for efficient lookup
            const jobsByItemId = {}

            // CRITICAL: Log if no jobs found
            if (!allJobs || allJobs.length === 0) {
                console.warn('[getOrderById] ⚠️ No jobs found for order:', id, '- This means jobs were not created or query failed')
            } else {
                console.log('[getOrderById] ✓ Found', allJobs.length, 'jobs for order:', id)
            }

            if (allJobs && allJobs.length > 0) {
                console.log('[getOrderById] Processing', allJobs.length, 'jobs for mapping')
                console.log('[getOrderById] All jobs from separate query:', allJobs.map(j => ({
                    id: j.id,
                    order_item_id: j.order_item_id,
                    order_item_id_type: typeof j.order_item_id,
                    job_type: j.job_type
                })))

                allJobs.forEach(job => {
                    if (job.order_item_id) {
                        // Normalize order_item_id to string for comparison
                        // UUIDs from Supabase might be returned as strings or UUID objects
                        // CRITICAL: Remove any whitespace and normalize to lowercase
                        const itemIdKey = String(job.order_item_id).toLowerCase().trim().replace(/\s+/g, '')
                        if (!jobsByItemId[itemIdKey]) {
                            jobsByItemId[itemIdKey] = []
                        }
                        jobsByItemId[itemIdKey].push(job)
                        console.log('[getOrderById] Added job to map:', {
                            jobId: job.id,
                            order_item_id: job.order_item_id,
                            order_item_id_type: typeof job.order_item_id,
                            order_item_id_string: String(job.order_item_id),
                            order_item_id_length: String(job.order_item_id).length,
                            itemIdKey: itemIdKey,
                            itemIdKey_length: itemIdKey.length,
                            mapKey: itemIdKey,
                            normalized: itemIdKey === String(job.order_item_id).toLowerCase().trim().replace(/\s+/g, '')
                        })
                    } else {
                        console.warn('[getOrderById] Job missing order_item_id:', job.id)
                    }
                })

                // Debug: Log all keys in map
                console.log('[getOrderById] All keys in jobsByItemId map:', Object.keys(jobsByItemId).map(k => ({
                    key: k,
                    key_length: k.length,
                    key_type: typeof k,
                    jobs_count: jobsByItemId[k].length,
                    first_job_order_item_id: jobsByItemId[k][0]?.order_item_id
                })))
                console.log('[getOrderById] Created jobsByItemId map:', Object.keys(jobsByItemId).map(itemId => ({
                    itemId,
                    itemId_type: typeof itemId,
                    jobsCount: jobsByItemId[itemId].length,
                    jobs: jobsByItemId[itemId].map(j => ({ id: j.id, job_type: j.job_type }))
                })))
            }

            if (data.items && allJobs) {
                console.log('[getOrderById] Items before mapping:', data.items.map(item => ({
                    id: item.id,
                    id_type: typeof item.id,
                    name: item.name || item.product?.name
                })))

                data.items = data.items.map(item => {
                    // Normalize item.id to string for comparison (UUIDs from Supabase)
                    // Use lowercase and trim to handle any formatting differences
                    // CRITICAL: Remove any whitespace and normalize to lowercase (same as job mapping)
                    const itemIdKey = String(item.id).toLowerCase().trim().replace(/\s+/g, '')
                    // Use jobs from the map we created (from separate query)
                    let itemJobs = jobsByItemId[itemIdKey] || []

                    console.log('[getOrderById] Mapping jobs for item - Normalized keys:', {
                        itemId: item.id,
                        itemIdKey: itemIdKey,
                        itemIdKey_length: itemIdKey.length,
                        jobsInMap: jobsByItemId[itemIdKey] ? jobsByItemId[itemIdKey].length : 0,
                        availableKeys: Object.keys(jobsByItemId),
                        directMatch: jobsByItemId[itemIdKey] !== undefined
                    })

                    console.log('[getOrderById] Mapping jobs for item:', {
                        itemId: item.id,
                        itemId_type: typeof item.id,
                        itemIdKey: itemIdKey,
                        itemIdKey_type: typeof itemIdKey,
                        jobsInMap: jobsByItemId[itemIdKey] ? jobsByItemId[itemIdKey].length : 0,
                        itemJobsLength: itemJobs.length,
                        availableKeys: Object.keys(jobsByItemId),
                        jobsByItemIdKeys: Object.keys(jobsByItemId).map(k => ({
                            key: k,
                            key_type: typeof k,
                            jobs: jobsByItemId[k].length,
                            matches: k === itemIdKey || k.toLowerCase() === itemIdKey.toLowerCase()
                        }))
                    })

                    // If no jobs found, try multiple matching strategies
                    if (itemJobs.length === 0 && Object.keys(jobsByItemId).length > 0) {
                        console.warn('[getOrderById] ⚠️ No jobs found for item', item.id, 'Available itemIds:', Object.keys(jobsByItemId))

                        // Strategy 1: Exact match (case-insensitive)
                        let matchingKey = Object.keys(jobsByItemId).find(k => {
                            const kLower = String(k).toLowerCase().trim()
                            const itemLower = itemIdKey.toLowerCase().trim()
                            return kLower === itemLower
                        })

                        // Strategy 2: Partial match (last 12 characters)
                        if (!matchingKey && item.id) {
                            const itemIdSuffix = String(item.id).slice(-12).toLowerCase()
                            matchingKey = Object.keys(jobsByItemId).find(k => {
                                const kSuffix = String(k).slice(-12).toLowerCase()
                                return kSuffix === itemIdSuffix
                            })
                        }

                        // Strategy 3: Direct UUID comparison
                        if (!matchingKey) {
                            matchingKey = Object.keys(jobsByItemId).find(k => {
                                return String(k) === String(item.id) || k === item.id
                            })
                        }

                        if (matchingKey) {
                            console.log('[getOrderById] ✓ Found matching key:', matchingKey, 'with', jobsByItemId[matchingKey].length, 'jobs')
                            itemJobs = jobsByItemId[matchingKey]
                        } else {
                            console.error('[getOrderById] ✗ No matching key found! Item ID:', item.id, 'Item ID Key:', itemIdKey, 'Available keys:', Object.keys(jobsByItemId))
                            // Debug: Show all job order_item_ids for comparison
                            if (allJobs && allJobs.length > 0) {
                                console.log('[getOrderById] All job order_item_ids:', allJobs.map(j => ({
                                    jobId: j.id,
                                    order_item_id: j.order_item_id,
                                    order_item_id_string: String(j.order_item_id),
                                    order_item_id_length: String(j.order_item_id).length,
                                    order_item_id_suffix: String(j.order_item_id).slice(-12),
                                    item_id_suffix: String(item.id).slice(-12),
                                    matches_item: String(j.order_item_id).toLowerCase() === itemIdKey,
                                    matches_suffix: String(j.order_item_id).slice(-12).toLowerCase() === String(item.id).slice(-12).toLowerCase()
                                })))

                                // Try to find by suffix match
                                const itemIdSuffix = String(item.id).slice(-12).toLowerCase()
                                const matchingJob = allJobs.find(j => {
                                    const jobSuffix = String(j.order_item_id).slice(-12).toLowerCase()
                                    return jobSuffix === itemIdSuffix
                                })

                                if (matchingJob) {
                                    console.log('[getOrderById] ✓ Found job by suffix match:', matchingJob.id, 'for item:', item.id)
                                    itemJobs = [matchingJob]
                                }
                            }
                        }
                    }

                    return {
                        ...item,
                        jobs: itemJobs  // Always use jobs from separate query, not from join
                    }
                })
                console.log('[getOrderById] Mapped jobs to items:', data.items.map(item => ({
                    id: item.id,
                    jobsCount: item.jobs?.length || 0,
                    jobs: item.jobs?.map(j => ({ id: j.id, job_type: j.job_type, order_item_id: j.order_item_id }))
                })))

                // CRITICAL: Verify jobs are preserved after mapping
                data.items.forEach(item => {
                    if (item.jobs && item.jobs.length > 0) {
                        console.log('[getOrderById] ✓ Item', item.id, 'has', item.jobs.length, 'jobs after mapping')
                    } else {
                        console.warn('[getOrderById] ✗ Item', item.id, 'has NO jobs after mapping!')
                    }
                })
            } else {
                console.warn('[getOrderById] No items or allJobs to map')
            }

            // Fetch payments separately (workaround for missing FK relationship)
            const { data: payments } = await supabase
                .from('order_payments')
                .select('*')
                .eq('order_id', id)
                .order('payment_date', { ascending: true })

            // Resolve Relations from Customer Data (Lookup by ID)
            const resolvedTaxInvoice = data.tax_invoice_id
                ? data.customer?.taxInvoices?.find(t => t.id === data.tax_invoice_id)
                : null

            const resolvedPurchaser = data.purchaser_contact_id
                ? data.customer?.contacts?.find(c => c.id === data.purchaser_contact_id)
                : null

            const resolvedReceiver = data.receiver_contact_id
                ? data.customer?.contacts?.find(c => c.id === data.receiver_contact_id)
                : null

            const resolvedDeliveryAddress = data.items?.[0]?.siteAddressRecord || null // Fallback to first item's site address

            // Helper to get fallback address
            const defaultAddress = data.customer?.addresses?.[0] || null
            const finalDeliveryAddress = resolvedDeliveryAddress || data.deliveryAddress || defaultAddress

            // Helper for Tax Invoice Fallback
            const finalTaxInvoice = resolvedTaxInvoice ? {
                id: resolvedTaxInvoice.id,
                companyName: resolvedTaxInvoice.company_name,
                taxId: resolvedTaxInvoice.tax_id,
                branch: resolvedTaxInvoice.branch_number,
                branchName: resolvedTaxInvoice.branch_name,
                address: resolvedTaxInvoice.address,
                // Include granular address fields for proper formatting
                house_number: resolvedTaxInvoice.house_number,
                village_no: resolvedTaxInvoice.village_no,
                building: resolvedTaxInvoice.building,
                soi: resolvedTaxInvoice.soi,
                road: resolvedTaxInvoice.road,
                sub_district: resolvedTaxInvoice.sub_district,
                district: resolvedTaxInvoice.district,
                province: resolvedTaxInvoice.province,
                postal_code: resolvedTaxInvoice.postal_code,
                // Map to camelCase for UI compatibility
                addrNumber: resolvedTaxInvoice.house_number,
                addrMoo: resolvedTaxInvoice.village_no,
                addrVillage: resolvedTaxInvoice.building,
                addrSoi: resolvedTaxInvoice.soi,
                addrRoad: resolvedTaxInvoice.road,
                addrTambon: resolvedTaxInvoice.sub_district,
                addrAmphoe: resolvedTaxInvoice.district,
                addrProvince: resolvedTaxInvoice.province,
                addrZipcode: resolvedTaxInvoice.postal_code
            } : null // Removed tax_invoice_info fallback


            // Helper for Purchaser Fallback
            const finalPurchaser = resolvedPurchaser ? {
                id: resolvedPurchaser.id,
                name: resolvedPurchaser.name,
                phone: resolvedPurchaser.phone,
                lineId: resolvedPurchaser.line_id,
                email: resolvedPurchaser.email,
                position: resolvedPurchaser.position,
                note: resolvedPurchaser.note
            } : null // Removed selected_contact_info fallback


            // Helper for Receiver Fallback
            const finalReceiver = resolvedReceiver ? {
                id: resolvedReceiver.id,
                name: resolvedReceiver.name,
                phone: resolvedReceiver.phone,
                lineId: resolvedReceiver.line_id,
                email: resolvedReceiver.email,
                position: resolvedReceiver.position,
                note: resolvedReceiver.note
            } : null // Removed receiver_contact_info fallback


            // Map standard fields with nested relation mapping
            const customerObj = {
                id: data.customer?.id || data.customer_id,
                name: data.customer?.name || data.customer_name || 'Unknown',
                phone: data.customer?.phone || '',
                email: data.customer?.email || '',
                line: data.customer?.line_id || '',
                facebook: data.customer?.facebook || '',
                instagram: data.customer?.instagram || '',
                address: finalDeliveryAddress?.address || '',
                // Include full relations mapped to camelCase
                contacts: (data.customer?.contacts || []).map(contact => ({
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone,
                    lineId: contact.line_id,
                    email: contact.email,
                    position: contact.position,
                    note: contact.note
                })),
                addresses: (data.customer?.addresses || []).map(addr => ({
                    id: addr.id,
                    label: addr.label,
                    addrNumber: addr.addr_number,
                    addrMoo: addr.addr_moo,
                    addrVillage: addr.addr_village,
                    addrSoi: addr.addr_soi,
                    addrRoad: addr.addr_road,
                    addrTambon: addr.addr_tambon,
                    addrAmphoe: addr.addr_amphoe,
                    addrProvince: addr.addr_province,
                    province: addr.addr_province,
                    zipcode: addr.zipcode,
                    googleMapsLink: addr.google_maps_link,
                    address: addr.address
                })),
                taxInvoices: (data.customer?.taxInvoices || []).map(tax => ({
                    id: tax.id,
                    companyName: tax.company_name,
                    taxId: tax.tax_id,
                    address: tax.address,
                    branch: tax.branch_number,
                    branchNumber: tax.branch_number,
                    branchName: tax.branch_name,
                    addrNumber: tax.house_number,
                    addrMoo: tax.village_no,
                    addrVillage: tax.building,
                    addrSoi: tax.soi,
                    addrRoad: tax.road,
                    addrTambon: tax.sub_district,
                    addrAmphoe: tax.district,
                    addrProvince: tax.province,
                    addrZipcode: tax.postal_code
                }))
            }

            const order = {
                id: data.id,
                orderId: data.id,
                quotationNumber: data.quotation_number,
                customer: data.customer ? {
                    id: data.customer.id,
                    name: data.customer.name,
                    phone: data.customer.phone,
                    email: data.customer.email,
                    lineId: data.customer.line_id,
                    //...
                    addresses: data.customer.addresses,
                    contacts: data.customer.contacts,
                    taxInvoices: data.customer.taxInvoices
                } : null, // Removed customerDetails fallback

                // Contacts
                taxInvoice: finalTaxInvoice,
                purchaser: finalPurchaser,
                receiver: finalReceiver,

                // Delivery
                deliveryDate: data.delivery_date,
                deliveryAddress: finalDeliveryAddress,

                issueDate: data.issue_date,
                notes: data.notes,

                // Job Info (Derived from First Item's main job)
                // We construct a "Main Job Info" for backward compatibility in UI
                jobInfo: (() => {
                    const firstItem = data.items?.[0];
                    // IMPORTANT: Do NOT mutate firstItem.jobs.
                    // `.pop()` mutates the array and was wiping jobs from data.items[0].jobs,
                    // causing "jobs not showing" downstream.
                    const firstItemJobs = Array.isArray(firstItem?.jobs) ? firstItem.jobs : [];
                    const sortedJobs = firstItemJobs.slice().sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
                    const mainJob = sortedJobs[sortedJobs.length - 1] || {};
                    const toLocalISO = (d) => d ? new Date(new Date(d).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : null;

                    // Inspector Resolution
                    let insp = mainJob.siteInspectorRecord ? {
                        id: mainJob.siteInspectorRecord.id,
                        name: mainJob.siteInspectorRecord.name,
                        phone: mainJob.siteInspectorRecord.phone,
                        email: mainJob.siteInspectorRecord.email
                    } : null;

                    if (!insp && mainJob.site_inspector_id && data.customer?.contacts) {
                        insp = data.customer.contacts.find(c => c.id === mainJob.site_inspector_id)
                    }

                    // Address Resolution
                    let addr = mainJob.siteAddressRecord ? {
                        label: mainJob.siteAddressRecord.label,
                        address: mainJob.siteAddressRecord.address,
                        googleMapLink: mainJob.siteAddressRecord.google_maps_link,
                        distance: mainJob.siteAddressRecord.distance
                    } : null;

                    if (!addr && mainJob.site_address_id && data.customer?.addresses) {
                        const found = data.customer.addresses.find(a => a.id === mainJob.site_address_id)
                        if (found) addr = { ...found, googleMapLink: found.googleMapsLink || found.googleMapLink }
                    }

                    return {
                        id: mainJob.id,
                        jobType: mainJob.job_type || 'installation',
                        team: mainJob.assigned_team || '',
                        appointmentDate: toLocalISO(mainJob.appointment_date),
                        completionDate: toLocalISO(mainJob.completion_date),
                        description: mainJob.notes || '',

                        installLocationName: addr?.label || finalDeliveryAddress?.label || '',
                        installAddress: addr?.address || finalDeliveryAddress?.address || '',
                        googleMapLink: addr?.googleMapLink || finalDeliveryAddress?.googleMapsLink || finalDeliveryAddress?.googleMapLink || '',
                        distance: addr?.distance || finalDeliveryAddress?.distance || '',

                        inspector1: insp || finalReceiver || null,
                    }
                })(),

                // Mapped Items from Joined Table
                // Items Mapping
                // CRITICAL: Verify data.items still has jobs before final mapping
                items: (() => {
                    if (data.items) {
                        console.log('[getOrderById] Before final items mapping - data.items:', data.items.map(item => ({
                            id: item.id,
                            jobsCount: (item.jobs && item.jobs.length) || 0,
                            hasJobs: !!(item.jobs && item.jobs.length > 0),
                            jobs: item.jobs ? item.jobs.map(j => ({ id: j.id, job_type: j.job_type, order_item_id: j.order_item_id })) : []
                        })))

                        // Debug: Check if jobs are actually in the items
                        data.items.forEach(item => {
                            if (item.jobs && item.jobs.length > 0) {
                                console.log('[getOrderById] ✓ Item', item.id, 'has', item.jobs.length, 'jobs in data.items:', item.jobs.map(j => j.id))
                            } else {
                                console.warn('[getOrderById] ✗ Item', item.id, 'has NO jobs in data.items!')
                            }
                        })
                    }

                    return (data.items || []).map(item => {
                        // Sort Jobs (Recent First)
                        // Helper for Timezone
                        const toLocalISOString = (d) => d ? new Date(new Date(d).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : null;

                        // CRITICAL: Preserve jobs FIRST before any operations
                        // item.jobs should already contain jobs from the separate query mapping (line 3006-3103)
                        // IMPORTANT: Store jobs in a variable BEFORE any spread operations
                        const originalJobs = item.jobs || []
                        const itemJobs = Array.isArray(originalJobs) ? originalJobs : []
                        console.log('[getOrderById] Processing item', item.id, 'with', itemJobs.length, 'jobs', {
                            itemJobsLength: itemJobs.length,
                            itemJobsType: typeof itemJobs,
                            itemJobsIsArray: Array.isArray(itemJobs),
                            itemJobsContent: itemJobs.length > 0 ? itemJobs.map(j => ({ id: j.id, job_type: j.job_type || j.jobType })) : [],
                            itemJobsRaw: itemJobs,
                            itemJobsKeys: itemJobs.length > 0 ? Object.keys(itemJobs[0]) : [],
                            itemJobsValue: item.jobs,
                            itemJobsValueType: typeof item.jobs,
                            itemJobsValueIsArray: Array.isArray(item.jobs),
                            itemKeys: Object.keys(item),
                            hasJobsKey: 'jobs' in item
                        })

                        if (itemJobs.length === 0) {
                            console.warn('[getOrderById] ⚠️ Item', item.id, 'has NO jobs! item.jobs:', item.jobs, 'item keys:', Object.keys(item))
                            // Try to find jobs in the original data.items that was mapped earlier
                            const originalItem = data.items?.find(i => i.id === item.id)
                            if (originalItem && originalItem.jobs && originalItem.jobs.length > 0) {
                                console.log('[getOrderById] ✓ Found jobs in original item:', originalItem.jobs.length, 'jobs')
                                // Use jobs from original item - update itemJobs instead of returning early
                                // This ensures all properties are properly mapped below
                                itemJobs.push(...originalItem.jobs)
                                // Also update originalJobs for preservation
                                originalJobs.push(...originalItem.jobs)
                            }
                        }

                        // Sort Jobs (Chronological/Sequential Order)
                        const mappedJobs = itemJobs.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)).map(j => {
                            // Resolve Relations with Fallback (in case join returns null)
                            const resolvedInspector = j.siteInspectorRecord || (j.site_inspector_id ? (data.customer?.contacts || []).find(c => c.id === j.site_inspector_id) : null);
                            const resolvedAddress = j.siteAddressRecord || (j.site_address_id ? (data.customer?.addresses || []).find(a => a.id === j.site_address_id) : null);

                            return {
                                ...j,
                                jobId: j.id,
                                jobType: j.job_type,
                                status: j.status,
                                appointmentDate: toLocalISOString(j.appointment_date),
                                completionDate: toLocalISOString(j.completion_date),
                                team: j.assigned_team,
                                description: j.notes,
                                installLocationId: j.site_address_id,
                                installLocationName: resolvedAddress?.label,
                                installAddress: resolvedAddress?.address,
                                googleMapLink: resolvedAddress?.google_maps_link,
                                distance: resolvedAddress?.distance,
                                inspector1: resolvedInspector ? {
                                    id: resolvedInspector.id,
                                    name: resolvedInspector.name,
                                    phone: resolvedInspector.phone,
                                    lineId: resolvedInspector.line_id,
                                    email: resolvedInspector.email,
                                    position: resolvedInspector.position,
                                    note: resolvedInspector.note
                                } : null
                            }
                        })
                        console.log('[DEBUG] mappedJobs for item', item.id, ':', mappedJobs.length, 'jobs', mappedJobs.map(j => ({ id: j.id, jobType: j.jobType, team: j.team })))
                        const latestJob = mappedJobs[mappedJobs.length - 1] || {};

                        // CRITICAL: Preserve jobs BEFORE any spread operations
                        // item.jobs should already contain jobs from the separate query mapping (line 3006-3103)
                        // CRITICAL: Use originalJobs (preserved at the start) if mappedJobs is empty
                        const preservedJobs = mappedJobs.length > 0 ? mappedJobs : (itemJobs.length > 0 ? itemJobs : originalJobs)

                        console.log('[getOrderById] Preserving jobs for item', item.id, ':', {
                            originalJobsLength: originalJobs.length,
                            itemJobsLength: itemJobs.length,
                            mappedJobsLength: mappedJobs.length,
                            preservedJobsLength: preservedJobs.length,
                            preservedJobs: preservedJobs.map(j => ({ id: j.id, jobType: j.jobType || j.job_type }))
                        })

                        // CRITICAL: Create a new object without jobs property first, then add jobs at the end
                        // This prevents jobs from being overridden by spread operator
                        // But we need to preserve originalJobs that was stored at the start
                        const { jobs: _, ...itemWithoutJobs } = item

                        return {
                            ...itemWithoutJobs,
                            id: item.id, // OrderItem ID
                            code: item.variant?.sku || item.product?.product_code, // FIXED: Prioritize SKU from joined variant, then Product Code
                            product_variant_id: item.product_variant_id,
                            product_id: item.product_id || item.product?.id,
                            name: item.product?.name || 'Unknown Product',
                            image: item.variant?.image_url || item.image || null, // NEW: Use Variant Image
                            price: Number(item.unit_price || 0),
                            // Map back to UI properties
                            qty: item.quantity,
                            quantity: item.quantity,
                            unitPrice: item.unit_price,
                            // Use item.total_price if available, else calc
                            total: item.total_price || (item.quantity * item.unit_price),

                            // Restore JSONB data
                            // Runtime derivation for selection UI
                            selectedVariantIndex: (item.product?.variants || []).findIndex(v => v.id === item.product_variant_id),
                            selectedVariant: (item.product?.variants || []).find(v => v.id === item.product_variant_id) || item.variation_data?.selectedVariant,

                            // Prioritize Master Product Name & Image (Single Source of Truth)
                            name: item.product?.name || item.name || item.variation_data?.name || 'สินค้าไม่ระบุ',
                            image: item.product?.image_url || item.image || item.variation_data?.image || null,

                            // RELATIONAL RE-HYDRATION (Phase 4)
                            code: item.variation_data?.code || item.product?.product_code || item.variant?.sku || '',

                            color: item.variation_data?.color || item.variant?.color || item.variation_data?.selectedVariant?.color || item.product?.color,
                            dimensions: item.variation_data?.dimensions || item.variant?.size || item.variation_data?.selectedVariant?.dimensions || item.product?.dimensions,
                            crystalColor: item.variation_data?.crystalColor || item.variant?.crystal_color || item.variation_data?.selectedVariant?.crystal_color || item.product?.crystal_color,
                            bulbType: item.variation_data?.bulbType || item.variant?.bulb_type || item.variation_data?.selectedVariant?.bulb_type || item.product?.bulb_type,

                            // Phase 13: Relational Metadata - CRITICAL: Set jobs AFTER all other properties
                            // CRITICAL: Always use mappedJobs if it has data, otherwise use preservedJobs
                            // mappedJobs comes from itemJobs which comes from item.jobs
                            jobs: mappedJobs.length > 0 ? mappedJobs : (preservedJobs.length > 0 ? preservedJobs : []),
                            latestJob: latestJob,

                            jobId: latestJob.jobId,
                            jobType: latestJob.jobType,
                            appointmentDate: latestJob.appointmentDate,
                            completionDate: latestJob.completionDate,
                            team: latestJob.team,
                            jobNotes: latestJob.description,

                            remark: item.remark || item.variation_data?.remark,
                            variationNotes: item.variation_notes || item.variation_data?.description,

                            // Location from Job
                            googleMapLink: latestJob.googleMapLink || item.google_map_link || item.sub_job_data?.googleMapLink,
                            distance: latestJob.distance || item.distance || item.sub_job_data?.distance,

                            light: item.light || item.variation_data?.light,
                            lightColor: item.light_color || item.variation_data?.lightColor,
                            remote: item.remote || item.variation_data?.remote

                            // No subJob needed - jobs array is the source of truth
                        }
                    })
                })(), // Close IIFE for items mapping

                // Mapped Relations with Fallbacks
                deliveryAddress: finalDeliveryAddress,
                taxInvoiceDeliveryAddress: finalDeliveryAddress, // Explicit alias for UI
                taxInvoice: finalTaxInvoice,

                // Contacts
                purchaserContact: finalPurchaser,
                receiverContact: finalReceiver,

                // Legacy Aliases
                activeCustomerContact: finalPurchaser,
                selectedContact: finalReceiver,

                // Map Payments
                paymentSchedule: (payments || []).map(p => ({
                    id: p.id,
                    amount: p.amount,
                    date: p.payment_date,
                    method: p.payment_method,
                    paymentMethod: p.payment_method,
                    type: p.payment_type || 'deposit',
                    // Keep both `proofUrl` and `slip` for UI compatibility
                    proofUrl: p.proof_url,
                    slip: p.proof_url,
                    // Signatures for PaymentEntryModal (can be base64 or public URL)
                    receiverSignature: p.receiver_signature || null,
                    payerSignature: p.payer_signature || null,
                    status: p.status,
                    status: p.status,
                    is_deposit: p.is_deposit,
                    // Fix: Map new document fields
                    invoiceNo: p.invoice_no,
                    invoiceDate: p.invoice_date,
                    receiptNo: p.receipt_no,
                    receiptDate: p.receipt_date
                })).sort((a, b) => new Date(a.date) - new Date(b.date)),

                // Financials (Fix: Ensure shipping and discount are returned)
                shippingFee: Number(data.shipping_fee || 0),
                discount: {
                    mode: data.discount_mode || 'percent',
                    value: Number(data.discount_value || 0)
                }
            }

            return order
        } catch (error) {
            console.error('Error in getOrderById:', error)
            return null
        }
    },

    saveSettings: async (settings) => {
        if (!supabase) return false
        try {
            // 1. Update basic settings + Lat/Lon
            const { error } = await supabase
                .from('settings')
                .upsert({
                    id: 'default',
                    shop_name: settings.shopName,
                    shop_address: settings.shopAddress,
                    shop_phone: settings.shopPhone,
                    shop_email: settings.shopEmail,
                    shop_tax_id: settings.shopTaxId,
                    vat_registered: settings.vatRegistered,
                    vat_rate: settings.vatRate,
                    promptpay_qr: settings.promptpayQr,
                    // system_options JSON is deprecated but we keep it sync for safety? 
                    // No, let's stop writing to it to enforce new schema usage.
                    // system_options: settings.systemOptions, 
                    shop_lat: settings.systemOptions?.shopLat ? parseFloat(settings.systemOptions.shopLat) : null,
                    shop_lon: settings.systemOptions?.shopLon ? parseFloat(settings.systemOptions.shopLon) : null,
                    // Quotation Settings
                    quotation_default_terms: settings.quotationDefaultTerms,
                    quotation_warranty_policy: settings.quotationWarrantyPolicy,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

            // 2. Update System Options Lists
            if (settings.systemOptions) {
                const listKeys = Object.keys(settings.systemOptions).filter(k => Array.isArray(settings.systemOptions[k]))

                for (const key of listKeys) {
                    const values = settings.systemOptions[key]

                    // Delete existing for this category
                    await supabase.from('system_options_lists').delete().eq('category', key)

                    if (values.length > 0) {
                        const insertPayload = values.map((val, idx) => ({
                            category: key,
                            value: val,
                            label: val,
                            sort_order: idx,
                            is_active: true
                        }))

                        const { error: listError } = await supabase.from('system_options_lists').insert(insertPayload)
                        if (listError) console.error(`Error saving option list ${key}:`, listError)
                    }
                }
            }

            return true
        } catch (error) {
            console.error('Error saving settings:', error)
            return false
        }
    },

    getProductOptions: async () => {
        if (!supabase) return null
        try {
            const { data, error } = await DataManager._withRetry('getSystemOptions', () =>
                supabase.from('system_options_lists').select('*').eq('is_active', true).order('sort_order')
            )

            if (error) throw error

            const systemOptions = {}
            if (data) {
                data.forEach(item => {
                    if (!systemOptions[item.category]) {
                        systemOptions[item.category] = []
                    }
                    systemOptions[item.category].push(item.value)
                })
            }
            return systemOptions
        } catch (error) {
            console.error('Error fetching product options:', error)
            return null
        }
    },

    saveProductOptions: async (options) => {
        if (!supabase) return false
        try {
            // Options contains arrays { productTypes: [...], ... }
            const listKeys = Object.keys(options)

            for (const key of listKeys) {
                const values = options[key]
                if (!Array.isArray(values)) continue

                // Delete existing for this category
                await supabase.from('system_options_lists').delete().eq('category', key)

                if (values.length > 0) {
                    const insertPayload = values.map((val, idx) => ({
                        category: key,
                        value: val,
                        label: val,
                        sort_order: idx,
                        is_active: true
                    }))

                    const { error: listError } = await supabase.from('system_options_lists').insert(insertPayload)
                    if (listError) console.error(`Error saving option list ${key}:`, listError)
                }
            }

            return true
        } catch (error) {
            console.error('Error saving product options:', error)
            return false
        }
    },

    // Get available teams filtered by team_type (ช่าง or QC only)
    getAvailableTeams: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('name, team_type')
                .in('team_type', ['ช่าง', 'QC', 'Mechanic']) // Support both Thai and potential English keys
                .eq('status', 'active')
                .order('name')

            if (error) throw error

            return data.map(t => t.name)
        } catch (error) {
            console.error('Error fetching available teams:', error)
            return []
        }
    },

    // Mark item as lost
    markItemLost: async (itemId, reason = 'Lost/Missing') => {
        try {
            // 1. Get current item to know product_id
            const { data: item, error: fetchError } = await supabase
                .from('inventory_items')
                .select('product_id, status, current_location')
                .eq('id', itemId)
                .single()

            if (fetchError || !item) throw fetchError || new Error('Item not found')

            if (item.status === 'lost') return true // Already lost

            // 2. Update status to 'lost'
            const { error: updateError } = await supabase
                .from('inventory_items')
                .update({ status: 'lost' })
                .eq('id', itemId)

            if (updateError) throw updateError

            // 3. Decrement Product Stock (only if it was in_stock before)
            if (item.status === 'in_stock' && item.product_id) {
                const { data: product } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('uuid', item.product_id)
                    .single()

                if (product) {
                    const newStock = Math.max(0, (product.stock || 0) - 1)
                    await supabase
                        .from('products')
                        .update({ stock: newStock })
                        .eq('uuid', item.product_id)
                }
            }

            // 4. Log it
            await DataManager.logInventoryAction({
                inventory_item_id: itemId,
                action: 'mark_lost',
                new_location: 'Unknown',
                reason: reason,
                created_by: 'System'
            })

            return true
        } catch (error) {
            console.error('Error marking item lost:', error)
            return false
        }
    },

    // --- Leave Requests ---

    createLeaveRequest: async (leaveData) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .insert([leaveData])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error creating leave request:', error)
            throw error
        }
    },

    getLeaveRequests: async (teamFilter = null, startDate = null, endDate = null) => {
        if (!supabase) return []
        try {
            let query = supabase
                .from('leave_requests')
                .select('*')
                .order('start_date', { ascending: true })

            if (teamFilter && teamFilter !== 'ทั้งหมด') {
                query = query.eq('user_team', teamFilter)
            }

            // Optional date range filter
            if (startDate) {
                query = query.gte('end_date', startDate)
            }
            if (endDate) {
                query = query.lte('start_date', endDate)
            }

            const { data, error } = await query
            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error fetching leave requests:', error)
            return []
        }
    },

    updateLeaveRequest: async (id, updates) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('leave_requests')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating leave request:', error)
            throw error
        }
    },

    approveLeaveRequest: async (leaveId) => {
        if (!supabase) return false
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({
                    status: 'approved',
                    updated_at: new Date().toISOString()
                })
                .eq('id', leaveId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error approving leave request:', error)
            throw error
        }
    },

    rejectLeaveRequest: async (leaveId, reason = '') => {
        if (!supabase) return false
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({
                    status: 'rejected',
                    rejection_reason: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', leaveId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error rejecting leave request:', error)
            throw error
        }
    },

    deleteLeaveRequest: async (id) => {
        if (!supabase) return false
        try {
            const { error } = await supabase
                .from('leave_requests')
                .delete()
                .eq('id', id)

            if (error) throw error
            return !error
        } catch (error) {
            console.error('Error deleting leave request:', error)
            return false
        }
    },

    // Delete Team Service Fee
    deleteTeamServiceFee: async (id) => {
        try {
            const { error } = await supabase
                .from('team_service_fees')
                .delete()
                .eq('id', id)

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error("Error deleting team service fee:", error)
            return { success: false, error }
        }
    },

    // Update Team Service Fee Payment
    updateServiceFeePayment: async (id, data) => {
        try {
            const { error } = await supabase
                .from('team_service_fee_payments')
                .update(data)
                .eq('id', id)

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error("Error updating team service fee payment:", error)
            return { success: false, error }
        }
    },

    // Delete Team Service Fee Payment
    deleteServiceFeePayment: async (id) => {
        try {
            const { error } = await supabase
                .from('team_service_fee_payments')
                .delete()
                .eq('id', id)

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error("Error deleting team service fee payment:", error)
            return { success: false, error }
        }
    },



    // --- Quotation System ---
    getQuotation: async (orderId) => {
        try {
            const { data, error } = await supabase
                .from('quotations')
                .select('*')
                .eq('order_id', orderId)
                .single()

            if (error && error.code !== 'PGRST116') throw error // Ignore not found
            return data
        } catch (error) {
            console.error("Error fetching quotation:", error)
            return null
        }
    },

    saveQuotation: async (data) => {
        try {
            const { error } = await supabase
                .from('quotations')
                .upsert({
                    ...data,
                    updated_at: new Date()
                }, { onConflict: 'order_id' })

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error("Error saving quotation:", error)
            return { success: false, error }
        }
    }
}
