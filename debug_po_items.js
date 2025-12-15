
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxsngjscyawiqbtocugp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPOItems() {
    console.log('--- Testing PO + Items Insert ---');

    // 1. Insert PO Header
    const poData = {
        supplier_name: 'Debug Supplier',
        status: 'draft',
        expected_date: new Date().toISOString().split('T')[0],
        total_landed_cost: 500
    };

    console.log('Inserting PO Header...');
    const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([poData])
        .select()
        .single();

    if (poError) {
        console.error('PO Header Insert Failed:', poError);
        return;
    }
    console.log('PO Header Created:', po.id);

    // 2. Prepare Items
    // We need a valid product ID. Let's fetch one.
    const { data: prods } = await supabase.from('products').select('uuid').limit(1);
    const prodId = prods && prods[0] ? prods[0].uuid : '00000000-0000-0000-0000-000000000000';

    const items = [
        {
            purchase_order_id: po.id,
            product_id: prodId,
            quantity: 2,
            unit_price: 100,
            total_price: 200
        },
        {
            purchase_order_id: po.id, // Using generic ID or same?
            product_id: prodId,
            quantity: 3,
            unit_price: 100,
            total_price: 300
        }
    ];

    console.log('Inserting PO Items into purchase_items...');
    // Note: DataManager uses 'purchase_items'. Let's verify if that's the table name.
    const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_items')
        .insert(items)
        .select();

    if (itemsError) {
        console.error('PO Items Insert Failed:', itemsError);
        // Clean up
        console.log('Cleaning up PO...');
        await supabase.from('purchase_orders').delete().eq('id', po.id);
    } else {
        console.log('PO Items Insert Success:', itemsData.length, 'items.');
    }
}

testPOItems();
