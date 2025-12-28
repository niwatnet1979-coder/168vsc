const { supabase } = require('./lib/supabaseClient');

const orderId = 'e09ca266-beac-4f23-acdb-2dae62920fec';

async function debug() {
    console.log('--- Fetching Order Data ---');
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('uuid', orderId)
        .single();

    if (orderError) {
        console.error('Order Error:', orderError);
        return;
    }
    console.log('Order:', JSON.stringify(order, null, 2));

    console.log('\n--- Fetching Order Items ---');
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

    if (itemsError) {
        console.error('Items Error:', itemsError);
        return;
    }
    console.log('Items Count:', items.length);
    items.forEach((item, idx) => {
        console.log(`Item ${idx + 1}:`, JSON.stringify(item, null, 2));
    });

    // Also check product and variant for Item 1 (IT1edeec)
    // Finding item by checking some fields if tempId is not there
    const item1 = items.find(i => i.name === 'โคมไฟรังนก' || i.product_id === 'AA002' || i.unit_price === 4000);
    if (item1) {
        console.log('\n--- Checking Product/Variant for Item 1 ---');
        const { data: product, error: prodError } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)')
            .or(`uuid.eq.${item1.product_id},product_code.eq.${item1.product_id}`);
        
        console.log('Product for Item 1:', JSON.stringify(product, null, 2));
    }
}

debug();
