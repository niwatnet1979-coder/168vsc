
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkProduct() {
    // Fetch the product visible in screenshot (Code AA001)
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_code', 'AA001');

    if (products && products.length > 0) {
        const p = products[0];
        console.log('Product:', p.name);
        console.log('Min Stock Level (Product):', p.min_stock_level);
        if (p.variants) {
            console.log('Variants:', JSON.stringify(p.variants, null, 2));
        }
    } else {
        console.log('Product not found or error:', error);
    }
}

checkProduct();
