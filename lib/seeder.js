import { MOCK_CUSTOMERS_DATA, MOCK_PRODUCTS_DATA } from './mockData'

export const seedDemoData = () => {
    if (typeof window === 'undefined') return
    // Disable seeding completely
    return

    try {
        const jobsData = localStorage.getItem('jobs_data')
        // Force seed if null, or empty array, or invalid JSON
        let shouldSeed = !jobsData
        if (jobsData) {
            try {
                const parsed = JSON.parse(jobsData)
                if (!Array.isArray(parsed) || parsed.length === 0) {
                    shouldSeed = true
                }
            } catch (e) {
                shouldSeed = true
            }
        }

        if (shouldSeed) {
            console.log('Seeding mock data for demo...')

            // Seed Customers
            let seedCustomers = !localStorage.getItem('customers_data')
            if (!seedCustomers) {
                try {
                    const c = JSON.parse(localStorage.getItem('customers_data'))
                    if (!Array.isArray(c) || c.length === 0) seedCustomers = true
                } catch (e) { seedCustomers = true }
            }
            if (seedCustomers) {
                localStorage.setItem('customers_data', JSON.stringify(MOCK_CUSTOMERS_DATA))
            }

            // Seed Products
            let seedProducts = !localStorage.getItem('products_data_v3')
            if (!seedProducts) {
                try {
                    const p = JSON.parse(localStorage.getItem('products_data_v3'))
                    if (!Array.isArray(p) || p.length === 0) seedProducts = true
                } catch (e) { seedProducts = true }
            }
            if (seedProducts) {
                localStorage.setItem('products_data_v3', JSON.stringify(MOCK_PRODUCTS_DATA))
                localStorage.setItem('products_data', JSON.stringify(MOCK_PRODUCTS_DATA)) // Sync both keys
            }

            // Seed Orders & Jobs
            const mockOrders = []
            const mockJobs = []
            const teams = ['ทีม A', 'ทีม B', 'ทีม C', 'ทีมช่าง 1']

            for (let i = 0; i < 5; i++) {
                const customer = MOCK_CUSTOMERS_DATA[i % MOCK_CUSTOMERS_DATA.length]
                const product = MOCK_PRODUCTS_DATA[i % MOCK_PRODUCTS_DATA.length]
                const orderId = `OD${20230001 + i}`
                const jobId = `JB${20230001 + i}`

                mockOrders.push({
                    id: orderId,
                    customerId: customer.id,
                    orderDate: '2023-12-01',
                    status: 'confirmed',
                    items: [{ productId: product.id, quantity: 1, price: product.price }]
                })

                mockJobs.push({
                    id: jobId,
                    orderId: orderId,
                    customerId: customer.id,
                    productId: product.id,
                    jobType: i % 2 === 0 ? 'ติดตั้ง' : 'ขนส่ง',
                    jobDate: new Date().toISOString().split('T')[0],
                    jobTime: `${9 + i}:00`,
                    address: customer.addresses?.[0]?.address || 'กรุงเทพฯ',
                    assignedTeam: teams[i % teams.length],
                    status: 'pending',
                    notes: 'Demonstration job data',
                    customerName: customer.name,
                    productName: product.name
                })
            }

            localStorage.setItem('orders_data', JSON.stringify(mockOrders))
            localStorage.setItem('jobs_data', JSON.stringify(mockJobs))

            console.log('Seeding complete.')
            return true // key to indicate seeding happened
        }
    } catch (error) {
        console.error('Seeding error:', error)
    }
    return false
}
