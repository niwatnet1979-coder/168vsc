const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderTax() {
    const orderId = 'e09ca266-beac-4f23-acdb-2dae62920fec';

    console.log('Fetching order:', orderId);

    // Fetch Order
    const { data: order, error } = await supabase
        .from('orders')
        .select('id, tax_invoice_id, customer_id')
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return;
    }

    console.log('Order Data:', order);

    if (order.tax_invoice_id) {
        console.log('Found tax_invoice_id:', order.tax_invoice_id);

        const { data: taxInv, error: err2 } = await supabase
            .from('customer_tax_invoices')
            .select('*')
            .eq('id', order.tax_invoice_id)
            .single();

        if (err2) {
            console.error('Error fetching tax invoice:', err2);
        } else {
            console.log('Tax Invoice Record:', taxInv);
        }
    } else {
        console.log('No tax_invoice_id linked to this order.');
    }

    if (order.customer_id) {
        const { data: cust, error: err3 } = await supabase
            .from('customers')
            .select('*')
            .eq('id', order.customer_id)
            .single();

        if (err3) {
            console.error('Error fetching customer:', err3);
        } else {
            console.log('Customer Record:', cust);
        }
    }
}

checkOrderTax();
