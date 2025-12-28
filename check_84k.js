const { supabase } = require('./lib/supabaseClient');

async function check() {
    console.log('--- Checking for price 84000 ---');
    const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('price', 84000);
    console.log('Products with price 84000:', JSON.stringify(prods, null, 2));

    const { data: variants } = await supabase
        .from('product_variants')
        .select('*, product:products(name, product_code)')
        .eq('price', 84000);
    console.log('Variants with price 84000:', JSON.stringify(variants, null, 2));

    const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .eq('unit_price', 84000);
    console.log('Order Items with unit_price 84000:', JSON.stringify(orderItems, null, 2));
}

check();
