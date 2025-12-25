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

/**
 * Helper: Validate UUID with type checking
 */
const validUUID = (id) => {
    if (!id) return null
    if (typeof id !== 'string') {
        console.warn(`[validUUID] Non-string ID: ${typeof id}`)
        return null
    }
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUUID) {
        console.warn(`[validUUID] Invalid UUID nulled: ${id}`)
        return null
    }
    return id
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
        let orderNumber = orderData.order_number || orderData.orderNumber

        const isNewOrder = !orderId || !isUUID(orderId)

        if (isNewOrder) {
            if (orderId && typeof orderId === 'string' && orderId.startsWith('OD')) {
                orderNumber = orderId
            }
            orderId = undefined
        }

        const orderPayload = {
            ...(orderId ? { id: orderId } : {}),
            order_number: orderNumber,
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
            discount_value: Number(orderData.discount?.value || 0)
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

// Re-export other functions from backup (to be refactored later)
import { DataManager as BackupDM } from '../dataManager.backup'

export const getNextOrderNumber = BackupDM.getNextOrderNumber
export const getOrders = BackupDM.getOrders
export const getOrdersByCustomerId = BackupDM.getOrdersByCustomerId
export const getOrderById = BackupDM.getOrderById
export const getJobs = BackupDM.getJobs
export const getJobById = BackupDM.getJobById
export const updateJob = BackupDM.updateJob
export const getNextJobId = BackupDM.getNextJobId
export const saveJob = BackupDM.saveJob
export const getJobsRaw = BackupDM.getJobsRaw
export const getJobCompletion = BackupDM.getJobCompletion
export const saveJobCompletion = BackupDM.saveJobCompletion
export const getSettings = BackupDM.getSettings
export const saveSettings = BackupDM.saveSettings
