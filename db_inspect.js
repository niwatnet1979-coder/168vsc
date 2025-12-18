
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("Inspecting product_variants schema...");
    // We can't query information_schema easily with supabase-js unless we have pg connection or using rpc.
    // Instead, we will try to insert a dummy row and see the error, OR read one row.

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error reading variants:", error);
    } else {
        console.log("Read success. Keys available:", data.length > 0 ? Object.keys(data[0]) : "No rows");
    }

    // Attempt to Insert duplicate dummy to see column error if any
    // actually, let's just log what we have.
}

inspectSchema();
