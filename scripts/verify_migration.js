
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
    console.log("Verifying Migration...");
    let differences = 0;

    // 1. Verify Products
    const { data: products } = await supabase.from('products').select('uuid, variants_json:variants');
    const { count: variantCount } = await supabase.from('product_variants').select('*', { count: 'exact', head: true });

    let expectedVariants = 0;
    products.forEach(p => {
        if (Array.isArray(p.variants_json)) expectedVariants += p.variants_json.length;
    });

    console.log(`Products: Expected Variants (JSON): ${expectedVariants}, Actual (Table): ${variantCount}`);
    if (expectedVariants !== variantCount) {
        console.warn("MISMATCH in Product Variants!");
        differences++;
    }

    // 2. Verify Orders
    const { data: orders } = await supabase.from('orders').select('id, items_json:items');
    const { count: itemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });

    let expectedItems = 0;
    orders.forEach(o => {
        if (Array.isArray(o.items_json)) expectedItems += o.items_json.length;
    });

    console.log(`Orders: Expected Items (JSON): ${expectedItems}, Actual (Table): ${itemCount}`);
    if (expectedItems !== itemCount) {
        console.warn("MISMATCH in Order Items!");
        differences++;
    }

    if (differences === 0) {
        console.log("SUCCESS: Data Verification Passed.");
    } else {
        console.error("FAILURE: Data Verification Found Issues.");
    }
}

verifyMigration();
