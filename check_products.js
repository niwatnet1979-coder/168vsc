const { supabase } = require('./lib/supabaseClient');

async function check() {
    console.log('--- Checking AA002 ---');
    const { data: aa002 } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('product_code', 'AA002');
    console.log('AA002:', JSON.stringify(aa002, null, 2));

    console.log('\n--- Checking WL001 ---');
    const { data: wl001 } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('product_code', 'WL001');
    console.log('WL001:', JSON.stringify(wl001, null, 2));
}

check();
