const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Inspecting product_variants schema...');

    // We can't query information_schema directly with anon key usually, 
    // but we can try to select a single row and see the keys.
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in product_variants:', Object.keys(data[0]));
    } else {
        console.log('No data found in product_variants. Cannot infer schema from row.');

        // Try to insert a dummy row to fail and see error? No, that's risky.
        // Let's try to query specific columns we expect to exist.
        const { data: checkCols, error: checkError } = await supabase
            .from('product_variants')
            .select('id, product_id, sku, price, color')
            .limit(1);

        if (checkError) {
            console.error('Error checking specific columns:', checkError);
        } else {
            console.log('Critical columns (id, product_id, sku, price, color) EXIST.');
        }
    }
}

inspectSchema();
