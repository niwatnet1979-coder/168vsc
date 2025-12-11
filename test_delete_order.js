const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDelete() {
    console.log('Testing delete order OD0000001...\n')

    // First, check if order exists
    const { data: orderBefore, error: fetchError } = await supabase
        .from('orders')
        .select('id, customer_name')
        .eq('id', 'OD0000001')
        .single()

    if (fetchError) {
        console.error('Error fetching order:', fetchError)
        return
    }

    console.log('Order before delete:', orderBefore)

    // Try to delete related jobs first
    console.log('\nDeleting related jobs...')
    const { error: jobsError } = await supabase
        .from('jobs')
        .delete()
        .eq('order_id', 'OD0000001')

    if (jobsError) {
        console.error('Error deleting jobs:', jobsError)
    } else {
        console.log('Jobs deleted successfully')
    }

    // Try to delete the order
    console.log('\nDeleting order...')
    const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', 'OD0000001')

    if (deleteError) {
        console.error('Error deleting order:', deleteError)
        console.error('Error details:', JSON.stringify(deleteError, null, 2))
    } else {
        console.log('Order deleted successfully!')
    }

    // Check if order still exists
    const { data: orderAfter } = await supabase
        .from('orders')
        .select('id')
        .eq('id', 'OD0000001')
        .single()

    if (orderAfter) {
        console.log('\n⚠️ Order still exists after delete attempt')
    } else {
        console.log('\n✅ Order successfully deleted')
    }
}

testDelete()
