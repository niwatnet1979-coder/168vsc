
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepSearch() {
    console.log("Deep Search...");

    // 1. Search Tax ID
    const taxId = '3759900299611';
    console.log("Searching Tax ID:", taxId);
    const { data: taxData } = await supabase
        .from('customer_tax_invoices')
        .select('*')
        .eq('tax_id', taxId);
    console.log("Tax Found:", taxData);

    // 2. Search Customer ID Pattern
    console.log("Searching Customer ID Pattern 'CUST-1765%'...");
    const { data: custData } = await supabase
        .from('customers')
        .select('id, name')
        .ilike('id', 'CUST-1765%');
    console.log("Customers Found:", custData);
}

deepSearch();
