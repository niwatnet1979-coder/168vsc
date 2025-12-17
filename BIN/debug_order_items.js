
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkOrderItems() {
    // Fetch a recent order with items
    const { data: orders, error } = await supabase
        .from('orders')
        .select('items')
        .neq('status', 'cancelled')
        .limit(5);

    if (orders && orders.length > 0) {
        console.log('Order Items Sample:');
        orders.forEach((o, i) => {
            if (o.items && o.items.length > 0) {
                console.log(`Order ${i + 1}:`, JSON.stringify(o.items[0], null, 2));
            }
        });
    } else {
        console.log('No orders found or error:', error);
    }
}

checkOrderItems();
