const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testGetCustomerById() {
    console.log('Testing getCustomerById...\n')

    // Get order to find customer_id
    const { data: order } = await supabase
        .from('orders')
        .select('customer_details')
        .eq('id', 'OD0000007')
        .single()

    console.log('Order customer_details:', JSON.stringify(order.customer_details, null, 2))

    const customerId = order.customer_details?.id
    console.log(`\nFetching full customer data for ID: ${customerId}`)

    // Test getCustomerById
    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('\nFull customer data:')
    console.log(`  Name: ${customer.name}`)
    console.log(`  Phone: ${customer.phone}`)
    console.log(`  Contacts: ${customer.contacts?.length || 0} items`)
    console.log(`  Addresses: ${customer.addresses?.length || 0} items`)
    console.log(`  Tax Invoices: ${customer.tax_invoices?.length || 0} items`)

    if (customer.contacts) {
        console.log('\n  Contact details:')
        customer.contacts.forEach((c, i) => {
            console.log(`    ${i + 1}. ${c.name} - ${c.phone}`)
        })
    }
}

testGetCustomerById()
