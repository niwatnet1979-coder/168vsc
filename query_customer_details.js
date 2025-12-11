const { createClient } = require('@supabase/supabase-js')

// Read from environment or use Next.js env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getCustomerDetails() {
    const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, customer_details')
        .eq('id', 'OD0000003')
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Order ID:', data.id)
    console.log('Customer Name:', data.customer_name)
    console.log('\n=== Customer Details ===')
    console.log(JSON.stringify(data.customer_details, null, 2))
    console.log('\n=== Customer Details Length ===')
    console.log('JSON string length:', JSON.stringify(data.customer_details).length)

    // Check for specific fields
    if (data.customer_details) {
        console.log('\n=== Fields Present ===')
        console.log('Keys:', Object.keys(data.customer_details))
    }
}

getCustomerDetails()
