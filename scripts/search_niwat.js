
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchNiwat() {
    console.log("Searching for 'niwat'...");

    const { data, error } = await supabase
        .from('customer_tax_invoices')
        .select('*')
        .ilike('company_name', '%niwat%');

    if (error) {
        console.error("Search Error:", error);
    } else {
        console.log("Found:", data.length);
        console.log(data);
    }
}

searchNiwat();
