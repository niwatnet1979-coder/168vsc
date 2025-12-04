/**
 * DataManager - Centralized data access layer for 168VSC
 * Handles data retrieval from localStorage and joins related entities (Normalization)
 */

export const DataManager = {
    // --- Master Data Access ---

    getCustomers: () => {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('customers_data')
        return data ? JSON.parse(data) : []
    },

    getProducts: () => {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('products_data_v3')
        return data ? JSON.parse(data) : []
    },

    getTeams: () => {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('team_data')
        return data ? JSON.parse(data) : []
    },

    // --- Transaction Data Access (with Joins) ---

    getOrders: () => {
        if (typeof window === 'undefined') return []
        const ordersData = localStorage.getItem('orders_data')
        const orders = ordersData ? JSON.parse(ordersData) : []

        const customers = DataManager.getCustomers()

        // Join Customer Data
        return orders.map(order => {
            const customer = customers.find(c => c.id === order.customerId)
            return {
                ...order,
                customer: customer || { name: 'Unknown Customer' }, // Fallback
                customerName: customer ? customer.name : 'Unknown Customer' // Convenience field
            }
        })
    },

    getJobs: () => {
        if (typeof window === 'undefined') return []
        const jobsData = localStorage.getItem('jobs_data')
        const jobs = jobsData ? JSON.parse(jobsData) : []

        const customers = DataManager.getCustomers()
        const products = DataManager.getProducts()
        const orders = DataManager.getOrders() // Already joined with customers

        // Join All Related Data
        return jobs.map(job => {
            const customer = customers.find(c => c.id === job.customerId)
            const product = products.find(p => p.id === job.productId)
            const order = orders.find(o => o.id === job.orderId)

            return {
                ...job,
                // Joined Entities
                customer: customer || { name: 'Unknown Customer' },
                product: product || { name: 'Unknown Product' },
                order: order || {},

                // Convenience Fields for UI (Flattening)
                customerName: customer ? customer.name : 'Unknown Customer',
                productName: product ? product.name : 'Unknown Product',
                productImage: product && product.images && product.images.length > 0 ? product.images[0] : null
            }
        })
    },

    // --- Data Modification Helpers ---

    saveJob: (updatedJob) => {
        if (typeof window === 'undefined') return false

        const jobs = DataManager.getJobsRaw() // Get raw data without joins
        const index = jobs.findIndex(j => j.id === updatedJob.id)

        // Extract only the fields that belong to the job table (remove joined data)
        const jobToSave = {
            id: updatedJob.id,
            orderId: updatedJob.orderId,
            customerId: updatedJob.customerId,
            productId: updatedJob.productId,
            jobType: updatedJob.jobType,
            jobDate: updatedJob.jobDate,
            jobTime: updatedJob.jobTime,
            address: updatedJob.address,
            assignedTeam: updatedJob.assignedTeam,
            status: updatedJob.status,
            notes: updatedJob.notes,
            completion: updatedJob.completion,
            createdAt: updatedJob.createdAt,
            updatedAt: new Date().toISOString()
        }

        if (index !== -1) {
            jobs[index] = jobToSave
        } else {
            jobs.push(jobToSave)
        }

        localStorage.setItem('jobs_data', JSON.stringify(jobs))
        return true
    },

    // Internal use: Get raw data without joins
    getJobsRaw: () => {
        if (typeof window === 'undefined') return []
        const data = localStorage.getItem('jobs_data')
        return data ? JSON.parse(data) : []
    }
}
