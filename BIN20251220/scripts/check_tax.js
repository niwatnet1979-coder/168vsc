
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestTaxInvoices() {
    console.log("Checking latest customer_tax_invoices...");

    // Fetch top 5 most recently created tax invoices
    const { data, error } = await supabase
        .from('customer_tax_invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching tax invoices:", error);
    } else {
        console.log("Found", data.length, "records.");
        data.forEach(item => {
            console.log("------------------------------------------------");
            console.log(`ID: ${item.id}`);
            console.log(`Customer ID: ${item.customer_id}`);
            console.log(`Company: ${item.company_name}`);
            console.log(`Tax ID: ${item.tax_id}`);
            console.log(`Created: ${item.created_at}`);
        });
    }
}

checkLatestTaxInvoices();
