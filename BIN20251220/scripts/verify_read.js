
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRead() {
    console.log("Verifying Read Logic...");

    // Use the ID from user's logs
    const customerId = 'test-cust-1765982749743';

    console.log("Fetching for ID:", customerId);

    const { data, error } = await supabase
        .from('customers')
        .select(`
            *,
            contacts:customer_contacts(*),
            addresses:customer_addresses(*),
            taxInvoices:customer_tax_invoices(*)
        `)
        .eq('id', customerId)
        .single();

    if (error) {
        console.error("Read Error:", error);
    } else {
        console.log("Read Success.");
        console.log("Tax Invoices Count:", data.taxInvoices ? data.taxInvoices.length : 'undefined');
        console.log("Tax Invoices Data:", JSON.stringify(data.taxInvoices, null, 2));
    }
}

verifyRead();
