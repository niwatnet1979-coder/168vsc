const { supabase } = require('./lib/supabaseClient');

async function checkSchema() {
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
    
    if (ordersError) console.error('Orders Error:', ordersError);
    else console.log('Orders Columns:', Object.keys(orders[0] || {}));

    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .limit(1);
    
    if (itemsError) console.error('Items Error:', itemsError);
    else console.log('Items Columns:', Object.keys(items[0] || {}));
}

checkSchema();
