// Script to create Jobs from existing Orders
// Run this in browser console to generate jobs from existing orders

(function () {
    console.log('🔄 Starting job creation from existing orders...')

    // Get existing orders
    const ordersData = localStorage.getItem('orders_data')
    if (!ordersData) {
        console.log('❌ No orders found')
        return
    }

    const orders = JSON.parse(ordersData)
    console.log(`📦 Found ${orders.length} orders`)

    // Get existing jobs
    const jobsData = localStorage.getItem('jobs_data')
    const jobs = jobsData ? JSON.parse(jobsData) : []
    console.log(`📋 Found ${jobs.length} existing jobs`)

    let jobsCreated = 0
    let jobsSkipped = 0

    // Process each order
    orders.forEach(order => {
        if (!order.items || !Array.isArray(order.items)) {
            console.log(`⚠️  Order ${order.id} has no items`)
            return
        }

        // Create a job for each item
        order.items.forEach((item, index) => {
            // Generate job ID if not exists
            const jobId = item.subJob?.jobId || `JB${String(jobs.length + jobsCreated + 1).padStart(7, '0')}`

            // Check if job already exists
            if (jobs.find(j => j.id === jobId)) {
                console.log(`⏭️  Job ${jobId} already exists, skipping`)
                jobsSkipped++
                return
            }

            // Create new job
            const newJob = {
                id: jobId,
                orderId: order.id,
                customerId: order.customerDetails?.id || null,
                customerName: order.customer || order.customerDetails?.name || 'Unknown Customer',
                productId: item.code,
                productName: item.name,
                productImage: item.image || null,
                product: {
                    code: item.code,
                    name: item.name,
                    description: `${item.name} - จำนวน ${item.qty} ${item.unit || 'ชิ้น'}`,
                    image: item.image
                },
                jobType: item.subJob?.jobType || 'ติดตั้ง',
                rawJobType: item.subJob?.jobType || 'installation',
                jobDate: item.subJob?.appointmentDate || order.date || order.jobInfo?.orderDate || new Date().toISOString().split('T')[0],
                jobTime: '09:00',
                address: item.subJob?.installAddress || order.customerDetails?.address || '',
                assignedTeam: item.subJob?.team || 'ทีม A',
                status: 'รอดำเนินการ',
                completionDate: null,
                signatureImage: null,
                installationPhotos: [],
                paymentSlipPhoto: null,
                notes: item.subJob?.description || '',
                createdAt: new Date().toISOString()
            }

            jobs.push(newJob)
            jobsCreated++
            console.log(`✅ Created job ${jobId} for order ${order.id}`)
        })
    })

    // Save jobs
    localStorage.setItem('jobs_data', JSON.stringify(jobs))

    console.log('✨ Job creation complete!')
    console.log(`📊 Summary:`)
    console.log(`   - Jobs created: ${jobsCreated}`)
    console.log(`   - Jobs skipped: ${jobsSkipped}`)
    console.log(`   - Total jobs: ${jobs.length}`)
    console.log('🔄 Please refresh the page to see the jobs')
})()
