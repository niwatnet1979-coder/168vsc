
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyQuery() {
    console.log("Verifying Query Syntax...");

    // Attempt to fetch one customer using the same syntax as getCustomerById
    const { data, error } = await supabase
        .from('customers')
        .select(`
            *,
            contacts:customer_contacts(*),
            addresses:customer_addresses(*),
            taxInvoices:customer_tax_invoices(*)
        `)
        .limit(1)
        .single(); // Actually .single() might fail if 0 rows, but let's see syntax error

    if (error) {
        if (error.code === 'PGRST116') { // JSON object requested, multiple (or no) results returned
            console.log("Query Syntax Valid (No data found or multiple returned, but syntax ok).");
        } else {
            console.error("Query Error:", error);
        }
    } else {
        console.log("Query Success. Data:", data ? "Found" : "Null");
        if (data) {
            console.log("Tax Invoices:", data.taxInvoices);
        }
    }
}

verifyQuery();
