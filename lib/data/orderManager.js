/**
 * Order Manager
 * Handles orders, jobs, and related operations
 */

import { supabase } from '../supabaseClient'
import { calculateOrderStatus, _withRetry } from './helpers'
import * as DataManager from '../dataManager'
import {
    calculateDistance,
    extractCoordinates,
    SHOP_LAT,
    SHOP_LON
} from '../utils'
import { uploadSignature } from './uploadManager'
import { JobManager } from './jobManager'

/**
 * Helper: Validate UUID with type checking
 */
const validUUID = (id) => {
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
 * Save Order
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
            customer_id: validUUID(orderData.customer?.id),
            purchaser_contact_id: validUUID(orderData.purchaserContact?.id),
            receiver_contact_id: validUUID(orderData.receiverContact?.id),
            tax_invoice_id: validUUID(orderData.taxInvoice?.id),
            order_date: orderData.date instanceof Date ? orderData.date.toISOString().split('T')[0] : orderData.date,
            total: orderData.total,
            shipping_fee: orderData.shippingFee,
            vat_rate: 0.07,
            job_type: orderData.jobInfo?.job_type || orderData.jobInfo?.jobType || null,
            discount_mode: orderData.discount?.mode || 'percent',
            discount_value: Number(orderData.discount?.value || 0),
            tax_invoice_delivery_address_id: validUUID(orderData.taxInvoiceDeliveryAddress?.id),
            delivery_address_id: validUUID(orderData.deliveryAddress?.id)
        }

        // 2. Upsert Order Header
        console.log('[saveOrder] Upserting order...')

        const { data: savedOrder, error: orderError } = await _withRetry(
            'saveOrder:upsertOrder',
            async () => {
                console.log('[saveOrder] Payload:', JSON.stringify(orderPayload, null, 2))
                return await supabase
                    .from('orders')
                    .upsert(orderPayload)
                    .select()
                    .single()
            }
        )

        if (orderError) {
            console.error('[saveOrder] Order upsert failed:', orderError)

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

            return {
                success: false,
                message: `บันทึกออเดอร์ไม่สำเร็จ: ${orderError.message || 'เกิดข้อผิดพลาด'}`,
                error: orderError
            }
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

            return {
                success: false,
                message: `บันทึกรายการสินค้าไม่สำเร็จ: ${itemsError.message || 'เกิดข้อผิดพลาด'}`,
                error: itemsError
            }
        }

        // FIX: Improved orphan deletion - handle empty array
        const currentItemIds = itemsPayload.map(i => i.id)

        if (currentItemIds.length > 0) {
            // =================================================================
            // ORPHAN CLEANUP (PARTIAL DELETE)
            // =================================================================

            // FIXED STRATEGY: Fetch all items and diff in JS to avoid 400 Bad Request on .not('in') query
            // 1. Identify Orphan Items
            const { data: allExistingItems } = await supabase
                .from('order_items')
                .select('id')
                .eq('order_id', finalOrderId)

            const existingIds = allExistingItems?.map(i => i.id) || []
            console.log('[saveOrder Debug] Current Item IDs (from Payload):', currentItemIds)
            console.log('[saveOrder Debug] Existing DB IDs:', existingIds)

            // Filter out items that are in the current payload (kept items)
            const orphanItemIds = existingIds.filter(dbId => !currentItemIds.includes(dbId))
            console.log('[saveOrder Debug] Calculated Orphan IDs:', orphanItemIds)

            if (orphanItemIds.length > 0) {
                console.log('[saveOrder] Processing orphan cleanup for items:', orphanItemIds)

                // 2. Identify Dependent Jobs
                const { data: dependentJobs } = await supabase
                    .from('jobs')
                    .select('id')
                    .in('order_item_id', orphanItemIds)

                const dependentJobIds = dependentJobs?.map(j => j.id) || []

                if (dependentJobIds.length > 0) {
                    // 3. Delete Service Fee Links (Grand-child)
                    console.log('[saveOrder] Cleaning up service fee links for jobs:', dependentJobIds)
                    await supabase
                        .from('team_service_fee_jobs')
                        .delete()
                        .in('job_id', dependentJobIds)

                    // 4. Delete Jobs (Child)
                    console.log('[saveOrder] Deleting orphan jobs:', dependentJobIds)
                    await supabase
                        .from('jobs')
                        .delete()
                        .in('id', dependentJobIds)
                }

                // 5. Delete Items (Parent)
                const { error: deleteOrphanError } = await supabase
                    .from('order_items')
                    .delete()
                    .in('id', orphanItemIds)

                if (deleteOrphanError) {
                    console.error('[saveOrder] CRITICAL: Failed to delete orphan items:', deleteOrphanError)
                }
            }
        } else {
            // =================================================================
            // DELETE ALL ITEMS (COMPLETE WIPE)
            // =================================================================
            console.log('[saveOrder] Deleting ALL items for order:', finalOrderId)

            // 1. Identify ALL Jobs for this order
            const { data: allOrderJobs } = await supabase
                .from('jobs')
                .select('id')
                .eq('order_id', finalOrderId)

            const allJobIds = allOrderJobs?.map(j => j.id) || []

            if (allJobIds.length > 0) {
                // 2. Delete ALL Service Fee Links
                await supabase
                    .from('team_service_fee_jobs')
                    .delete()
                    .in('job_id', allJobIds)

                // 3. Delete ALL Jobs
                await supabase
                    .from('jobs')
                    .delete()
                    .in('id', allJobIds)
            }

            // 4. Delete ALL Items
            await supabase
                .from('order_items')
                .delete()
                .eq('order_id', finalOrderId)
        }

        // 4. Save Jobs
        const allJobsPayload = []

        for (const itemWithId of itemsWithIds) {
            let itemJobs = [...(itemWithId.jobs || [])]

            if (itemJobs.length === 0) {
                itemJobs = [{
                    jobType: 'installation',
                    status: 'รอดำเนินการ',
                    sequence_number: 1
                }]
            }

            for (const job of itemJobs) {
                // Calculate Distance Logic
                let finalDistance = job.distance;
                const mapLink = job.googleMapLink || job.google_map_link || job.maps;

                if (!finalDistance && mapLink) {
                    try {
                        // 1. Try Regex
                        let coords = extractCoordinates(mapLink)

                        // 2. Try API (only if running in browser)
                        if (!coords && typeof window !== 'undefined') {
                            const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(mapLink)}`)
                            if (res.ok) {
                                const data = await res.json()
                                // Use server-calculated distance if available
                                if (data.distanceNumeric) {
                                    finalDistance = Math.round(data.distanceNumeric)
                                    console.log(`[saveOrder] Used API calculated distance: ${finalDistance}`)
                                }
                                else if (data.url) {
                                    coords = extractCoordinates(data.url)
                                }
                            }
                        }

                        if (coords && !finalDistance) {
                            // FIX: calculateDistance now returns rounded number
                            finalDistance = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
                            console.log(`[saveOrder] Calculated distance for job: ${finalDistance}`)
                        }
                    } catch (e) {
                        console.warn('[saveOrder] Failed to calculate distance:', e)
                    }
                }

                const payload = {
                    id: validUUID(job.id) || crypto.randomUUID(),
                    order_item_id: itemWithId._finalId,
                    order_id: finalOrderId,
                    job_type: job.jobType || job.job_type || 'installation',
                    status: job.status || 'รอดำเนินการ',
                    team: job.team || job.assigned_team || null,
                    appointment_date: job.appointmentDate || job.appointment_date || null,
                    completion_date: job.completionDate || job.completion_date || null,
                    notes: job.notes || job.description || null,
                    location_id: validUUID(job.locationId || job.installLocationId || job.site_address_id),
                    inspector_id: validUUID(job.inspector?.id || job.inspectorId || job.inspector1?.id || job.site_inspector_id),
                    team_payment_id: validUUID(job.teamPaymentId || job.serviceFeeId || job.team_payment_batch_id),
                    created_at: job.created_at || new Date().toISOString()
                    // distance: finalDistance, // REMOVED: Column does not exist in 'jobs' table
                    // google_map_link: mapLink || null // REMOVED: Column does not exist in 'jobs' table
                }

                allJobsPayload.push(payload)
            }
        }

        if (allJobsPayload.length > 0) {
            const { data: createdJobs, error: jobsError } = await supabase
                .from('jobs')
                .upsert(allJobsPayload)
                .select()

            if (jobsError) {
                console.error('[saveOrder] Jobs upsert failed:', jobsError)
                return {
                    success: false,
                    message: `บันทึกใบงานไม่สำเร็จ: ${jobsError.message || 'เกิดข้อผิดพลาด'}`,
                    error: jobsError
                }
            }

            // Sync service fee links
            const serviceFeeLinks = createdJobs
                ?.filter(job => job.team_payment_id)
                .map(job => ({
                    service_fee_id: job.team_payment_id,
                    job_id: job.id
                })) || []

            if (serviceFeeLinks.length > 0) {
                await supabase
                    .from('team_service_fee_jobs')
                    .upsert(serviceFeeLinks, { onConflict: 'service_fee_id, job_id', ignoreDuplicates: true })
            }
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
                return {
                    success: false,
                    message: `บันทึกข้อมูลการชำระเงินไม่สำเร็จ: ${insertPaymentError.message || 'เกิดข้อผิดพลาด'}`,
                    error: insertPaymentError
                }
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
                items:order_items(*, jobs(*, siteAddressRecord:location_id(*), siteInspectorRecord:inspector_id(*)), product:products(uuid, name, description, product_code), variant:product_variants!product_variant_id(*)),
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
                siteAddressRecord:location_id(*),
                siteInspectorRecord:inspector_id(*)
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

        // Helper to reconstruct address string from components
        const formatAddressObj = (addr) => {
            if (!addr) return ''

            const p = []
            // Map both legacy and new DB field names
            const num = addr.number || addr.addrNumber || addr.house_number
            const moo = addr.villageno || addr.addrMoo || addr.village_no
            const building = addr.building || addr.village || addr.addrVillage
            const soi = addr.lane || addr.addrSoi || addr.soi
            const road = addr.road || addr.addrRoad
            const subdistrict = addr.subdistrict || addr.sub_district || addr.addrTambon
            const district = addr.district || addr.addrAmphoe
            const province = addr.province || addr.addrProvince
            const zip = addr.zipcode || addr.addrZipcode || addr.postal_code || addr.postcode

            if (num) p.push(`เลขที่ ${num}`)
            if (moo) p.push(`หมู่ ${moo}`)
            if (building) p.push(building)
            if (soi) p.push(`ซอย ${soi}`)
            if (road) p.push(`ถนน ${road}`)
            if (subdistrict) p.push(`ตำบล ${subdistrict}`)
            if (district) p.push(`อำเภอ ${district}`)
            if (province) p.push(`จังหวัด ${province}`)
            if (zip) p.push(zip)

            const result = p.join(' ')
            if (result) return result

            // Fallback to 'address' string if no components exist
            if (addr.address && typeof addr.address === 'string') return addr.address

            return ''
        }

        // Helper to get or calculate distance - ASYNC
        const getOrCalculateDistance = async (dist, mapLink) => {
            if (dist) return dist
            if (!mapLink) return ''

            // 1. Try regex extraction first (Sync, Fast)
            const coords = extractCoordinates(mapLink)
            if (coords) {
                return calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon) + ' km'
            }

            // 2. Try server-side resolution if enabled and running on client (Async, Slow)
            // NOTE: Disabled/Removed legacy synchronous API call that caused slowdowns.
            // We now rely on 'Calculate on Save' strategy or simple regex extraction here.

            return ''
        }

        const normalizeJob = async (job) => {
            // FIX: Use saved distance from DB directly if available
            // This prevents re-calculation/overwriting with empty string
            let distance = job.distance || job.siteAddressRecord?.distance || ''

            // Only convert to string if it's a number (it might be numeric in DB now)
            if (typeof distance === 'number') {
                distance = `📍 ${Math.round(distance)} km`
            }

            // Fallback: Calculate if missing (and map link exists)
            if (!distance) {
                distance = await getOrCalculateDistance(
                    null, // Pass null as we already checked job/site distance
                    job.siteAddressRecord?.maps || job.siteAddressRecord?.google_maps_link || job.google_map_link
                )
            }

            return {
                ...job,
                jobType: job.job_type || job.jobType || 'installation',
                team: job.assigned_team || job.team || '',
                // FIX: Format dates for datetime-local input
                appointmentDate: formatDateForInput(job.appointment_date || job.appointmentDate),
                completionDate: formatDateForInput(job.completion_date || job.completionDate),

                description: job.notes || job.description || '', // Map notes to description for UI
                notes: job.notes || '',
                teamPaymentId: job.teamPaymentId || job.team_payment_id || job.serviceFeeId || job.team_payment_batch_id,
                serviceFeeId: job.team_payment_id || job.serviceFeeId, // Keep for legacy

                // Location
                locationId: job.locationId || job.location_id || job.site_address_id || job.installLocationId,
                installLocationId: job.location_id || job.site_address_id || job.installLocationId, // Keep for legacy
                installLocationName: job.siteAddressRecord?.label || job.install_location_name || '',
                installAddress: formatAddressObj(job.siteAddressRecord) || job.install_address || '',
                googleMapLink: job.siteAddressRecord?.maps || job.siteAddressRecord?.google_maps_link || job.google_map_link || '',
                distance: distance,

                // Inspector
                inspector: job.siteInspectorRecord ? {
                    id: job.siteInspectorRecord.id,
                    name: job.siteInspectorRecord.name,
                    phone: job.siteInspectorRecord.phone,
                    email: job.siteInspectorRecord.email,
                    line: job.siteInspectorRecord.line || job.siteInspectorRecord.lineId || job.siteInspectorRecord.line_id, // Standardized property 'line'
                    position: job.siteInspectorRecord.position,
                    note: job.siteInspectorRecord.note
                } : null
            }
        }

        if (allJobs && allJobs.length > 0) {
            // Process jobs in parallel
            const normalizedJobs = await Promise.all(allJobs.map(normalizeJob))

            normalizedJobs.forEach(job => {
                if (job.order_item_id) {
                    const itemIdKey = String(job.order_item_id).toLowerCase().trim().replace(/\s+/g, '')
                    if (!jobsByItemId[itemIdKey]) {
                        jobsByItemId[itemIdKey] = []
                    }
                    jobsByItemId[itemIdKey].push(job)
                }
            })
        }

        // 4. Transform Items & Inject Jobs
        if (data.items) {
            data.items = await Promise.all(data.items.map(async item => {
                const itemIdKey = String(item.id).toLowerCase().trim().replace(/\s+/g, '')

                // Use separate jobs query if available
                let itemJobs = jobsByItemId[itemIdKey]

                if (!itemJobs || itemJobs.length === 0) {
                    // Fallback to the nested join data if available
                    // Must normalize these too
                    const rawJobs = item.jobs || []
                    itemJobs = await Promise.all(rawJobs.map(normalizeJob))
                }

                return {
                    ...item,
                    jobs: itemJobs
                }
            }))
        }

        // 5. Format Addresses for UI (Reconstruct from components) AND Calculate Distance
        if (data.taxInvoiceDeliveryAddress) {
            data.taxInvoiceDeliveryAddress.address = formatAddressObj(data.taxInvoiceDeliveryAddress)
            data.taxInvoiceDeliveryAddress.distance = await getOrCalculateDistance(
                data.taxInvoiceDeliveryAddress.distance,
                data.taxInvoiceDeliveryAddress.maps || data.taxInvoiceDeliveryAddress.google_maps_link
            )
        }
        if (data.deliveryAddress) {
            data.deliveryAddress.address = formatAddressObj(data.deliveryAddress)
            data.deliveryAddress.distance = await getOrCalculateDistance(
                data.deliveryAddress.distance,
                data.deliveryAddress.maps || data.deliveryAddress.google_maps_link
            )
        }

        // 5. Normalize Tax Invoice
        let normalizedTaxInvoice = null
        if (data.taxInvoice) {
            normalizedTaxInvoice = {
                ...data.taxInvoice,
                // CRITICAL FIX: Ensure 'company' key exists
                company: data.taxInvoice.company || data.taxInvoice.companyName || '',
                // FIX: Construct address from components if possible to avoid cached truncated strings
                address: formatAddressObj(data.taxInvoice)
            }
        }

        // 6. Normalize Payment Schedule
        if (data.paymentSchedule) {
            data.paymentSchedule = data.paymentSchedule.map(p => ({
                ...p,
                date: p.payment_date || p.date || null,
                paymentMethod: p.payment_method || p.paymentMethod || null,
                type: p.payment_type || p.type || 'deposit',
                amount: Number(p.amount || 0),
                invoiceNo: p.invoice_no || p.invoiceNo || null,
                invoiceDate: p.invoice_date || p.invoiceDate || null,
                receiptNo: p.receipt_no || p.receiptNo || null,
                receiptDate: p.receipt_date || p.receiptDate || null,
                slip: p.proof_url || p.slip || null,
                receiverSignature: p.receiver_signature || p.receiverSignature || null,
                payerSignature: p.payer_signature || p.payerSignature || null,
                status: p.status || 'Completed'
            }))
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
                        siteAddressRecord:location_id(*), 
                        siteInspectorRecord:inspector_id(*)
                    ), 
                    product:products(uuid, name, description, product_code), 
                    variant:product_variants!product_variant_id(*)
                ),
                paymentSchedule:order_payments(*)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return data.map(o => ({
            ...o,
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
            total: Number(o.total || 0)
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
