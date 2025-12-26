/**
 * Order Manager - FIXED VERSION
 * Handles orders, jobs, and related operations
 * 
 * FIXES APPLIED:
 * 1. Removed undefined codeToIdMap reference
 * 2. Improved UUID validation with type checking
 * 3. Fixed orphan deletion logic
 * 4. Added comprehensive error handling
 * 5. Improved deleteOrder with better error messages
 */

import { supabase } from '../supabaseClient'
import { calculateOrderStatus, _withRetry } from './helpers'
import { uploadSignature } from './uploadManager'
import { JobManager } from './jobManager'

/**
 * Helper: Validate UUID with type checking
 */
const validUUID = (id) => {
    // FIX: Handle if object is passed instead of ID string
    const targetId = (typeof id === 'object' && id !== null) ? id.id : id

    if (!targetId) return null
    if (typeof targetId !== 'string') {
        // console.warn(`[validUUID] Non-string ID: ${typeof targetId}`)
        return null
    }
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)
    if (!isUUID) {
        // console.warn(`[validUUID] Invalid UUID nulled: ${targetId}`)
        return null
    }
    return targetId
}

/**
 * Helper: Check if ID is UUID
 */
const isUUID = (id) => {
    if (!id || typeof id !== 'string') return false
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Get next order ID
 */
export const getNextOrderId = async () => {
    try {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })

        if (error) throw error
        return count ? count + 1 : 1
    } catch (error) {
        console.error('Error fetching order count:', error)
        return 1
    }
}

/**
 * Generate document ID (for invoices/receipts)
 */
export const _generateDocumentId = async (type, dateStr) => {
    if (!supabase) return null
    try {
        const dateObj = new Date(dateStr || Date.now())
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const yearMonth = `${year}${month}`

        const { data: seq, error } = await supabase.rpc('get_next_document_sequence', {
            doc_type: type,
            doc_year_month: yearMonth
        })

        if (error) throw error

        const seqStr = String(seq).padStart(5, '0')
        return `${type}-${yearMonth}${seqStr}`
    } catch (error) {
        console.error('Error generating document ID:', error)
        return null
    }
}

/**
 * Save Order - FIXED VERSION
 * 
 * CRITICAL FIXES:
 * - Removed undefined codeToIdMap (line 2724 in backup)
 * - Improved UUID validation
 * - Fixed orphan deletion to handle empty arrays
 * - Added specific error messages
 * - Better error handling throughout
 */
