const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function compareDataSizes() {
    console.log('=== Comparing Order Data Sizes ===\n')

    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, customer_details, items, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error:', error)
        return
    }

    orders.forEach((order, index) => {
        const customerDetailsSize = JSON.stringify(order.customer_details || {}).length
        const itemsSize = JSON.stringify(order.items || []).length
        const totalSize = customerDetailsSize + itemsSize

        // Check if items have images
        const hasImages = order.items?.some(item => item.image && item.image.startsWith('data:image'))

        // Check if customer_details has arrays
        const hasFullCustomerData = order.customer_details?.contacts || order.customer_details?.addresses

        console.log(`Order ${index + 1}: ${order.id}`)
        console.log(`  Created: ${new Date(order.created_at).toLocaleString()}`)
        console.log(`  customer_details: ${customerDetailsSize} bytes ${hasFullCustomerData ? '(FULL)' : '(OPTIMIZED)'}`)
        console.log(`  items: ${itemsSize} bytes ${hasImages ? '(WITH IMAGES)' : '(NO IMAGES)'}`)
        console.log(`  Total: ${totalSize} bytes`)
        console.log(`  Optimization: ${hasImages || hasFullCustomerData ? '❌ OLD FORMAT' : '✅ OPTIMIZED'}`)
        console.log('')
    })
}

compareDataSizes()
