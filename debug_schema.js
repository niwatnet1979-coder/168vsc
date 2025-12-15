
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log('Product Keys:', Object.keys(data[0]));
    } else {
        console.log('No products found or error:', error);
    }
}

checkSchema();
