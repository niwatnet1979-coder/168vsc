
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env = dotenv.parse(envLocal);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function inspectSchema() {
    console.log('Inspecting schema...');

    // We can't query information_schema directly via JS client easily unless we have a function or unrestricted access.
    // Instead, let's try to select * from products and product_variants limit 1 and see the keys.

    const { data: products, error: prodError } = await supabase.from('products').select('*').limit(1);
    if (prodError) console.error('Product Error:', prodError);
    else console.log('Products Columns:', products.length ? Object.keys(products[0]) : 'No rows, but query worked');

    const { count, error: invError } = await supabase.from('inventory_items').select('*', { count: 'exact', head: true });
    if (invError) console.error('Inventory Error:', invError);
    else console.log('Inventory Items Count:', count);

    // Check Product Image URL usage
    const { data: prods, error: pErr } = await supabase.from('products').select('image_url, uuid');
    if (pErr) console.error('Product Error:', pErr);
    else {
        const withImg = prods.filter(p => p.image_url).length;
        console.log(`Products Total: ${prods.length}, With image_url: ${withImg}`);
    }

    // Check Variants Stock & Images
    const { data: variants, error: varError } = await supabase.from('product_variants').select('stock, id, image_url');
    if (varError) console.error('Variants Error:', varError);
    else {
        const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        const variantsWithStock = variants.filter(v => v.stock > 0).length;
        const variantsWithImg = variants.filter(v => v.image_url).length;
        console.log(`Variants Total: ${variants.length}, With Stock > 0: ${variantsWithStock}, With Image: ${variantsWithImg}`);
    }
    // Check Orders Count
    const { count: orderCount, error: ordError } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (ordError) console.error('Orders Error:', ordError);
    else console.log('Orders Total:', orderCount);

    // Try fetching one order to see if it errors on column selection
    const { data: firstOrder, error: firstOrdErr } = await supabase.from('orders').select('*').limit(1);
    if (firstOrdErr) console.error('First Order Fetch Error:', firstOrdErr);
    else console.log('First Order ID:', firstOrder?.[0]?.id);
}

inspectSchema();
