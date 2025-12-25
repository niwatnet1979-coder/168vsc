// Test script to check order IDs and test deletion
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOrderDeletion() {
    console.log('=== Testing Order Deletion ===\n')

    // 1. Fetch a sample order to see ID format
    console.log('Step 1: Fetching sample orders...')
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_id, created_at')
        .limit(5)

    if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        return
    }

    console.log('Sample orders:')
    orders.forEach(o => {
        console.log(`  ID: ${o.id} (type: ${typeof o.id}, length: ${o.id.length})`)
    })

    // 2. Check jobs table structure
    console.log('\nStep 2: Checking jobs for first order...')
    if (orders.length > 0) {
        const testOrderId = orders[0].id
        console.log(`Testing with order ID: ${testOrderId}`)

        const { data: jobs, error: jobsError } = await supabase
            .from('jobs')
            .select('id, order_id, order_item_id')
            .eq('order_id', testOrderId)

        if (jobsError) {
            console.error('Error fetching jobs:', jobsError)
        } else {
            console.log(`Found ${jobs.length} jobs:`)
            jobs.forEach(j => {
                console.log(`  Job ID: ${j.id} (type: ${typeof j.id})`)
                console.log(`  Order ID: ${j.order_id} (type: ${typeof j.order_id})`)
                console.log(`  Order Item ID: ${j.order_item_id} (type: ${typeof j.order_item_id})`)
            })
        }

        // 3. Check order_items
        console.log('\nStep 3: Checking order_items...')
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('id, order_id')
            .eq('order_id', testOrderId)

        if (itemsError) {
            console.error('Error fetching order_items:', itemsError)
        } else {
            console.log(`Found ${items.length} order items:`)
            items.forEach(i => {
                console.log(`  Item ID: ${i.id} (type: ${typeof i.id})`)
                console.log(`  Order ID: ${i.order_id} (type: ${typeof i.order_id})`)
            })
        }
    }
}

testOrderDeletion().then(() => {
    console.log('\n=== Test Complete ===')
    process.exit(0)
}).catch(err => {
    console.error('Test failed:', err)
    process.exit(1)
})
