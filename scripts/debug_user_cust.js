
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserCustomer() {
    console.log("Debugging Specific Customer Insert...");

    const customerId = 'test-cust-1765982749743'; // The ID from user's screenshot

    // 1. Verify Customer Exists
    const { data: cust, error: custError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', customerId)
        .single();

    if (custError) {
        console.error("Customer Fetch Error:", custError);
        return;
    }
    console.log("Customer Found:", cust);

    // 2. Try Inserting Tax Invoice for this customer
    const taxPayload = [
        {
            customer_id: customerId,
            company_name: 'Debug User Insert',
            tax_id: '9999999999999',
            address: 'Debug Address'
        }
    ];

    console.log("Inserting Tax Invoice:", taxPayload);
    const { data: tax, error: taxError } = await supabase
        .from('customer_tax_invoices')
        .insert(taxPayload)
        .select();

    if (taxError) {
        console.error("Insert Error:", taxError);
    } else {
        console.log("Insert Success:", tax);
    }
}

debugUserCustomer();
