import { supabase } from './supabaseClient'

/**
 * DataManager - Promisified Data Access Layer for 168VSC
 * Fetches data from Supabase and maps snake_case DB columns to camelCase app properties.
 */
export const DataManager = {
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
                contact1: c.contact1 || { name: '', phone: '' },
                contact2: c.contact2 || { name: '', phone: '' },
                taxInvoices: c.tax_invoices || [],
                addresses: c.addresses || []
            }))
        } catch (error) {
            console.error('Error fetching customers:', error)
            return []
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
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                dimensions: p.dimensions,
                // App expects 'images' array, but DB has 'image_url' string
                images: p.image_url ? [p.image_url] : [],
                image_url: p.image_url
            }))
        } catch (error) {
            console.error('Error fetching products:', error)
            return []
        }
    },

    getTeams: async () => {
        if (!supabase) return []
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .order('name')

            if (error) throw error
            // Return full objects, not just names, so we can edit them
            return data.map(t => ({
                id: t.id,
                name: t.name,
                role: t.role,
                active: t.active,
                email: t.email,
                contact: t.contact
            }))
        } catch (error) {
            console.error('Error fetching teams:', error)
            return []
        }
    },

    saveTeam: async (teamData) => {
        try {
            const dbPayload = {
                id: teamData.id,
                name: teamData.name,
                role: teamData.role,
                active: teamData.active !== undefined ? teamData.active : true,
                email: teamData.email,
                contact: teamData.contact
            }

            // Let database handle ID generation for new teams if ID is likely temporary or empty
            if (!dbPayload.id || dbPayload.id.toString().startsWith('temp_')) {
                delete dbPayload.id
            }

            const { data, error } = await supabase
                .from('teams')
                .upsert(dbPayload)
                .select()

            if (error) throw error
            return data ? data[0] : null
        } catch (error) {
            console.error('Error saving team:', error)
            return null
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
            return data.map(e => ({
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
                incentiveRate: e.incentive_rate,
                citizenId: e.citizen_id,
                birthDay: e.birth_date,
                bank: e.bank_name,
                acNumber: e.account_number,
                status: e.status || 'current',
                photos: e.photos || {}
            }))
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
                fullname: empData.fullname,
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
                .select('*, customer:customers(*), items:order_items(*, product:products(name))')
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
                total: o.total_amount, // Alias for reports
                totalAmount: o.total_amount,
                deposit: o.deposit || 0,
                paidAmount: o.deposit || 0, // Fallback to deposit as paid amount
                // Joins
                customer: o.customer?.name || 'Unknown', // Flatten for reports
                customerName: o.customer?.name || 'Unknown',
                customerObj: o.customer, // Keep full object just in case
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
                .select('*, customer:customers(*), items:order_items(*, product:products(*))') // Fetch full product details for mapped items
                .eq('id', id)
                .single()

            if (error) throw error
            if (!data) return null

            // Map to application structure
            return {
                id: data.id,
                date: data.order_date || data.created_at,
                customer: data.customer,
                customerDetails: data.customer, // Map for UI
                total: data.total_amount,
                status: data.status,
                deposit: data.deposit_amount ? { mode: 'amount', value: data.deposit_amount } : { mode: 'percent', value: 50 }, // Default or map from DB if specific columns exist
                // Supabase doesn't store 'mode' by default unless we add JSON column or specific col. 
                // Assuming we stored simple columns for now.
                // Reconstruct items
                items: (data.items || []).map(i => ({
                    id: i.id,
                    name: i.product_name || i.product?.name,
                    qty: i.quantity,
                    unitPrice: i.price, // UI uses unitPrice? verify
                    price: i.price,
                    total: i.total_price,
                    productId: i.product_id,
                    product: i.product,
                    // Subjob data would need to be fetched from 'jobs' table if linked
                    subJob: {} // Placeholder, would need separate fetch or join on jobs if 1:1 with items
                })),
                // Other fields like taxInvoice, jobInfo might need JSON column in DB or separate relations
                // For now, mapping basic fields.
                // ERROR: The existing UI expects rich objects (taxInvoice etc)
                // If we haven't stored them in Supabase, we lose them.
                // We should check the 'orders' table schema for JSON columns?
                // The schema I created earlier had: tax_invoice_data, job_info_data, etc (JSONB)
                taxInvoice: data.tax_invoice_data || {},
                jobInfo: data.job_info_data || {},
                shippingFee: data.shipping_fee || 0,
                discount: data.discount_data || { mode: 'percent', value: 0 },
                note: data.notes,
                paymentSchedule: data.payment_schedule_data || [],
                activeCustomerContact: data.contact_data || null,
                selectedContact: data.contact_data || null,
                taxInvoiceDeliveryAddress: data.delivery_address_data || {}
            }
        } catch (error) {
            console.error('Error fetching order by ID:', error)
            return null
        }
    },

    getJobs: async () => {
        try {
            // Fetch jobs with related data
            // Note: Supabase joins require exact foreign key relationships in DB
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    customer:customers(*),
                    product:products(*),
                    order:orders(*)
                `)
                .order('job_date', { ascending: true })

            if (error) throw error

            return data.map(job => ({
                id: job.id,
                orderId: job.order_id,
                customerId: job.customer_id,
                productId: job.product_id,
                jobType: job.job_type,
                jobDate: job.job_date,
                jobTime: job.job_time,
                assignedTeam: job.assigned_team,
                status: job.status,
                address: job.customer?.address, // Default to customer address if job address not explicit
                // App specific logic mapping
                completionDate: job.completion_date,
                signatureImage: job.signature_image_url,
                notes: job.notes,

                // Flattened / Joined Data
                customer: job.customer || { name: 'Unknown' },
                customerName: job.customer?.name || 'Unknown',

                product: job.product || { name: 'Unknown' },
                productName: job.product?.name || 'Unknown',
                productImage: job.product?.image_url || null,

                order: job.order || {}
            }))
        } catch (error) {
            console.error('Error fetching jobs:', error)
            return []
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
                contact1: customerData.contact1,
                contact2: customerData.contact2,
                contacts: customerData.contacts, // Add the new contacts array
                tax_invoices: customerData.taxInvoices,
                addresses: customerData.addresses
            }

            const { data, error } = await supabase
                .from('customers')
                .upsert(dbPayload)
                .select()

            if (error) throw error
            return data ? data[0] : null
        } catch (error) {
            console.error('Error saving customer:', error)
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
                id: productData.id, // manual ID (text)
                name: productData.name,
                category: productData.category,
                subcategory: productData.subcategory,
                price: productData.price,
                stock: productData.stock,
                description: productData.description,
                material: productData.material,
                color: productData.color,
                dimensions: productData.dimensions, // maybe constructed from l/w/h?
                image_url: (productData.images && productData.images.length > 0) ? productData.images[0] : null,
                // If the app uses separate columns for l/w/h, we might need to verify schema.
                // Looking at schema v2: length, width, height columns EXIST.
                length: productData.length,
                width: productData.width,
                height: productData.height
            }

            const { data, error } = await supabase
                .from('products')
                .upsert(dbPayload)
                .select()

            if (error) throw error

            // Transform back to app format for immediate UI update if needed
            const p = data[0]
            if (!p) return null

            return {
                id: p.id,
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
                images: p.image_url ? [p.image_url] : []
            }
        } catch (error) {
            console.error('Error saving product:', error)
            return null
        }
    },

    deleteProduct: async (id) => {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting product:', error)
            return false
        }
    },

    saveOrder: async (orderData) => {
        try {
            // 1. Prepare Order Payload
            const orderPayload = {
                id: orderData.id,
                customer_id: orderData.customer?.id, // ID Link
                customer_name: orderData.customer?.name, // Snapshot
                customer_details: orderData.customerDetails, // Full Snapshot
                order_date: orderData.date,
                status: orderData.status,
                total_amount: orderData.total,
                deposit: orderData.deposit,
                shipping_fee: orderData.shippingFee,
                discount: orderData.discount,
                vat_rate: 0.07,
                items: orderData.items, // JSON Snapshot
                job_info: orderData.jobInfo,
                tax_invoice_info: orderData.taxInvoice,
                delivery_address_info: orderData.taxInvoiceDeliveryAddress,
                selected_contact: orderData.selectedContact,
                payment_schedule: orderData.paymentSchedule, // Array of payments
                note: orderData.note
            }

            // 2. Upsert Order
            const { error: orderError } = await supabase
                .from('orders')
                .upsert(orderPayload)

            if (orderError) throw orderError

            // 3. Handle Order Items (Relational)
            // First delete existing items to handle updates/removals cleanly (simple strategy)
            // Or use upsert if they have IDs. 
            // Strategy: Delete all for this order and re-insert.
            // Safe? Yes if we don't rely on item UUIDs externally.
            await supabase.from('order_items').delete().eq('order_id', orderData.id)

            const itemsPayload = orderData.items.map(item => ({
                order_id: orderData.id,
                product_id: item.code, // Product ID
                product_name: item.name,
                quantity: item.qty || 1,
                unit_price: item.unitPrice || 0,
                job_id: item.subJob?.jobId,
                job_type: item.subJob?.jobType,
                appointment_date: item.subJob?.appointmentDate
            }))

            if (itemsPayload.length > 0) {
                const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload)
                if (itemsError) console.error('Error saving order items:', itemsError)
            }

            // 4. Handle Jobs (Relational)
            // Similar strategy: Upsert based on ID.
            const jobsPayload = orderData.items
                .filter(item => item.subJob && item.subJob.jobId)
                .map(item => ({
                    id: item.subJob.jobId,
                    order_id: orderData.id,
                    customer_id: orderData.customer?.id,
                    customer_name: orderData.customer?.name,
                    product_id: item.code,
                    product_name: item.name,
                    product_snapshot: item, // Full details
                    job_type: item.subJob.jobType || 'installation',
                    job_date: item.subJob.appointmentDate || orderData.date,
                    job_time: '09:00', // Default
                    address: item.subJob.installAddress || orderData.customer?.address,
                    google_map_link: item.subJob.googleMapLink,
                    distance: item.subJob.distance,
                    assigned_team: item.subJob.team || '-',
                    inspector_1: item.subJob.inspector1,
                    inspector_2: item.subJob.inspector2,
                    status: 'รอดำเนินการ',
                    notes: item.subJob.description,
                    created_at: new Date().toISOString() // Or keep original if editing
                }))

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
        try {
            // Cascade delete handles order_items and jobs if configured, 
            // but let's be explicit for safety or if cascade isn't perfect.
            // Schema has "on delete cascade" for order_items and jobs referencing orders.
            // So deleting order should be enough.
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting order:', error)
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
                // created_at auto handled by default usually, or preserve if editing?
                // For upsert, we generally don't touch created_at unless it's new
            }

            const { error } = await supabase
                .from('jobs')
                .upsert(dbPayload)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error saving job:', error)
            return false
        }
    },

    // Internal helper purely for compatibility if needed, but getJobs covers it.
    getJobsRaw: async () => {
        const { data } = await supabase.from('jobs').select('*')
        return data || []
    }
}
