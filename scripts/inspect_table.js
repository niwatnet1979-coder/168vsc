
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log("Inspecting customer_tax_invoices...");

    // Test Insert
    console.log("Attempting Insert...");
    const custId = 'test-cust-' + Date.now();
    // 1. Insert Customer
    const { error: custError } = await supabase.from('customers').insert({
        id: custId,
        name: 'Test Customer',
        phone: '0000000000'
    });
    if (custError) console.error("Customer Insert Error:", custError);
    else console.log("Customer Insert Success");

    // 2. Insert Tax Invoice
    const { data: taxData, error: taxError } = await supabase.from('customer_tax_invoices').insert({
        customer_id: custId,
        company_name: 'Test Company',
        tax_id: '1234567890123'
    }).select();

    if (taxError) {
        console.error("Tax Invoice Insert Error:", taxError);
        console.log("Code:", taxError.code, "Message:", taxError.message);
    } else {
        console.log("Tax Invoice Insert Success:", taxData);
    }
}

inspectTable();
