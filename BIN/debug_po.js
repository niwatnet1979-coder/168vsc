
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxsngjscyawiqbtocugp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPO() {
    console.log('--- Testing Purchase Orders ---');

    // 1. Try to fetch existing
    console.log('Fetching with current query (join suppliers)...');
    const { data: d1, error: e1 } = await supabase
        .from('purchase_orders')
        .select(`*, supplier:suppliers (name)`)
        .limit(5);

    if (e1) {
        console.error('Fetch Error 1 (Join):', e1.message);
    } else {
        console.log(`Fetched ${d1.length} POs (Join).`);
    }

    // 2. Try simple fetch
    console.log('Fetching simple (*)...');
    const { data: d2, error: e2 } = await supabase
        .from('purchase_orders')
        .select('*')
        .limit(5);

    if (e2) {
        console.error('Fetch Error 2 (Simple):', e2.message);
    } else {
        console.log(`Fetched ${d2.length} POs (Simple).`);
        if (d2.length > 0) console.log(d2[0]);
    }

    // 3. Try Insert
    console.log('Attempting Insert...');
    const poData = {
        supplier_name: 'Test Supplier ' + Date.now(),
        status: 'draft',
        expected_date: new Date().toISOString().split('T')[0],
        total_landed_cost: 100
    };

    const { data: ins, error: insErr } = await supabase
        .from('purchase_orders')
        .insert([poData])
        .select()
        .single();

    if (insErr) {
        console.error('Insert Error:', insErr);
    } else {
        console.log('Insert Success:', ins);
    }
}

testPO();
