
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCheckIn() {
    console.log('Fetching a product...');
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .limit(1);

    if (prodError) {
        console.error('Error fetching products:', prodError);
        return;
    }

    if (!products || products.length === 0) {
        console.log('No products found to test with.');
        return;
    }

    const product = products[0];
    console.log('Using product:', product.id, product.name, 'UUID:', product.uuid);

    const timestamp = Date.now().toString(36);
    const newItem = {
        product_id: product.id, // Using the ID from the product query
        qr_code: `TEST-${timestamp}`,
        lot_number: 'DEBUG-LOT',
        status: 'in_stock',
        current_location: 'Warehouse_Debug',
        pack_size: 1
    };

    console.log('Attempting to insert inventory item:', newItem);

    const { data, error } = await supabase
        .from('inventory_items')
        .insert([newItem])
        .select()
        .single();

    if (error) {
        console.error('!!! INSERT ERROR !!!');
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('Insert success:', data);
        // Clean up
        await supabase.from('inventory_items').delete().eq('id', data.id);
    }
}

testCheckIn();
