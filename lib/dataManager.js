import { supabase } from './supabaseClient'

/**
 * DataManager - Promisified Data Access Layer for 168VSC
 * Fetches data from Supabase and maps snake_case DB columns to camelCase app properties.
 */
export const DataManager = {
    // Export supabase for Realtime subscriptions
    supabase,

    // --- Master Data Access ---

    getCustomers: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
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
                contacts: (Array.isArray(c.contacts) ? c.contacts : []).filter(Boolean),
                taxInvoices: (Array.isArray(c.tax_invoices) ? c.tax_invoices : []).filter(Boolean),
                addresses: (Array.isArray(c.addresses) ? c.addresses : []).filter(Boolean)
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
                .select('*')
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
                contacts: (Array.isArray(data.contacts) ? data.contacts : []).filter(Boolean),
                taxInvoices: (Array.isArray(data.tax_invoices) ? data.tax_invoices : []).filter(Boolean),
                addresses: (Array.isArray(data.addresses) ? data.addresses : []).filter(Boolean)
            }
        } catch (error) {
            console.error('Error fetching customer by ID:', error)
            return null
        }
    },

    getProducts: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')

            if (error) throw error

            return data.map(p => ({
                // Support both old (id) and new (uuid) schema
                uuid: p.uuid,  // New UUID primary key
                id: p.uuid || p.id,  // Use uuid if available, fallback to old id
                product_code: p.product_code || p.id,  // Human-readable code
                name: p.name,
                category: p.category,
                subcategory: p.subcategory,
                price: p.price,
                stock: p.stock,
                description: p.description,
                material: p.material,
                color: p.color,
                length: p.length,
                width: p.width,
                height: p.height,
                dimensions: p.dimensions,
                variants: p.variants || [],
                // App expects 'images' array, but DB has 'image_url' string
                images: p.image_url ? [p.image_url] : [],
                image_url: p.image_url
            }))
        } catch (error) {
            console.error('Error fetching products:', error)
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
                    fullname: e.fullname,
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
                // fullname is now a GENERATED column - don't send it
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
                // Fetch order items and the product name for each item
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            return data.map(o => ({
                id: o.id,
                customerId: o.customer_id,
                // Map properties to match what UI/Reports expect
                date: o.created_at, // Use created_at as main date
                orderDate: o.order_date, // Keep original if needed
                createdAt: o.created_at,
                status: o.status,
                // Customer info
                customer: o.customer_name || 'Unknown', // Use customer_name from DB
                customerName: o.customer_name || 'Unknown',
                customerId: o.customer_id,
                // Job info
                jobType: o.job_info?.jobType || '-',
                // Financial info
                totalAmount: o.total || 0, // Use total from database
                deposit: o.payment_schedule?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
                items: (o.items || []).map(i => ({
                    id: i.id,
                    name: i.product?.name || i.product_name || 'Unknown Product', // Handle both relation and explicit name
                    qty: i.quantity,
                    price: i.price,
                    total: i.total_price
                }))
            }))
        } catch (error) {
            console.error('Error fetching orders:', error)
            return []
        }
    },

    getOrderById: async (id) => {
        if (!supabase) return null
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) return null

            // Map to application structure
            return {
                id: data.id,
                date: data.order_date,
                customer: data.customer_details,
                customerDetails: data.customer_details,
                status: data.status,
                shippingFee: data.shipping_fee || 0,
                discount: data.discount || { mode: 'percent', value: 0 },
                items: data.items || [],
                jobInfo: data.job_info || {},
                taxInvoice: data.tax_invoice_info || {},
                taxInvoiceDeliveryAddress: data.delivery_address_info || {},
                selectedContact: data.selected_contact || null,
                activeCustomerContact: data.selected_contact || null,
                paymentSchedule: data.payment_schedule || [],
                note: data.note || ''
            }
        } catch (error) {
            console.error('Error fetching order by ID:', error)
            return null
        }
    },

    getOrdersByCustomerId: async (customerId) => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })

            if (error) throw error

            return data.map(o => ({
                id: o.id,
                customerId: o.customer_id,
                date: o.created_at,
                totalAmount: o.total_amount || o.total || 0,
                status: o.status,
                paymentSchedule: o.payment_schedule || []
            }))
        } catch (error) {
            console.error('Error fetching orders by customer ID:', error)
            return []
        }
    },

    getJobs: async () => {
        try {
            // Fetch jobs with related data
            // Note: Join with products removed due to FK mismatch (jobs.product_id stores Code vs products.id uses UUID)
            // We use product_snapshot for product details instead
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    customer:customers(*),
                    order:orders(*)
                `)
                .order('job_date', { ascending: true })

            if (error) throw error

            return data.map(job => {
                // Parse product snapshot safely
                let productSnapshot = job.product_snapshot
                if (typeof productSnapshot === 'string') {
                    try { productSnapshot = JSON.parse(productSnapshot) } catch (e) { }
                }

                // Extract product info from snapshot or fallbacks
                const productName = productSnapshot?.name || job.product_name || 'สินค้าไม่ระบุ'

                // Try to get image from snapshot variants or main image
                let productImage = null
                if (productSnapshot?.selectedVariant?.images && productSnapshot.selectedVariant.images.length > 0) {
                    productImage = productSnapshot.selectedVariant.images[0]
                } else if (productSnapshot?.images && productSnapshot.images.length > 0) {
                    productImage = productSnapshot.images[0]
                } else if (productSnapshot?.image) {
                    productImage = productSnapshot.image
                }

                // Extract address priority: Order Delivery Info > Job Address > Customer Address (if exists)
                let finalAddress = null
                if (job.order?.delivery_address_info) {
                    // Check if it's JSON string or object
                    let deliveryInfo = job.order.delivery_address_info
                    if (typeof deliveryInfo === 'string') {
                        try { deliveryInfo = JSON.parse(deliveryInfo) } catch (e) { }
                    }
                    finalAddress = deliveryInfo?.address || deliveryInfo?.label
                }

                if (!finalAddress) {
                    finalAddress = job.address || job.customer?.address || '-'
                }

                return {
                    id: job.id,
                    orderId: job.order_id,
                    customerId: job.customer_id,
                    productId: job.product_id, // This is Product Code (e.g. AA001)
                    jobType: job.job_type,
                    jobDate: job.job_date,
                    jobTime: job.job_time,
                    assignedTeam: job.assigned_team,
                    status: job.status,
                    address: finalAddress, // Use the resolved address

                    // App specific logic mapping
                    completionDate: job.completion_date,
                    signatureImage: job.signature_image_url,
                    notes: job.notes,

                    // Flattened / Joined Data
                    customer: job.customer || { name: 'Unknown' },
                    customerName: job.customer?.name || 'Unknown',

                    // Product from Snapshot
                    product: {
                        ...productSnapshot, // Include all original snapshot data (variants, options, etc.)
                        id: job.product_id,
                        name: productName,
                        image_url: productImage,
                        category: productSnapshot?.category,
                        height: productSnapshot?.dimensions?.height,
                        material: productSnapshot?.material,
                        color: productSnapshot?.selectedVariant?.color || productSnapshot?.color || productSnapshot?.crystalColor,
                        remark: (() => {
                            if (job.order?.items && Array.isArray(job.order.items)) {
                                const matchedItem = job.order.items.find(item => item.subJob?.jobId === job.id)
                                if (matchedItem) return matchedItem.note || matchedItem.remark || '-'
                            }
                            return productSnapshot?.remark || '-'
                        })()
                    },
                    productName: productName,
                    productImage: productImage,

                    order: job.order ? {
                        ...job.order,
                        paymentSchedule: job.order.payment_schedule || []
                    } : {}
                }
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
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    customer:customers(*),
                    order:orders(*)
                `)
                .eq('id', id) // Search by job ID (e.g. JB0000002)
                .single()

            if (error) throw error
            if (!data) return null

            const job = data

            // Parse product snapshot safely
            let productSnapshot = job.product_snapshot
            if (typeof productSnapshot === 'string') {
                try { productSnapshot = JSON.parse(productSnapshot) } catch (e) { }
            }

            // Extract product info from snapshot or fallbacks
            const productName = productSnapshot?.name || job.product_name || 'สินค้าไม่ระบุ'

            // Try to get image from snapshot variants or main image
            let productImage = null
            if (productSnapshot?.selectedVariant?.images && productSnapshot.selectedVariant.images.length > 0) {
                productImage = productSnapshot.selectedVariant.images[0]
            } else if (productSnapshot?.images && productSnapshot.images.length > 0) {
                productImage = productSnapshot.images[0]
            } else if (productSnapshot?.image) {
                productImage = productSnapshot.image
            }

            // Extract subJob info (Inspector, etc) from Order Items if available
            let subJobData = null
            if (job.order?.items && Array.isArray(job.order.items)) {
                // Find item that links to this job
                const matchedItem = job.order.items.find(item => item.subJob?.jobId === job.id)
                if (matchedItem) {
                    subJobData = matchedItem.subJob
                }
            }

            // Extract Inspector Name
            let inspectorName = '-'
            if (subJobData?.inspector1?.name) {
                inspectorName = subJobData.inspector1.name
                if (subJobData.inspector1.phone) inspectorName += ` (${subJobData.inspector1.phone})`
            }

            // Extract address priority: Order Delivery Info > Job Address > Customer Address (if exists)
            let finalAddress = null
            if (job.order?.delivery_address_info) {
                // Check if it's JSON string or object
                let deliveryInfo = job.order.delivery_address_info
                if (typeof deliveryInfo === 'string') {
                    try { deliveryInfo = JSON.parse(deliveryInfo) } catch (e) { }
                }
                finalAddress = deliveryInfo?.address || deliveryInfo?.label
            }

            if (!finalAddress) {
                finalAddress = job.address || job.customer?.address || '-'
            }

            return {
                id: job.id,
                uniqueId: job.id, // For compatibility
                orderId: job.order_id,
                customerId: job.customer_id,
                productId: job.product_id,
                jobType: job.job_type,
                rawJobType: job.job_type === 'ติดตั้ง' ? 'installation' : (job.job_type === 'ส่งของ' ? 'delivery' : job.job_type),
                jobDate: job.job_date,
                jobTime: job.job_time,
                assignedTeam: job.assigned_team,
                team: job.assigned_team || subJobData?.team, // Fallback to subJob team
                inspector: inspectorName, // Mapped Inspector
                status: job.status,
                address: finalAddress,

                // App specific logic mapping
                completionDate: job.completion_date,
                signatureImage: job.signature_image_url,
                notes: job.notes,
                description: job.notes, // For compatibility

                // Flattened / Joined Data
                customer: job.customer || { name: 'Unknown', phone: '-', address: '-' },
                customerName: job.customer?.name || 'Unknown',

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
                            const matchedItem = job.order.items.find(item => item.subJob?.jobId === job.id)
                            if (matchedItem) return matchedItem.note || matchedItem.remark || '-'
                        }
                        return productSnapshot?.remark || '-'
                    })()
                },
                productName: productName,
                productImage: productImage,

                order: job.order ? {
                    ...job.order,
                    paymentSchedule: job.order.payment_schedule || []
                } : {}
            }

        } catch (error) {
            console.error('Error fetching job:', error)
            return null
        }
    },

    // --- Data Modification Helpers ---

    saveCustomer: async (customerData) => {
        try {
            const dbPayload = {
                // If ID is missing, generate one (CUST-Timestamp-Random) to ensure uniqueness
                id: customerData.id || `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: customerData.name,
                phone: customerData.phone,
                email: customerData.email,
                line_id: customerData.line || customerData.lineId, // Handle both
                facebook: customerData.facebook,
                instagram: customerData.instagram,
                media_source: customerData.mediaSource,
                media_source_other: customerData.mediaSourceOther,
                // Save contacts as array (matches new DB schema)
                contacts: Array.isArray(customerData.contacts) ? customerData.contacts : [],
                // Ensure tax_invoices is an array or null
                tax_invoices: Array.isArray(customerData.taxInvoices) ? customerData.taxInvoices : [],
                addresses: Array.isArray(customerData.addresses) ? customerData.addresses : []
            }

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

            // Return mapped object to match getCustomers format
            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                lineId: c.line_id,
                line: c.line_id,
                facebook: c.facebook,
                instagram: c.instagram,
                mediaSource: c.media_source,
                mediaSourceOther: c.media_source_other,
                address: c.address,
                contacts: Array.isArray(c.contacts) ? c.contacts : [],
                taxInvoices: Array.isArray(c.tax_invoices) ? c.tax_invoices : [],
                addresses: Array.isArray(c.addresses) ? c.addresses : []
            }
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
            const dbPayload = {
                name: productData.name,
                category: productData.category,
                description: productData.description,
                material: productData.material,
                variants: productData.variants || []
            }

            // If editing existing product (has uuid), include it
            if (productData.uuid) {
                dbPayload.uuid = productData.uuid
            }

            // Set product_code (human-readable identifier) - REQUIRED field
            // Accept from either 'product_code' or 'id' (for backward compatibility)
            dbPayload.product_code = productData.product_code || productData.id

            // Ensure product_code exists (NOT NULL constraint)
            if (!dbPayload.product_code) {
                throw new Error('product_code is required')
            }

            const { data, error } = await supabase
                .from('products')
                .upsert(dbPayload)
                .select()

            if (error) throw error

            // Transform back to app format
            const p = data[0]
            if (!p) return null

            return {
                uuid: p.uuid,
                id: p.uuid || p.id,
                product_code: p.product_code || p.id,
                name: p.name,
                category: p.category,
                subcategory: p.subcategory,
                price: p.price,
                stock: p.stock,
                description: p.description,
                material: p.material,
                color: p.color,
                length: p.length,
                width: p.width,
                height: p.height,
                variants: p.variants || [],
                images: p.image_url ? [p.image_url] : []
            }
        } catch (error) {
            console.error('Error saving product:', error)
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
                .or(`uuid.eq.${productId},id.eq.${productId}`)
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
            return true
        } catch (error) {
            console.error('Error deleting product:', error)
            console.error('Error details:', error.message, error.code)
            return false
        }
    },

    saveOrder: async (orderData) => {
        try {
            console.log('[saveOrder] Starting save order process')
            console.log('[saveOrder] Payment schedule:', orderData.paymentSchedule)

            // 0. Upload payment signatures to storage (if any)
            let uploadedPaymentSchedule = orderData.paymentSchedule
            if (orderData.paymentSchedule && orderData.paymentSchedule.length > 0) {
                console.log(`[saveOrder] Processing ${orderData.paymentSchedule.length} payment(s)`)

                uploadedPaymentSchedule = await Promise.all(
                    orderData.paymentSchedule.map(async (payment, index) => {
                        console.log(`[saveOrder] Processing payment ${index}:`, {
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

                        console.log(`[saveOrder] Payment ${index} URLs:`, {
                            receiver: receiverUrl?.substring(0, 50) + '...',
                            payer: payerUrl?.substring(0, 50) + '...'
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
            const orderPayload = {
                id: orderData.id,
                customer_id: orderData.customer?.id,
                customer_name: orderData.customer?.name,
                // Optimized: Store only essential customer data (use customer_id to fetch full data)
                customer_details: orderData.customerDetails ? {
                    id: orderData.customerDetails.id,
                    name: orderData.customerDetails.name,
                    phone: orderData.customerDetails.phone,
                    email: orderData.customerDetails.email,
                    line: orderData.customerDetails.line,
                    facebook: orderData.customerDetails.facebook,
                    instagram: orderData.customerDetails.instagram,
                    mediaSource: orderData.customerDetails.mediaSource,
                    mediaSourceOther: orderData.customerDetails.mediaSourceOther
                    // Removed: contacts[], addresses[], taxInvoices[] - fetch from customers table via customer_id
                } : null,
                order_date: orderData.date,
                status: orderData.status || 'Pending',
                total: orderData.total, // Save total amount
                shipping_fee: orderData.shippingFee,
                discount: orderData.discount,
                vat_rate: 0.07,
                // Optimized: Remove Base64 images from items
                items: orderData.items.map(item => ({
                    ...item,
                    image: undefined // Remove base64 image - use product_id to fetch from products table
                })),
                job_info: orderData.jobInfo,
                tax_invoice_info: orderData.taxInvoice,
                delivery_address_info: orderData.taxInvoiceDeliveryAddress,
                selected_contact: orderData.selectedContact,
                // Optimized: Use uploaded signatures (URLs instead of Base64)
                payment_schedule: uploadedPaymentSchedule,
                note: orderData.note
            }

            // 2. Upsert Order
            const { error: orderError } = await supabase
                .from('orders')
                .upsert(orderPayload)

            if (orderError) throw orderError

            // 3. Handle Jobs (Relational)
            // 3. Create Jobs for each item
            const jobsPayload = orderData.items
                .filter(item => item.subJob && item.subJob.jobId)
                .map(item => {
                    // Define allowed fields for product_snapshot
                    const allowedFields = [
                        'code', 'product_code', 'product_id',
                        'name', 'category', 'material', 'description',
                        'qty', 'unitPrice', 'discount',
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

                    return {
                        id: item.subJob.jobId,
                        order_id: orderData.id,
                        customer_id: orderData.customer?.id,
                        customer_name: orderData.customer?.name,
                        product_id: item.code,
                        product_name: item.name,
                        product_snapshot: cleanSnapshot,
                        job_type: item.subJob.jobType || orderData.jobInfo?.jobType || 'installation',
                        job_date: item.subJob.appointmentDate || orderData.jobInfo?.appointmentDate || orderData.date,
                        completion_date: item.subJob.completionDate || orderData.jobInfo?.completionDate || null,
                        address: item.subJob.installAddress || orderData.jobInfo?.installAddress || orderData.customer?.address,
                        google_map_link: item.subJob.googleMapLink || orderData.jobInfo?.googleMapLink,
                        distance: item.subJob.distance || orderData.jobInfo?.distance || null,
                        assigned_team: item.subJob.team || orderData.jobInfo?.team || '-',
                        status: 'รอดำเนินการ',
                        notes: item.subJob.description || orderData.note || null,
                        created_at: new Date().toISOString()
                    }
                })

            if (jobsPayload.length > 0) {
                const { error: jobsError } = await supabase.from('jobs').upsert(jobsPayload)
                if (jobsError) console.error('Error saving jobs:', jobsError)
            }

            return true
        } catch (error) {
            console.error('Error saving order:', error)
            return false
        }
    },

    deleteOrder: async (id) => {
        if (!supabase) return false
        try {
            // Delete related jobs first
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
            alert(`ไม่สามารถลบได้: ${error.message || 'Unknown error'}`)
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
                return `OD${(num + 1).toString().padStart(7, '0')}`
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
                return `JB${(num + 1).toString().padStart(7, '0')}`
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
                job_date: jobData.jobDate,
                job_time: jobData.jobTime,
                assigned_team: jobData.assignedTeam,
                status: jobData.status,
                notes: jobData.notes,
                completion_date: jobData.completionDate, // if passed
                signature_image_url: jobData.signatureImage, // if passed
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

    // --- Settings Management ---

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
    }
}
