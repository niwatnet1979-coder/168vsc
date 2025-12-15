
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    // Check purchase_items columns
    const { data: pi, error: e1 } = await supabase.from('purchase_items').select('*').limit(1);
    console.log('Purchase Item Keys:', pi && pi.length > 0 ? Object.keys(pi[0]) : 'Empty/Error');
    if (pi && pi.length > 0) console.log('Sample purchase_item:', pi[0]);

    // Check inventory_items columns
    const { data: ii, error: e2 } = await supabase.from('inventory_items').select('*').limit(1);
    console.log('Inventory Item Keys:', ii && ii.length > 0 ? Object.keys(ii[0]) : 'Empty/Error');
    if (ii && ii.length > 0) console.log('Sample inventory_item:', ii[0]);

    // Check order items (Sold) we already know has 'selectedVariant' JSON or similar
}

checkSchema();
