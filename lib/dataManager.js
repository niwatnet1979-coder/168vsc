import { supabase } from './supabaseClient'

/**
 * DataManager - Promisified Data Access Layer for 168VSC
 * Fetches data from Supabase and maps snake_case DB columns to camelCase app properties.
 */
// Helper to calculate Order Status from Items
const calculateOrderStatus = (items = []) => {
    if (!items || items.length === 0) return 'Pending'

    const statuses = items.map(i => (i.status || 'Pending').toLowerCase())

    if (statuses.every(s => s === 'cancelled')) return 'Cancelled'
    if (statuses.every(s => s === 'completed' || s === 'cancelled')) return 'Completed'
    if (statuses.some(s => s === 'processing' || s === 'completed')) return 'Processing'

    return 'Pending'
}

export const DataManager = {
    // Export supabase for Realtime subscriptions
    supabase,

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
                .select('uuid, name, product_code, category, variants')

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
                contacts: (data.contacts || []).map(contact => ({
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone,
                    lineId: contact.line_id,
                    email: contact.email,
                    position: contact.position,
                    note: contact.note
                })),
                addresses: (data.addresses || []).map(addr => ({
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
                taxInvoices: (data.taxInvoices || []).map(tax => ({
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
                        stock,
                        min_stock_level,
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
    getEmployees: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
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
                    team: e.team,
                    teamType: e.team_type,
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


    // --- Transaction Data Access (with Joins) ---

    getOrders: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:customers!customer_id(id, name, phone, email),
                    deliveryAddress:customer_addresses!delivery_address_id(*),
                    purchaserContact:customer_contacts!selected_contact_id(*),
                receiverContact:customer_contacts!receiver_contact_id(*),
                taxInvoice:customer_tax_invoices!tax_invoice_id(*),
                items:order_items(*, product:products(name), variant:product_variants!product_variant_id(*), siteAddressRecord:customer_addresses!site_address_id(*), siteInspectorRecord:customer_contacts!site_inspector_id(*))
            `)
                .order('created_at', { ascending: false })

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
                // Job info
                jobType: o.job_type || o.job_info?.job_type || '-',
                team: o.assigned_team || o.job_info?.team || o.job_info?.subJobTeam || '-',
                appointmentDate: o.appointment_date || o.job_info?.appointmentDate || o.job_info?.appointment_date,
                completionDate: o.completion_date || o.job_info?.completionDate || o.job_info?.completion_date,
                notes: o.notes || o.job_info?.description || o.note || '',
                // Financial info
                totalAmount: o.total || 0, // Use total from database
                discount: { mode: o.discount_mode || 'percent', value: o.discount_value || 0 },
                deposit: o.payment_schedule?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
                items: (o.items || []).map(i => ({
                    id: i.id || i.code,
                    name: i.product?.name || 'Unknown Product', // Prioritize Master Product Name (Live Only)
                    image: i.variant?.image_url || i.image || null,
                    qty: Number(i.quantity || i.qty || 1), // Prioritize quantity column
                    quantity: Number(i.quantity || i.qty || 1),
                    price: Number(i.unit_price || i.unitPrice || i.price || 0),
                    unitPrice: Number(i.unit_price || i.unitPrice || i.price || 0),
                    total: Number(i.total_price || i.total || ((Number(i.unit_price || i.unitPrice || i.price || 0)) * (Number(i.quantity || i.qty || 1))) || 0),

                    // Relational Metadata (Phase 13)
                    job_id: i.job_id || i.sub_job_data?.jobId,
                    jobType: i.job_type || i.sub_job_data?.jobType,
                    appointmentDate: i.appointment_date || i.sub_job_data?.appointmentDate,
                    completionDate: i.completion_date || i.sub_job_data?.completionDate,
                    team: i.assigned_team || i.sub_job_data?.team,
                    jobNotes: i.job_notes || i.sub_job_data?.description,
                    remark: i.remark || i.variation_data?.remark,
                    description: i.variation_notes || i.variation_data?.description,
                    googleMapLink: (i.siteAddressRecord?.google_maps_link) || i.google_map_link || i.sub_job_data?.googleMapLink,
                    // distance: REMOVED (Use site_address_id),
                    light: i.light || i.variation_data?.light,
                    lightColor: i.light_color || i.variation_data?.lightColor,
                    remote: i.remote || i.variation_data?.remote
                }))
            }))
        } catch (error) {
            console.error('Error fetching orders:', error)
            return []
        }
    },

    getOrdersByCustomerId: async (customerId) => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, items:order_items(status)')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })

            if (error) throw error

            return data.map(o => ({
                id: o.id,
                customerId: o.customer_id,
                date: o.created_at,
                totalAmount: o.total_amount || o.total || 0,
                status: calculateOrderStatus(o.items), // Runtime Derivation (Phase 11)
                paymentSchedule: o.payment_schedule || []
            }))
        } catch (error) {
            console.error('Error fetching orders by customer ID:', error)
            return []
        }
    },

    getJobs: async () => {
        try {
            // Refactored: Fetch "Virtual Jobs" from Orders table instead of legacy Jobs table
            // This aligns with the new OrderForm architecture where jobs are embedded in order items
            // FIX: Join with products table to get product image and name details
            // Build query based on status filter
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:customers(*),
                    deliveryAddress:customer_addresses!orders_delivery_address_id_fkey(*),
                    receiverContact:customer_contacts!orders_receiver_contact_id_fkey(*),
                    items:order_items(*, product:products(name, image_url), siteAddressRecord:customer_addresses!site_address_id(*), siteInspectorRecord:customer_contacts!site_inspector_id(*))
                `)
                .order('order_date', { ascending: false }) // Newest first

            if (error) throw error

            const allJobs = []

            orders.filter(o => calculateOrderStatus(o.items) !== 'Cancelled').forEach(order => {
                const orderData = {
                    id: order.id,
                    customer: order.customer_details,
                    date: order.order_date,
                    status: calculateOrderStatus(order.items), // Runtime Derivation (Phase 11)
                    jobInfo: {
                        job_type: order.job_type || order.job_info?.job_type || order.job_info?.jobType || '-',
                        team: order.assigned_team || order.job_info?.team || '-',
                        appointment_date: order.appointment_date || order.job_info?.appointment_date || order.job_info?.appointmentDate,
                        completion_date: order.completion_date || order.job_info?.completion_date || order.job_info?.completionDate,
                        notes: order.notes || order.job_info?.notes || order.job_info?.description || order.note || ''
                    },
                    items: order.items || []
                }

                orderData.items.forEach((item, itemIdx) => {
                    // Helper to get value from either camel or snake case
                    const getVal = (obj, camel, snake) => obj?.[camel] || obj?.[snake]

                    // 1. Determine Main Job Type and Mode
                    const mainJobType = getVal(orderData.jobInfo || {}, 'jobType', 'job_type') || '-'
                    const isSeparate = mainJobType === 'separate' || mainJobType === 'งานแยก'

                    // 2. Extract Sub Job and Main Job Data
                    const subJob = item.sub_job_data || {} // Relational fallback helper
                    const mainJob = orderData.jobInfo || {}

                    const jobId = item.job_id || subJob.jobId || `${order.id}-${itemIdx + 1}`
                    const jobStatus = item.status || subJob.status || order.status

                    // 3. Strict Inheritance Logic
                    let jobType, appointmentDate, completionDate, team, assignedTeam, inspectorObj
                    let installLocationName, installAddress, googleMapLink, distance

                    if (isSeparate) {
                        // Separate Mode: Use Sub Job Data (Priority: Columns > JSONB > Joins)
                        jobType = item.job_type || subJob.jobType || subJob.job_type || 'ไม่ระบุ'
                        appointmentDate = item.appointment_date || subJob.appointmentDate || subJob.appointment_date || null
                        completionDate = item.completion_date || subJob.completionDate || subJob.completion_date || null
                        team = item.assigned_team || subJob.team || ''
                        assignedTeam = team

                        // Relational Inspector
                        inspectorObj = item.siteInspectorRecord ? {
                            id: item.siteInspectorRecord.id,
                            name: item.siteInspectorRecord.name,
                            phone: item.siteInspectorRecord.phone,
                            lineId: item.siteInspectorRecord.line_id,
                            email: item.siteInspectorRecord.email,
                            position: item.siteInspectorRecord.position,
                            note: item.siteInspectorRecord.note
                        } : (subJob.inspector1 || { name: subJob.inspector || '', phone: '' })

                        // Relational Address
                        installLocationName = item.siteAddressRecord?.label || subJob.installLocationName || ''
                        installAddress = item.siteAddressRecord?.address || subJob.installAddress || ''
                        googleMapLink = item.siteAddressRecord?.google_maps_link || item.google_map_link || subJob.googleMapLink || ''
                        distance = item.siteAddressRecord?.distance || item.distance || subJob.distance || ''

                    } else {
                        // Unified Mode: Use Main Job Data (Ignore Sub Job completely)
                        jobType = mainJobType
                        appointmentDate = mainJob.appointmentDate || mainJob.appointment_date || orderData.date
                        completionDate = mainJob.completionDate || mainJob.completion_date || null
                        team = mainJob.team || ''
                        assignedTeam = team

                        // NEW RELATIONAL FALLBACK: Rely on joined fields first, then JSONB
                        const finalDeliveryAddress = order.deliveryAddress
                        const finalReceiver = order.receiverContact ? {
                            id: order.receiverContact.id,
                            name: order.receiverContact.name,
                            phone: order.receiverContact.phone,
                            lineId: order.receiverContact.line_id,
                            email: order.receiverContact.email,
                            position: order.receiverContact.position,
                            note: order.receiverContact.note
                        } : null

                        const rawInspector = mainJob.inspector1 || mainJob.inspector
                        const jsonInspector = (rawInspector && typeof rawInspector === 'object') ? rawInspector : { name: rawInspector || '', phone: '' }

                        // Prioritize Join Data (Relational)
                        inspectorObj = finalReceiver || jsonInspector

                        installLocationName = finalDeliveryAddress?.label || mainJob.installLocationName || mainJob.install_location_name || ''
                        installAddress = finalDeliveryAddress?.address || mainJob.installAddress || mainJob.install_address || ''
                        googleMapLink = finalDeliveryAddress?.google_maps_link || finalDeliveryAddress?.googleMapLink || mainJob.googleMapLink || ''
                        distance = finalDeliveryAddress?.distance || mainJob.distance || ''
                    }

                    // 4. Product Info Logic (Strict: Live Data Only)
                    const productName = item.product?.name || 'สินค้าไม่ระบุ'
                    const productImage = item.product?.image_url || null

                    const jobObj = {
                        id: jobId,
                        orderId: order.id,
                        order_id: order.id, // Legacy support
                        customerId: order.customer_id,
                        customerName: order.customer?.name || 'ลูกค้าทั่วไป',
                        customerPhone: order.customer?.phone || '',

                        // Product Info
                        productId: item.product?.product_code || item.product_id,
                        productName: productName,
                        productImage: productImage,

                        // Job Details
                        jobType: jobType,
                        appointmentDate: appointmentDate,
                        jobDate: appointmentDate, // Legacy support
                        completionDate: completionDate,

                        // Location
                        installLocationName: installLocationName,
                        installAddress: installAddress,
                        address: installAddress, // Legacy support
                        googleMapLink: subJob.googleMapLink || (item.siteAddressRecord?.google_maps_link) || '',
                        distance: null, // Distance column dropped. Would need to be in customer_addresses.

                        // Assignments
                        inspector: inspectorObj.name, // Legacy string constraint
                        inspector1: inspectorObj, // Valid object
                        team: assignedTeam,
                        assignedTeam: assignedTeam,

                        status: jobStatus,

                        // Notes - Prefer SubJob description (Now in Column job_notes)
                        notes: item.job_notes || subJob.description || mainJob.notes || mainJob.description || '',
                        note: item.job_notes || subJob.description || mainJob.notes || mainJob.description || '',
                        description: item.job_notes || subJob.description || mainJob.notes || mainJob.description || '',

                        // Raw Data for debugging/fallback
                        order: {
                            ...orderData,
                            job_info: orderData.jobInfo
                        },
                        subJob: subJob
                    }

                    // Filter: Only include valid job types?
                    // Maybe exclude "separate" if it means "no job"?
                    // User requirement: "All items in order are jobs".
                    allJobs.push(jobObj)
                })
            })

            // Sort by Appointment Date (Ascending)
            return allJobs.sort((a, b) => {
                const dateA = new Date(a.appointmentDate || '9999-12-31')
                const dateB = new Date(b.appointmentDate || '9999-12-31')
                return dateA - dateB
            })

        } catch (error) {
            console.error('Error fetching jobs:', error)
            return []
        }
    },

    getJobById: async (id) => {
        try {
            // Re-use logic from getJobs but for single record
            // Note: Join with products removed due to FK mismatch
            let job = null

            // Try fetching from real 'jobs' table first
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    customer:customers(*),
                    order:orders(
                        *,
                        deliveryAddress:customer_addresses!delivery_address_id(*),
                        receiverContact:customer_contacts!receiver_contact_id(*),
                        taxInvoice:customer_tax_invoices!tax_invoice_id(*)
                    )
                `)
                .eq('id', id)
                .maybeSingle()

            if (error) {
                throw error
            }

            job = data

            // Manual Deep Fetch for Order Items to ensure safety
            if (job && job.order) {
                try {
                    const { data: items, error: itemsError } = await supabase
                        .from('order_items')
                        .select('*, product:products(name, image_url), siteAddressRecord:customer_addresses!site_address_id(*), siteInspectorRecord:customer_contacts!site_inspector_id(*)')
                        .eq('order_id', job.order.id)

                    // Enforce usage of fetched items
                    if (!itemsError && items) {
                        job.order.items = items
                    } else {
                        job.order.items = [] // No items in table = No items. Do not fallback to JSON.
                    }

                    // Recalculate Total from Table Items
                    const activeItems = job.order.items || []
                    if (activeItems.length > 0) {
                        const calculatedTotal = activeItems.reduce((sum, item) => {
                            const price = Number(item.unit_price || item.unitPrice || item.price || 0)
                            const qty = Number(item.qty || item.quantity || 1)
                            return sum + (price * qty)
                        }, 0)

                        job.order.total = calculatedTotal
                    }
                } catch (e) {
                    console.warn('[getJobById] Failed to fetch order items manually', e)
                }
            }

            // If not found in jobs table, try to find in Orders (Virtual Job)
            if (!job) {
                console.log('[getJobById] Job ' + id + ' not found in jobs table. Searching orders...')
                // Logic to find "Virtual Job" from Orders
                // We need to fetch orders (maybe filtered?) to find this ID.
                // Since ID format might be complex, we might need to fetch all active orders or search intelligently.
                // For now, let's fetch orders with a broader query or use getJobs() wrapper if performant?
                // Or better: Search orders where we might have saved this ID or scan recent orders.

                // Strategy: Fetch recent orders (limit 50?) and scan items?
                // Or if ID has structure "ODxxxxx-1", we can parse it.
                // If ID is "JBxxxxx", it SHOULD be in jobs table. If not, it's a data sync issue.

                // Let's assume for now if it's not in jobs table, we might have passed an OrderItem ID?
                // Or we scan 'getJobs' list.
                const allJobs = await DataManager.getJobs()
                const foundVirtual = allJobs.find(j => j.id === id)

                if (foundVirtual) {
                    return foundVirtual
                }

                return null // Truly not found
            }

            // ... Continue with legacy Job processing if found in 'jobs' table
            // Note: product_snapshot and product_name are deprecated.
            // We use job.order.items join instead (see deep fetch above).

            // Extract product info from joined product in order items
            let matchedItem = (job.order?.items || []).find(i => i.id === job.id || i.code === job.product_id)
            const productName = matchedItem?.product?.name || 'สินค้าไม่ระระบุ' // Live Data Only
            const productImage = matchedItem?.product?.image_url || null
            // Image is already handled above via product join or null


            // Extract subJob info (Inspector, etc) from Order Items if available
            // This is the CRITICAL logic to ensure we get the full rich data (inspector object, proper notes)
            let subJobData = null
            if (job.order?.items && Array.isArray(job.order.items)) {
                if (!matchedItem && job.product_id) {
                    // Fallback: match by product code/id
                    matchedItem = job.order.items.find(item =>
                        (item.code === job.product_id || item.id === job.product_id) && item.subJob
                    )
                }

                if (matchedItem && matchedItem.subJob) {
                    subJobData = matchedItem.subJob
                }
            }

            // Extract Inspector Name & Object
            // Priority: SubJob > Job Field
            let inspectorName = '-'
            let inspectorObj = { name: '', phone: '' }

            if (subJobData?.inspector1) {
                // If it's an object in subJob
                if (typeof subJobData.inspector1 === 'object') {
                    inspectorObj = subJobData.inspector1
                    inspectorName = inspectorObj.name || '-'
                    if (inspectorObj.phone) inspectorName += ' (' + inspectorObj.phone + ')'
                } else {
                    // Legacy string
                    inspectorName = subJobData.inspector1
                    inspectorObj = { name: inspectorName, phone: '' }
                }
            } else if (job.inspector1) {
                // FALLBACK: If found in jobs table directly (new columns)
                if (typeof job.inspector1 === 'object') {
                    inspectorObj = job.inspector1
                    inspectorName = inspectorObj.name || '-'
                    if (inspectorObj.phone) inspectorName += ' (' + inspectorObj.phone + ')'
                } else {
                    inspectorName = job.inspector1
                    inspectorObj = { name: inspectorName, phone: '' }
                }
            } else if (job.inspector) {
                inspectorName = job.inspector
                inspectorObj = { name: job.inspector, phone: '' }
            }
            // 3. Resolve Address & Map (Relational Join - Phase 3)
            // We now rely entirely on the joined deliveryAddress from the order
            const finalDeliveryAddress = job.order?.deliveryAddress || null

            let finalAddress = null

            // 1. SubJob (Most specific)
            if (subJobData?.installAddress) {
                finalAddress = subJobData.installAddress
            }
            // 2. Order Delivery Info (Relational Join - Option B)
            else if (job.order?.deliveryAddress) {
                finalAddress = job.order.deliveryAddress.address || job.order.deliveryAddress.label
            }

            if (!finalAddress) {
                finalAddress = job.customer?.address || '-'
            }

            return {
                id: job.id,
                uniqueId: job.id, // For compatibility
                orderId: job.order_id,
                customerId: job.customer_id,
                productId: job.product_id,

                // Job Details - Prefer SubJob Data for accuracy
                jobType: subJobData?.jobType || job.job_type || (job.job_type === 'ติดตั้ง' ? 'installation' : (job.job_type === 'ส่งของ' ? 'delivery' : 'installation')),
                rawJobType: job.job_type === 'ติดตั้ง' ? 'installation' : (job.job_type === 'ส่งของ' ? 'delivery' : job.job_type),

                // Dates - Prefer SubJob Data
                jobDate: subJobData?.appointmentDate || job.appointment_date,
                appointmentDate: subJobData?.appointmentDate || job.appointment_date,
                completionDate: subJobData?.completionDate || job.completion_date,

                jobTime: job.job_time,

                // Team - Prefer SubJob Data
                assignedTeam: subJobData?.team || job.assigned_team,
                team: subJobData?.team || job.assigned_team,

                // Inspector - Return both formatted string and object
                inspector: inspectorName,
                inspector1: inspectorObj,

                status: job.status,
                address: finalAddress,

                // Location Details - Prefer SubJob Data
                installLocationName: subJobData?.installLocationName || job.install_location_name || '',
                installAddress: finalAddress, // Already calculated preference
                googleMapLink: subJobData?.googleMapLink || finalDeliveryAddress?.google_maps_link || finalDeliveryAddress?.googleMapLink || '',
                distance: subJobData?.distance || finalDeliveryAddress?.distance || '',

                // App specific logic mapping
                signatureImage: job.signature_url,

                // Notes - Prefer SubJob description (Edit Popup uses 'description')
                notes: subJobData?.description || job.notes || '',
                description: subJobData?.description || job.notes || '',

                // Flattened / Joined Data
                customer: job.customer || { name: 'Unknown', phone: '-', address: '-' },
                customerName: job.customer?.name || 'Unknown',

                // Helper for Debug
                _debugSubJob: subJobData,

                // Product from Snapshot
                product: {
                    ...productSnapshot, // Include all original snapshot data (variants, options, etc.)
                    id: job.product_id,
                    name: productName,
                    image: productImage,
                    price: productSnapshot?.unitPrice || 0,
                    remark: (() => {
                        // Use matched item found earlier
                        if (job.order?.items && Array.isArray(job.order.items)) {
                            // Find item that links to this job (RE-USING matchedItem if available)
                            // We reused the logic above, but 'matchedItem' variable scope is limited.
                            // Let's re-find simplistically or improve scope. 
                            // For minimal diff, I'll keep the existing inline logic but use the same find criteria roughly.
                            const matchedItem = job.order.items.find(item => item.subJob?.jobId === job.id || (item.code === job.product_id && item.subJob))
                            if (matchedItem) return matchedItem.note || matchedItem.remark || '-'
                        }
                        return productSnapshot?.remark || '-'
                    })()
                },
                productName: productName,
                productImage: productImage,

                order: job.order ? {
                    ...job.order,
                    paymentSchedule: job.order.payment_schedule || [],
                    items: job.order.items // Pass items needed for some UI logic?
                } : {},

                // Raw SubJob (if needed for fallback)
                subJob: subJobData || {}
            }

        } catch (error) {
            console.error('Error fetching job:', error)
            return null
        }
    },

    // --- Data Modification Helpers ---

    saveCustomer: async (customerData) => {
        try {
            // Generate ID if missing (ensure it is a string)
            const customerId = (customerData.id || 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)).toString()
            console.log('[saveCustomer] Using Customer ID:', customerId)

            const dbPayload = {
                id: customerId,
                name: customerData.name,
                phone: customerData.phone,
                email: customerData.email,
                line_id: customerData.line || customerData.lineId,
                facebook: customerData.facebook,
                instagram: customerData.instagram,
                media_source: customerData.mediaSource,
                media_source_other: customerData.mediaSourceOther,
                // JSONB columns removed - data now in relational tables
            }

            // 1. Upsert customer
            const { data, error } = await supabase
                .from('customers')
                .upsert(dbPayload)
                .select()

            if (error) {
                console.error('Supabase Error saving customer:', error)
                throw error
            }

            const c = data ? data[0] : null
            if (!c) return null

            // Helper to check valid UUID
            const isValidUUID = (id) => {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                return typeof id === 'string' && uuidRegex.test(id)
            }

            // Helper to prepare payload (removes id if invalid/undefined)
            const preparePayload = (item, extraFields = {}) => {
                const payload = { ...extraFields }
                if (isValidUUID(item.id)) {
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
                    // For new records check required fields
                    const hasData = (tax.companyName && tax.companyName.trim() !== '') && (tax.taxId && tax.taxId.trim() !== '')

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
                            address: addressParts || tax.address,
                            branch_number: tax.branchNumber || tax.branch,
                            branch_name: tax.branchName,
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

            const orderPayload = {
                id: orderData.id,
                customer_id: orderData.customer?.id,
                // customer_name: orderData.customer?.name, // Removed: Relation-only

                // FK references
                selected_contact_id: orderData.purchaserContact?.id || null,
                receiver_contact_id: orderData.receiverContact?.id || null,

                delivery_address_id: rawDelivery?.id || null,
                tax_invoice_id: orderData.taxInvoice?.id || null,

                // JSONB Fallbacks: PHYSICALLY REMOVED (Option B)
                // Columns delivery_address_info, selected_contact_info, etc. are gone.

                // Standard Fields
                order_date: orderData.date,
                total: orderData.total,
                shipping_fee: orderData.shippingFee,
                vat_rate: 0.07,

                // Relational Fields (Phase 11)
                job_type: orderData.jobInfo?.job_type || orderData.jobInfo?.jobType || null,
                assigned_team: orderData.jobInfo?.team || null,
                appointment_date: orderData.jobInfo?.appointmentDate || null,
                completion_date: orderData.jobInfo?.completionDate || null,
                notes: orderData.jobInfo?.description || orderData.note || null,

                discount_mode: orderData.discount?.mode || 'percent',
                discount_value: Number(orderData.discount?.value || 0)
            }

            // 2. Upsert Order Header
            const { error: orderError } = await supabase
                .from('orders')
                .upsert(orderPayload)

            if (orderError) {
                console.error('[saveOrder] Error upserting order header:', orderError)
                throw orderError
            }

            // 3. Save Items to order_items Table
            // 3.1 Delete existing items (Full Replace Strategy)
            const { error: deleteError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', orderData.id)

            if (deleteError) throw deleteError

            // 3.2 Resolve Product IDs from codes if missing UUIDs
            const codesToResolve = [...new Set(orderData.items
                .map(item => item.code || item.item_code || item.product_code)
                .filter(code => code && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code))
            )]

            let codeToIdMap = {}
            if (codesToResolve.length > 0) {
                console.log('[saveOrder] Resolving IDs for codes:', codesToResolve)
                const { data: resolvedProducts } = await supabase
                    .from('products')
                    .select('id, product_code')
                    .in('product_code', codesToResolve)

                if (resolvedProducts) {
                    resolvedProducts.forEach(p => {
                        codeToIdMap[p.product_code] = p.id
                    })
                }
            }

            // 3.3 Prepare Items Payload
            const itemsPayload = orderData.items.map(item => {
                const productIdentifier = item.product_id || item.uuid || item.id
                const isUUID = productIdentifier && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdentifier)

                const itemCode = item.code || item.item_code || item.product_code
                const resolvedProductId = isUUID ? productIdentifier : (item.selectedVariant?.product_id || codeToIdMap[itemCode] || null)

                // Realtime: Resolve Variant ID
                const variantId = item.selectedVariant?.id || item.variant_id || item.variantId || null

                return {
                    order_id: orderData.id,
                    product_id: resolvedProductId,
                    product_variant_id: variantId,

                    // Common fields
                    quantity: Number(item.qty || item.quantity || 1),
                    unit_price: Number(item.unitPrice || item.price || 0),
                    // total: Number(item.total || 0), // Generated column
                    status: orderData.status || 'Pending',

                    // Phase 13: Relational Metadata (Metadata Columns)
                    job_id: item.subJob?.jobId || null,
                    job_type: item.subJob?.jobType || null,
                    assigned_team: item.subJob?.team || null,
                    appointment_date: item.subJob?.appointmentDate || null,
                    completion_date: item.subJob?.completionDate || null,
                    job_notes: item.subJob?.description || null,
                    remark: item.remark || null,
                    variation_notes: item.description || null,
                    // google_map_link: REMOVED (Use site_address_id),
                    // distance: REMOVED (Use site_address_id),
                    light: item.light || item.bulbType || null,
                    light_color: item.lightColor || null,
                    remote: item.remote || null,

                    site_address_id: item.subJob?.installLocationId || rawDelivery?.id || null,
                    site_inspector_id: item.subJob?.inspector1?.id || null
                }
            })

            console.log('[saveOrder] Prepared items payload:', itemsPayload.length, 'items')
            console.log('[saveOrder] First item sample:', itemsPayload[0])

            if (itemsPayload.length > 0) {
                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsPayload)

                if (itemsError) {
                    console.error('[saveOrder] Error inserting order items:', itemsError)
                    console.error('[saveOrder] Failed payload:', JSON.stringify(itemsPayload, null, 2))
                    throw itemsError
                }
                console.log('[saveOrder] Successfully inserted', itemsPayload.length, 'items')
            }

            // 3. Handle Jobs (Relational)
            // 3. Create Jobs for each item
            const jobsPayload = orderData.items
                .filter(item => item.subJob && item.subJob.jobId)
                .map(item => {
                    // Define allowed fields for product_snapshot
                    const allowedFields = [
                        'code', 'product_code', 'product_id',
                        'name', 'category', 'material', 'description',
                        'qty', 'unitPrice',
                        'color', 'dimensions', 'stock', // From variant
                        'lightColor', 'crystalColor', 'remote', 'bulbType',
                        'selectedVariant', 'selectedVariantIndex'
                    ]

                    // Filter item to only include allowed fields
                    const cleanSnapshot = Object.fromEntries(
                        Object.entries(item)
                            .filter(([key]) => allowedFields.includes(key))
                    )

                    console.log('[DataManager] Creating job with clean snapshot:', {
                        jobId: item.subJob.jobId,
                        productName: item.name,
                        snapshotKeys: Object.keys(cleanSnapshot)
                    })

                    const productIdentifier = item.product_id || item.uuid || item.id
                    const isUUID = productIdentifier && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdentifier)
                    const itemCode = item.code || item.item_code || item.product_code
                    const resolvedProductId = isUUID ? productIdentifier : (item.selectedVariant?.product_id || codeToIdMap[itemCode] || null)

                    return {
                        id: item.subJob.jobId,
                        order_id: orderData.id,
                        customer_id: orderData.customer?.id,
                        // customer_name: orderData.customer?.name, // Removed
                        product_id: resolvedProductId, // Use the resolved UUID from 3.2
                        // product_name: item.name || item.product?.name || 'Unknown Product', // Removed

                        // New Standardized Fields (Relational)
                        inspector: item.subJob?.inspector1?.name || item.subJob?.inspector || orderData.jobInfo?.inspector1?.name || orderData.jobInfo?.inspector || '',
                        inspector1: item.subJob?.inspector1 || orderData.jobInfo?.inspector1 || {},
                        install_location_name: item.subJob.installLocationName || orderData.jobInfo?.installLocationName || '',

                        job_type: item.subJob.jobType || orderData.jobInfo?.jobType || 'installation',
                        appointment_date: item.subJob.appointmentDate || orderData.jobInfo?.appointmentDate || orderData.date,
                        completion_date: item.subJob.completionDate || orderData.jobInfo?.completionDate || null,
                        // Fields below are DEPRECATED (Phase 3: Relational Only)
                        // address: item.subJob.installAddress || orderData.jobInfo?.installAddress || orderData.customer?.address,
                        // google_map_link: item.subJob.googleMapLink || orderData.jobInfo?.googleMapLink,
                        // distance: item.subJob.distance || orderData.jobInfo?.distance || null,
                        assigned_team: item.subJob.team || orderData.jobInfo?.team || '-',
                        status: 'รอดำเนินการ',
                        notes: item.subJob.description || (orderData.jobInfo?.description) || null,
                        // product_snapshot: cleanSnapshot, // Removed: Per User Request
                        created_at: new Date().toISOString()
                    }
                })

            if (jobsPayload.length > 0) {
                const { error: jobsError } = await supabase.from('jobs').upsert(jobsPayload)
                if (jobsError) console.error('Error saving jobs:', jobsError)
            }

            // 4. Save Payment Schedule (order_payments)
            // 4.1 Delete existing payments to sync
            const { error: deletePaymentError } = await supabase
                .from('order_payments')
                .delete()
                .eq('order_id', orderData.id)

            if (deletePaymentError) {
                console.error('[saveOrder] Error clearing old payments:', deletePaymentError)
                throw deletePaymentError
            }

            // 4.2 Insert new payments
            if (uploadedPaymentSchedule && uploadedPaymentSchedule.length > 0) {
                const paymentsPayload = uploadedPaymentSchedule.map(p => ({
                    order_id: orderData.id,
                    payment_date: p.date,
                    amount: p.amount,
                    payment_method: p.method,
                    payment_type: p.type || 'deposit',
                    proof_url: p.proofUrl,
                    status: p.status || 'Completed',
                    is_deposit: p.type === 'deposit' // Derive or use existing
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
            return error // Return error object for debugging
        }
    },

    deleteOrder: async (id) => {
        if (!supabase) return false
        try {
            // Delete related tables explicitly to prevent Foreign Key constraints
            await supabase.from('order_payments').delete().eq('order_id', id)
            await supabase.from('order_items').delete().eq('order_id', id)
            await supabase.from('jobs').delete().eq('order_id', id)

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

    getNextOrderId: async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id')
                .order('id', { ascending: false })
                .limit(1)

            if (error) throw error

            if (data && data.length > 0) {
                const lastId = data[0].id
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
        if (!supabase) return 'JB0000001' // Returning default ID if supabase client is not available
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('id')
                .order('id', { ascending: false })
                .limit(1)

            if (error) throw error

            if (data && data.length > 0) {
                const lastId = data[0].id
                // Extract number: JB0000001
                const numStr = lastId.replace(/\D/g, '')
                const num = parseInt(numStr, 10)
                return 'JB' + (num + 1).toString().padStart(7, '0')
            }
            return 'JB0000001'
        } catch (error) {
            return 'JB0000001'
        }
    },

    saveJob: async (jobData) => {
        try {
            // Convert camelCase app data back to snake_case for DB
            const dbPayload = {
                id: jobData.id,
                order_id: jobData.orderId,
                customer_id: jobData.customerId,
                product_id: jobData.productId,
                job_type: jobData.jobType,
                appointment_date: jobData.jobDate,
                job_time: jobData.jobTime,
                assigned_team: jobData.assignedTeam,
                status: jobData.status,
                notes: jobData.notes,
                completion_date: jobData.completionDate, // if passed

                // New / Updated Fields
                inspector: jobData.inspector1?.name || jobData.inspector || '',
                inspector1: jobData.inspector1 || {},
                // address, google_map_link, distance are now relational only (dropped in Phase 3)
                install_location_name: jobData.installLocationName || ''
            }

            const { error } = await supabase
                .from('jobs')
                .upsert(dbPayload)

            if (error) throw error
            return { success: true }
        } catch (error) {
            console.error('Error saving job:', error)
            return { success: false, error: error.message || JSON.stringify(error) }
        }
    },

    // Internal helper purely for compatibility if needed, but getJobs covers it.
    getJobsRaw: async () => {
        const { data } = await supabase.from('jobs').select('*')
        return data || []
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
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('id', 'default')
                .single()

            if (error) throw error

            return {
                shopName: data.shop_name,
                shopAddress: data.shop_address,
                shopPhone: data.shop_phone,
                shopEmail: data.shop_email,
                shopTaxId: data.shop_tax_id,
                vatRegistered: data.vat_registered,
                vatRate: data.vat_rate,
                systemOptions: data.system_options || {},
                promptpayQr: data.promptpay_qr
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
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
        items:order_items(*, product:products(name), variant:product_variants!product_variant_id(*), siteAddressRecord:customer_addresses!site_address_id(*), siteInspectorRecord:customer_contacts!site_inspector_id(*))
    `)
                .eq('id', id)
                .single()

            if (error) {
                console.error('Error fetching order:', error)
                throw error
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

            const resolvedPurchaser = data.selected_contact_id
                ? data.customer?.contacts?.find(c => c.id === data.selected_contact_id)
                : null

            const resolvedReceiver = data.receiver_contact_id
                ? data.customer?.contacts?.find(c => c.id === data.receiver_contact_id)
                : null

            const resolvedDeliveryAddress = data.delivery_address_id
                ? data.customer?.addresses?.find(a => a.id === data.delivery_address_id)
                : null

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
                address: resolvedTaxInvoice.address
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
                customerId: data.customer_id,
                // Joined Customer Data
                customer: customerObj,
                customerDetails: customerObj, // For backward compatibility
                // Fallback for legacy JSON fields if needed
                customer_name: data.customer?.name || 'Unknown', // Live Data Only

                date: data.order_date,
                status: calculateOrderStatus(data.items), // Runtime Derivation (Phase 11)
                total: data.total || 0,
                shippingFee: data.shipping_fee || 0,
                discount: {
                    mode: data.discount_mode || data.discount?.mode || 'percent',
                    value: data.discount_value !== null ? Number(data.discount_value) : (data.discount?.value || 0)
                },
                vatRate: data.vat_rate || 0,

                // Relational Job Info (Phase 11)
                jobInfo: {
                    jobType: data.job_type || data.job_info?.jobType || data.job_info?.job_type || '-',
                    team: data.assigned_team || data.job_info?.team || '-',
                    appointmentDate: data.appointment_date || data.job_info?.appointmentDate || data.job_info?.appointment_date,
                    completionDate: data.completion_date || data.job_info?.completionDate || data.job_info?.completion_date,
                    description: data.notes || data.job_info?.description || data.note || ''
                },

                // Mapped Items from Joined Table
                // Items Mapping
                items: (data.items || []).map(item => ({
                    id: item.id, // OrderItem ID
                    code: item.product_variant_id || item.product?.product_code, // Or SKU?
                    product_variant_id: item.product_variant_id,
                    product_id: item.product_id || item.product?.id,
                    name: item.product?.name || 'Unknown Product',
                    // image: item.product?.image_url || item.image, // OLD
                    image: item.variant?.image_url || item.image || null, // NEW: Use Variant Image
                    price: Number(item.unit_price || 0),
                    ...item,
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
                    // If fields are missing in JSONB, pull from Join Data (variant join)
                    code: item.variation_data?.code || item.product?.product_code || item.variant?.sku || '',

                    color: item.variation_data?.color || item.variant?.color || item.variation_data?.selectedVariant?.color || item.product?.color,
                    dimensions: item.variation_data?.dimensions || item.variant?.size || item.variation_data?.selectedVariant?.dimensions || item.product?.dimensions,
                    crystalColor: item.variation_data?.crystalColor || item.variant?.crystal_color || item.variation_data?.selectedVariant?.crystal_color || item.product?.crystal_color,
                    bulbType: item.variation_data?.bulbType || item.variant?.bulb_type || item.variation_data?.selectedVariant?.bulb_type || item.product?.bulb_type,

                    // Phase 13: Relational Metadata (Metadata Columns)
                    jobId: item.job_id || item.sub_job_data?.jobId,
                    jobType: item.job_type || item.sub_job_data?.jobType,
                    appointmentDate: item.appointment_date || item.sub_job_data?.appointmentDate,
                    completionDate: item.completion_date || item.sub_job_data?.completionDate,
                    team: item.assigned_team || item.sub_job_data?.team,
                    jobNotes: item.job_notes || item.sub_job_data?.description,
                    remark: item.remark || item.variation_data?.remark,
                    variationNotes: item.variation_notes || item.variation_data?.description,
                    googleMapLink: item.google_map_link || item.sub_job_data?.googleMapLink,
                    distance: item.distance || item.sub_job_data?.distance,
                    light: item.light || item.variation_data?.light,
                    lightColor: item.light_color || item.variation_data?.lightColor,
                    remote: item.remote || item.variation_data?.remote,

                    // Metadata (Phase 5: Re-hydrate Location Relationally)
                    subJob: item.sub_job_data ? {
                        ...item.sub_job_data,
                        jobId: item.job_id || item.sub_job_data.jobId,
                        jobType: item.job_type || item.sub_job_data.jobType,
                        appointmentDate: item.appointment_date || item.sub_job_data.appointmentDate,
                        completionDate: item.completion_date || item.sub_job_data.completionDate,
                        team: item.assigned_team || item.sub_job_data.team,
                        description: item.job_notes || item.sub_job_data.description,
                        installLocationId: item.site_address_id,
                        installLocationName: item.siteAddressRecord?.label || item.sub_job_data.installLocationName,
                        installAddress: item.siteAddressRecord?.address || item.sub_job_data.installAddress,
                        googleMapLink: item.google_map_link || item.siteAddressRecord?.google_maps_link || item.sub_job_data.googleMapLink,
                        distance: item.distance || item.siteAddressRecord?.distance || item.sub_job_data.distance,
                        inspector1: item.siteInspectorRecord ? {
                            id: item.siteInspectorRecord.id,
                            name: item.siteInspectorRecord.name,
                            phone: item.siteInspectorRecord.phone,
                            lineId: item.siteInspectorRecord.line_id,
                            email: item.siteInspectorRecord.email,
                            position: item.siteInspectorRecord.position,
                            note: item.siteInspectorRecord.note
                        } : item.sub_job_data.inspector1
                    } : {}
                })),

                // Joined Relations (Re-hydration for Minimized JSONB)
                // Joined Relations (Re-hydration for Minimized JSONB)
                jobInfo: {
                    jobType: data.job_type || data.job_info?.job_type || data.job_info?.jobType,
                    team: data.assigned_team || data.job_info?.team,
                    appointmentDate: data.appointment_date || data.job_info?.appointment_date || data.job_info?.appointmentDate,
                    completionDate: data.completion_date || data.job_info?.completion_date || data.job_info?.completionDate,
                    description: data.notes || data.job_info?.description,

                    // RE-HYDRATION: Master Record Priority
                    installLocationName: finalDeliveryAddress?.label || data.job_info?.install_location_name,
                    installAddress: finalDeliveryAddress?.address || data.job_info?.install_address,
                    googleMapLink: finalDeliveryAddress?.googleMapsLink || finalDeliveryAddress?.googleMapLink || data.job_info?.google_map_link,
                    distance: finalDeliveryAddress?.distance || data.job_info?.distance,
                    inspector1: finalReceiver || data.job_info?.inspector1,

                    // Spread fallback for backward compatibility
                    ...(data.job_info || {})
                },


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

                // Removed redundant 'note' field in favor of job_info.description

                // Map Payments
                paymentSchedule: (payments || []).map(p => ({
                    id: p.id,
                    amount: p.amount,
                    date: p.payment_date,
                    method: p.payment_method,
                    type: p.payment_type || 'deposit',
                    proofUrl: p.proof_url,
                    status: p.status,
                    is_deposit: p.is_deposit
                })).sort((a, b) => new Date(a.date) - new Date(b.date))
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
                    system_options: settings.systemOptions,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error saving settings:', error)
            return false
        }
    },

    getProductOptions: async () => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('system_options')
                .eq('id', 'default')
                .single()

            if (error) throw error
            return data.system_options || {}
        } catch (error) {
            console.error('Error fetching product options:', error)
            return null
        }
    },

    saveProductOptions: async (options) => {
        if (!supabase) return false
        try {
            const { error } = await supabase
                .from('settings')
                .update({
                    system_options: options,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 'default')

            if (error) throw error
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
                .from('employees')
                .select('team, team_type')
                .in('team_type', ['ช่าง', 'QC'])
                .not('team', 'is', null)

            if (error) throw error

            // Get unique team names
            const uniqueTeams = [...new Set(data.map(emp => emp.team).filter(Boolean))]
            return uniqueTeams.sort()
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

            return !error
        } catch (error) {
            console.error('Error deleting leave request:', error)
            return false
        }
    },
}
