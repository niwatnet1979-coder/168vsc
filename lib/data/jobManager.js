import { supabase } from '../supabaseClient'
import { calculateDistance, extractCoordinates, SHOP_LAT, SHOP_LON } from '../utils'

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
    if (typeof window !== 'undefined') {
        try {
            const res = await fetch(`/api/resolve-maps?url=${encodeURIComponent(mapLink)}`)
            const data = await res.json()
            if (data.distance) return data.distance
        } catch (e) {
            console.warn('[JobManager] API resolution failed:', e)
        }
    }

    return ''
}

export const JobManager = {
    /**
     * Get all jobs
     */
    getJobs: async () => {
        if (!supabase) return []
        try {
            console.log('[getJobs] Fetching from jobs table...')
            // Note: In strict mode, we should fetch from 'jobs' table directly.
            // But the legacy code was fetching from 'jobs' view or table which had complex joins.
            // Based on backup, it selects from 'jobs' table which seems to be a VIEW or has foreign keys.

            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    order:orders!order_id (
                        id, customer_id,
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

            // Map jobs asynchronously to resolve distances
            return await Promise.all(data.map(async job => {
                // Resolve Product
                const product = job.orderItem?.product
                const variant = job.orderItem?.variant
                const productName = product?.name || job.product_name || 'สินค้าไม่ระบุ'
                const productImage = variant?.image_url || job.product_image_url || null
                const productId = product?.product_code || job.orderItem?.product_id || '-'

                // Resolve Customer
                const customer = job.order?.customer
                const customerName = customer?.name || '-'
                const customerPhone = customer?.phone || '-'

                // Resolve Distance
                const distance = await getOrCalculateDistance(
                    job.siteAddressRecord?.distance,
                    job.siteAddressRecord?.maps || job.siteAddressRecord?.google_maps_link || job.google_map_link
                )

                return {
                    uniqueId: job.id, // Legacy compat
                    id: job.id,
                    orderId: job.order_id,
                    // orderNumber: job.order?.order_number, // REMOVED

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
                    googleMapLink: job.siteAddressRecord?.maps || job.siteAddressRecord?.google_maps_link || job.google_map_link || '',
                    distance: distance, // Updated distance

                    // Inspector
                    inspectorName: job.siteInspectorRecord?.name || job.site_inspector_name || '-',
                    inspectorPhone: job.siteInspectorRecord?.phone || '-',

                    // Notes
                    notes: job.job_notes || '-',

                    // Refs
                    siteAddressRecord: job.siteAddressRecord,
                    siteInspectorRecord: job.siteInspectorRecord,

                    // Extra for UI
                    isOverdue: false, // Calculated in UI
                    isToday: false    // Calculated in UI
                }
            }))
        } catch (error) {
            console.error('Error fetching jobs:', error)
            return []
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
                // job_time: jobData.jobTime, // Not standard column in order_items yet?
                assigned_team: jobData.assignedTeam,
                status: jobData.status,
                job_notes: jobData.notes, // Map notes -> job_notes
                completion_date: jobData.completionDate, // if passed
            }

            // If technician updates inspector, we should handle it (future phase)

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

    /**
     * Get Job Completion Data
     */
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

    /**
     * Save Job Completion Data
     */
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

    // Legacy support mapping
    getJobById: async (jobId) => {
        // Not implemented in backup either (it was just getting from all jobs?)
        // Implementing simple fetch
        // For now returning null or implementing if critical
        return null
    }
}
