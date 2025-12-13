const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLoadOrder() {
    console.log('=== Debugging loadOrder for OD0000007 ===\n')

    // Step 1: Get order
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', 'OD0000007')
        .single()

    console.log('1. Order customer_details:')
    console.log(JSON.stringify(order.customer_details, null, 2))

    // Step 2: Get full customer
    const customerId = order.customer_details?.id
    console.log(`\n2. Fetching customer ID: ${customerId}`)

    const { data: fullCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

    console.log('\n3. Full customer from DB:')
    console.log(`   contacts: ${JSON.stringify(fullCustomer.contacts)}`)
    console.log(`   addresses: ${JSON.stringify(fullCustomer.addresses?.map(a => a.label))}`)
    console.log(`   tax_invoices: ${JSON.stringify(fullCustomer.tax_invoices?.map(t => t.companyName))}`)

    // Step 3: Simulate what loadOrder should set
    const customerState = {
        id: fullCustomer.id,
        name: fullCustomer.name,
        phone: fullCustomer.phone,
        email: fullCustomer.email,
        lineId: fullCustomer.line_id,
        line: fullCustomer.line_id,
        facebook: fullCustomer.facebook,
        instagram: fullCustomer.instagram,
        mediaSource: fullCustomer.media_source,
        mediaSourceOther: fullCustomer.media_source_other,
        address: fullCustomer.address,
        contacts: (Array.isArray(fullCustomer.contacts) ? fullCustomer.contacts : []).filter(Boolean),
        taxInvoices: (Array.isArray(fullCustomer.tax_invoices) ? fullCustomer.tax_invoices : []).filter(Boolean),
        addresses: (Array.isArray(fullCustomer.addresses) ? fullCustomer.addresses : []).filter(Boolean)
    }

    console.log('\n4. Customer state that should be set:')
    console.log(`   contacts: ${customerState.contacts.length} items`)
    console.log(`   addresses: ${customerState.addresses.length} items`)
    console.log(`   taxInvoices: ${customerState.taxInvoices.length} items`)

    if (customerState.contacts.length > 0) {
        console.log('\n5. Contact details:')
        customerState.contacts.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.name} - ${c.phone} (${c.position})`)
        })
    }

    console.log('\n✅ Data is available and should display in UI')
}

debugLoadOrder()
