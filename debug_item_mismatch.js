const { supabase } = require('./lib/supabaseClient');

const orderId = 'e09ca266-beac-4f23-acdb-2dae62920fec';

async function debug() {
    console.log('--- Fetching Order Data ---');
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (orderError) {
        console.error('Order Error:', orderError);
        return;
    }
    console.log('Order ID (Internal):', order.id);

    console.log('\n--- Fetching Order Items ---');
    // Using order_id = order.id
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(*), variant:product_variants(*)')
        .eq('order_id', order.id);

    if (itemsError) {
        console.error('Items Error:', itemsError);
        return;
    }
    
    console.log('Items Count:', items.length);
    items.forEach((item, idx) => {
        console.log(`\n--- Item ${idx + 1} ---`);
        console.log('Item ID:', item.id);
        console.log('Product ID:', item.product_id);
        console.log('Product Name (from join):', item.product?.name);
        console.log('Variant SKU (from join):', item.variant?.sku);
        console.log('Quantity:', item.quantity);
        console.log('Unit Price:', item.unit_price);
        console.log('Light:', item.light);
        console.log('Light Color:', item.light_color);
        console.log('Remark:', item.remark);
    });
}

debug();