export const saveOrder = async (orderData) => {
    try {
        console.log('[saveOrder] Starting save order process')
        console.log('[saveOrder] Order ID:', orderData.id)
        console.log('[saveOrder] Items count:', orderData.items?.length)

        // 0. Upload payment signatures
        let uploadedPaymentSchedule = orderData.paymentSchedule
        if (orderData.paymentSchedule && orderData.paymentSchedule.length > 0) {
            console.log('[saveOrder] Processing payments:', orderData.paymentSchedule.length)

            uploadedPaymentSchedule = await Promise.all(
                orderData.paymentSchedule.map(async (payment, index) => {
                    const receiverUrl = await uploadSignature(
                        payment.receiverSignature,
                        orderData.id,
                        index,
                        'receiver'
                    )
                    const payerUrl = await uploadSignature(
                        payment.payerSignature,
                        orderData.id,
                        index,
                        'payer'
                    )
                    return {
                        ...payment,
                        receiverSignature: receiverUrl,
                        payerSignature: payerUrl
                    }
                })
            )
        }

        // 1. Prepare Order Payload
        const rawDelivery = (orderData.deliveryAddress?.address || orderData.deliveryAddress?.id)
            ? orderData.deliveryAddress
            : orderData.taxInvoiceDeliveryAddress

        let orderId = orderData.id

        const isNewOrder = !orderId || !isUUID(orderId)

        if (isNewOrder) {
            orderId = undefined
        }

        const orderPayload = {
            ...(orderId ? { id: orderId } : {}),
            // order_number: orderNumber, // REMOVED (Legacy)
            customer_id: validUUID(orderData.customer?.id),
            purchaser_contact_id: validUUID(orderData.purchaserContact?.id),
            receiver_contact_id: validUUID(orderData.receiverContact?.id),
            tax_invoice_id: validUUID(orderData.taxInvoice?.id),
            order_date: orderData.date,
            total: orderData.total,
            shipping_fee: orderData.shippingFee,
            vat_rate: 0.07,
            job_type: orderData.jobInfo?.job_type || orderData.jobInfo?.jobType || null,
            discount_mode: orderData.discount?.mode || 'percent',
            discount_value: Number(orderData.discount?.value || 0),

            // FIX: Use new ID columns instead of legacy JSON
            // tax_invoice_delivery_address: orderData.taxInvoiceDeliveryAddress || null, // Removed legacy
            // delivery_address: orderData.deliveryAddress || null // Removed legacy
            tax_invoice_delivery_address_id: validUUID(orderData.taxInvoiceDeliveryAddress?.id),
            delivery_address_id: validUUID(orderData.deliveryAddress?.id)
        }

        // 2. Upsert Order Header
        console.log('[saveOrder] Upserting order...')

        const { data: savedOrder, error: orderError } = await _withRetry(
            'saveOrder:upsertOrder',
            async () => {
                return await supabase
                    .from('orders')
                    .upsert(orderPayload)
                    .select()
                    .single()
            }
        )

        if (orderError) {
            console.error('[saveOrder] Order upsert failed:', orderError)

            // Specific error messages
            if (orderError.code === '23503') {
                return {
                    success: false,
                    message: 'ข้อมูลลูกค้า ผู้ติดต่อ หรือที่อยู่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูล'
                }
            }
            if (orderError.code === '23505') {
                return {
                    success: false,
                    message: 'เลขที่ออเดอร์ซ้ำ กรุณาใช้เลขที่อื่น'
                }
            }

            throw orderError
        }

        console.log('[saveOrder] Order saved:', savedOrder.id)
        const finalOrderId = savedOrder.id

        // 3. Save Items
        if (!orderData.items || orderData.items.length === 0) {
            console.log('[saveOrder] No items to save')
            return { success: true, orderId: finalOrderId }
        }

        // Pre-assign IDs to items
        const itemsWithIds = orderData.items.map(item => {
            const existingId = validUUID(item.id) || validUUID(item.uuid)
            const finalId = existingId || crypto.randomUUID()
            return {
                ...item,
                _finalId: finalId
            }
        })

        // Prepare items payload
        const itemsPayload = itemsWithIds.map(item => {
            const productIdentifier = item.product_id || item.uuid || item.id
            const isProductUUID = productIdentifier && isUUID(productIdentifier)

            // FIX: Removed undefined codeToIdMap reference
            // Simplified: Use product_id from selectedVariant or the identifier itself
            const resolvedProductId = isProductUUID
                ? productIdentifier
                : (item.selectedVariant?.product_id || null)

            const variantId = item.selectedVariant?.id || item.variant_id || item.variantId || null

            return {
                id: item._finalId,
                order_id: finalOrderId,
                product_id: validUUID(resolvedProductId),
                product_variant_id: validUUID(variantId),
                quantity: Number(item.qty || item.quantity || 1),
                unit_price: Number(item.unitPrice || item.price || 0),
                remark: item.remark || null,
                light: item.light || item.bulbType || null,
                light_color: item.lightColor || null,
                remote: item.remote || null
            }
        })

        console.log('[saveOrder] Upserting', itemsPayload.length, 'items')

        const { error: itemsError } = await supabase
            .from('order_items')
            .upsert(itemsPayload)
            .select()

        if (itemsError) {
            console.error('[saveOrder] Items upsert failed:', itemsError)

            if (itemsError.code === '23503') {
                return {
                    success: false,
                    message: 'ข้อมูลสินค้าไม่ถูกต้อง กรุณาเลือกสินค้าใหม่'
                }
            }

            throw itemsError
        }

        // FIX: Improved orphan deletion - handle empty array
        const currentItemIds = itemsPayload.map(i => i.id)

        if (currentItemIds.length > 0) {
            const { error: deleteOrphanError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', finalOrderId)
                .not('id', 'in', `(${currentItemIds.map(id => `"${id}"`).join(',')})`)

            if (deleteOrphanError) {
                console.error('[saveOrder] CRITICAL: Failed to delete orphan items:', deleteOrphanError)
                // Don't throw - non-critical
            }
        } else {
            // Delete all items if none provided
            await supabase
                .from('order_items')
                .delete()
                .eq('order_id', finalOrderId)
        }

        // 4. Save Jobs
        const allJobsPayload = []

        itemsWithIds.forEach((itemWithId) => {
            let itemJobs = [...(itemWithId.jobs || [])]

            if (itemJobs.length === 0) {
                itemJobs = [{
                    jobType: 'installation',
                    status: 'รอดำเนินการ',
                    sequence_number: 1
                }]
            }

            itemJobs.forEach((job) => {
                const payload = {
                    id: validUUID(job.id) || crypto.randomUUID(),
                    order_item_id: itemWithId._finalId,
                    order_id: finalOrderId,
                    job_type: job.jobType || job.job_type || 'installation',
                    status: job.status || 'รอดำเนินการ',
                    assigned_team: job.team || job.assigned_team || null,
                    appointment_date: job.appointmentDate || job.appointment_date || null,
                    completion_date: job.completionDate || job.completion_date || null,
                    notes: job.description || job.notes || null,
                    site_address_id: validUUID(job.installLocationId || job.site_address_id),
                    site_inspector_id: validUUID(job.inspector1?.id || job.site_inspector_id),
                    team_payment_batch_id: job.serviceFeeId || job.team_payment_batch_id || null,
                    created_at: job.created_at || new Date().toISOString()
                }

                allJobsPayload.push(payload)
            })
        })

        if (allJobsPayload.length > 0) {
            const { data: createdJobs, error: jobsError } = await supabase
                .from('jobs')
                .upsert(allJobsPayload)
                .select()

            if (jobsError) {
                console.error('[saveOrder] Jobs upsert failed:', jobsError)
                throw jobsError
            }

            // Delete orphan jobs
            const currentJobIds = allJobsPayload.map(j => j.id)

            if (currentJobIds.length > 0) {
                const { error: deleteOrphanJobsError } = await supabase
                    .from('jobs')
                    .delete()
                    .eq('order_id', finalOrderId)
                    .not('id', 'in', `(${currentJobIds.map(id => `"${id}"`).join(',')})`)

                if (deleteOrphanJobsError) {
                    console.error('[saveOrder] Failed to delete orphan jobs:', deleteOrphanJobsError)
                }
            }

            // Sync service fee links
            const serviceFeeLinks = createdJobs
                .filter(job => job.team_payment_batch_id)
                .map(job => ({
                    service_fee_id: job.team_payment_batch_id,
                    job_id: job.id
                }))

            if (serviceFeeLinks.length > 0) {
                await supabase
                    .from('team_service_fee_jobs')
                    .upsert(serviceFeeLinks, { onConflict: 'service_fee_id, job_id', ignoreDuplicates: true })
            }
        }

        // 5. Save Payment Schedule
        await supabase
            .from('order_payments')
            .delete()
            .eq('order_id', finalOrderId)

        if (uploadedPaymentSchedule && uploadedPaymentSchedule.length > 0) {
            const paymentsPayload = await Promise.all(uploadedPaymentSchedule.map(async p => {
                let ivNo = p.invoiceNo
                if (p.issueInvoice && !ivNo) {
                    ivNo = await _generateDocumentId('IV', p.invoiceDate || p.date)
                }

                let rcNo = p.receiptNo
                if (p.issueReceipt && !rcNo) {
                    rcNo = await _generateDocumentId('RC', p.receiptDate || p.date)
                }

                return {
                    order_id: finalOrderId,
                    payment_date: p.date || null,
                    amount: p.amount,
                    payment_method: p.method || p.paymentMethod || p.payment_method || null,
                    payment_type: p.type || 'deposit',
                    proof_url: p.proofUrl || p.proof_url || p.slip || null,
                    receiver_signature: p.receiverSignature || p.receiver_signature || null,
                    payer_signature: p.payerSignature || p.payer_signature || null,
                    status: p.status || 'Completed',
                    is_deposit: p.type === 'deposit',
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
                console.error('[saveOrder] Payments insert failed:', insertPaymentError)
                throw insertPaymentError
            }
        }

        console.log('[saveOrder] ✅ Order saved successfully!')
        return { success: true, orderId: finalOrderId }

    } catch (error) {
        console.error('[saveOrder] ❌ FAILED:', error)

        // User-friendly error message
        return {
            success: false,
            message: `บันทึกไม่สำเร็จ: ${error.message || 'เกิดข้อผิดพลาด'}`,
            error: error
        }
    }
}

/**
 * Delete Order - IMPROVED VERSION
 * 
 * IMPROVEMENTS:
 * - Better error messages
 * - Proper return values
 * - Comprehensive logging
 */
export const deleteOrder = async (id) => {
    if (!supabase) {
        return {
            success: false,
            message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'
        }
    }

    try {
        console.log('[deleteOrder] Deleting order:', id)

        // 1. Get job IDs to delete related records
        const { data: jobIds } = await supabase
            .from('jobs')
            .select('id')
            .eq('order_id', id)

        if (jobIds && jobIds.length > 0) {
            const ids = jobIds.map(j => j.id)
            await supabase.from('team_service_fee_jobs').delete().in('job_id', ids)
            await supabase.from('job_completions').delete().in('job_id', ids)
        }

        // 2. Delete jobs
        await supabase.from('jobs').delete().eq('order_id', id)

        // 3. Delete other order relations
        await supabase.from('order_payments').delete().eq('order_id', id)
        await supabase.from('order_items').delete().eq('order_id', id)

        // 4. Delete order
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('[deleteOrder] Failed:', error)

            if (error.code === '23503') {
                return {
                    success: false,
                    message: 'ไม่สามารถลบได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง'
                }
            }

            throw error
        }

        console.log('[deleteOrder] ✅ Successfully deleted order:', id)
        return { success: true }

    } catch (error) {
        console.error('[deleteOrder] ❌ Error:', error)
        return {
            success: false,
            message: `ลบไม่สำเร็จ: ${error.message || 'เกิดข้อผิดพลาด'}`
        }
    }
}

/**
 * Get Order By ID - FIXED VERSION
 * 
 * FIXES:
 * - Added direct taxInvoice relation join
 * - Normalized company/companyName
 * - Preserved job fetching workaround for stability
 */
export const getOrderById = async (id) => {
    if (!supabase) return null
    try {
        console.log('[getOrderById] Fetching order:', id)

        // 1. Fetch Order with Relations
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:customers(id, name, phone, email, line, facebook, instagram, addresses:customer_addresses(*), contacts:customer_contacts(*), taxInvoices:customer_tax_invoices(*)),
                purchaserContact:customer_contacts!purchaser_contact_id(*),
                receiverContact:customer_contacts!receiver_contact_id(*),
                taxInvoice:customer_tax_invoices!tax_invoice_id(*),
                taxInvoiceDeliveryAddress:customer_addresses!tax_invoice_delivery_address_id(*),
                deliveryAddress:customer_addresses!delivery_address_id(*),
                items:order_items(*, jobs(*, siteAddressRecord:site_address_id(*), siteInspectorRecord:site_inspector_id(*)), product:products(name, description, product_code), variant:product_variants!product_variant_id(*)),
                paymentSchedule:order_payments(*)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('[getOrderById] Error fetching order:', error)
            throw error
        }

        // 2. Fetch Jobs Separately (Workaround for depth/consistency)
        const { data: allJobs, error: jobsError } = await supabase
            .from('jobs')
            .select(`
                *,
                siteAddressRecord:site_address_id(*),
                siteInspectorRecord:site_inspector_id(*)
            `)
            .eq('order_id', id)
            .order('created_at', { ascending: true })

        if (jobsError) {
            console.error('[getOrderById] Error fetching jobs separately:', jobsError)
        }

        // 3. Map Jobs to Items & Normalize Keys
        const jobsByItemId = {}

        // Helper to format date for input type="datetime-local" (YYYY-MM-DDThh:mm)
        const formatDateForInput = (dateStr) => {
            if (!dateStr) return ''
            try {
                // If it's already in correct format, return it
                if (dateStr.includes('T') && dateStr.length >= 16) {
                    return dateStr.slice(0, 16)
                }

                // Handle Postgres format "2025-12-27 19:22:00+00"
                const d = new Date(dateStr)
                if (isNaN(d.getTime())) return ''

                // Get local ISO string
                // Note: toISOString() returns UTC. We want local time for datetime-local input.
                // Or we can just simplisticly replace space with T if we trust the string representation
                // But timezone conversion is safer.

                // Adjust to local timezone
                const offset = d.getTimezoneOffset() * 60000
                const localISOTime = (new Date(d - offset)).toISOString().slice(0, -1)

                return localISOTime.slice(0, 16)
            } catch (e) {
                return ''
            }
        }

        const normalizeJob = (job) => ({
            ...job,
            jobType: job.job_type || job.jobType || 'installation',
            team: job.assigned_team || job.team || '',
            // FIX: Format dates for datetime-local input
            appointmentDate: formatDateForInput(job.appointment_date || job.appointmentDate),
            completionDate: formatDateForInput(job.completion_date || job.completionDate),

            description: job.notes || job.description || '', // Map notes to description for UI
            notes: job.notes || '',
            serviceFeeId: job.team_payment_batch_id || job.serviceFeeId,

            // Location
            installLocationId: job.site_address_id || job.installLocationId,
            installLocationName: job.siteAddressRecord?.label || job.install_location_name || '',
            installAddress: job.siteAddressRecord?.address || job.install_address || '',
            googleMapLink: job.siteAddressRecord?.google_maps_link || job.google_map_link || '',
            distance: job.siteAddressRecord?.distance || job.distance || '',

            // Inspector
            inspector1: job.siteInspectorRecord ? {
                id: job.siteInspectorRecord.id,
                name: job.siteInspectorRecord.name,
                phone: job.siteInspectorRecord.phone,
                email: job.siteInspectorRecord.email,
                lineId: job.siteInspectorRecord.line_id,
                position: job.siteInspectorRecord.position,
                note: job.siteInspectorRecord.note
            } : null
        })

        if (allJobs && allJobs.length > 0) {
            allJobs.forEach(rawJob => {
                const job = normalizeJob(rawJob) // Normalize here

                if (rawJob.order_item_id) {
                    const itemIdKey = String(rawJob.order_item_id).toLowerCase().trim().replace(/\s+/g, '')
                    if (!jobsByItemId[itemIdKey]) {
                        jobsByItemId[itemIdKey] = []
                    }
                    jobsByItemId[itemIdKey].push(job)
                }
            })
        }

        // 4. Transform Items & Inject Jobs
        if (data.items) {
            data.items = data.items.map(item => {
                const itemIdKey = String(item.id).toLowerCase().trim().replace(/\s+/g, '')

                // Use separate jobs query if available, otherwise fallback to join
                let itemJobs = jobsByItemId[itemIdKey]
                if (!itemJobs || itemJobs.length === 0) {
                    // Fallback to the nested join data if available, but normalize them
                    itemJobs = (item.jobs || []).map(normalizeJob)
                }

                return {
                    ...item,
                    jobs: itemJobs
                }
            })
        }

        // 5. Normalize Tax Invoice
        let normalizedTaxInvoice = null
        if (data.taxInvoice) {
            normalizedTaxInvoice = {
                ...data.taxInvoice,
                // CRITICAL FIX: Ensure 'company' key exists
                company: data.taxInvoice.company || data.taxInvoice.companyName || ''
            }
        }

        // 6. Return Enhanced Order Object
        return {
            ...data,
            items: data.items, // With injected jobs
            jobs: allJobs || [], // Attach all jobs for UI loading
            taxInvoice: normalizedTaxInvoice,
            // Helper for UI to check status easily
            status: calculateOrderStatus(data.items)
        }

    } catch (error) {
        console.error('[getOrderById] CRITICAL ERROR:', error)
        return null
    }
}
// Job Functions (Migrated to JobManager)
export const getJobs = JobManager.getJobs
export const getJobById = JobManager.getJobById
export const updateJob = JobManager.saveJob
export const getNextJobId = JobManager.getNextJobId
export const saveJob = JobManager.saveJob
export const getJobsRaw = JobManager.getJobs
export const getJobCompletion = JobManager.getJobCompletion
export const saveJobCompletion = JobManager.saveJobCompletion



/**
 * Get All Orders
 */
export const getOrders = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
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
                    product:products(name, description, product_code), 
                    variant:product_variants!product_variant_id(*)
                ),
                paymentSchedule:order_payments(*)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data.map(o => ({
            id: o.id,
            customerId: o.customer_id,
            date: o.created_at,
            orderDate: o.order_date,
            createdAt: o.created_at,
            status: calculateOrderStatus(o.items),
            customer: o.customer?.name || 'Unknown Customer',
            customerName: o.customer?.name || 'Unknown Customer',
            customerPhone: o.customer?.phone || '',
            customerEmail: o.customer?.email || '',
            // Job Summary from first item
            jobType: o.items?.[0]?.jobs?.[0]?.job_type || '-',
            jobStatus: o.items?.[0]?.jobs?.[0]?.status || '-',
            items: o.items || [],
            total: Number(o.total || 0),
            // Map legacy fields if needed
            ...o
        }))
    } catch (error) {
        console.error('Error in getOrders:', error)
        return []
    }
}

/**
 * Get Orders by Customer ID
 */
export const getOrdersByCustomerId = async (customerId) => {
    if (!supabase || !customerId) return []
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*') // Basic select for history list, detail view will use getOrderById
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error getting orders by customer:', error)
        return []
    }
}
