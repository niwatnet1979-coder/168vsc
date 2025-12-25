const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
    const envPath = path.resolve(__dirname, '.env.local');
    let env = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const [k, v] = line.split('=');
            if (k && v) env[k.trim()] = v.trim();
        });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const custId = 'test_' + Date.now();
    const { error: custError } = await supabase.from('customers').insert({
        id: custId,
        name: 'Test Customer',
        phone: '0000000000'
    });

    if (custError) {
        console.error('Error creating customer:', custError);
        return;
    }
    console.log('Created test customer:', custId);

    // 6. Test Partial Tax Invoice (Company Name only)
    console.log('Attempting Insert Tax Invoice with ONLY Company Name...');
    const { error: errorPartial1 } = await supabase.from('customer_tax_invoices').insert([{
        customer_id: custId,
        company_name: 'Partial Corp',
        // tax_id missing
    }]);

    if (errorPartial1) {
        console.error('Insert Error (Partial 1):', errorPartial1.message);
    } else {
        console.log('Insert Success (Partial 1)');
    }

    // 7. Test Partial Tax Invoice (Tax ID only)
    console.log('Attempting Insert Tax Invoice with ONLY Tax ID...');
    const { error: errorPartial2 } = await supabase.from('customer_tax_invoices').insert([{
        customer_id: custId,
        // company_name missing
        tax_id: '888888888888'
    }]);

    if (errorPartial2) {
        console.error('Insert Error (Partial 2):', errorPartial2.message);
    } else {
        console.log('Insert Success (Partial 2)');
    }

    // Cleanup
    await supabase.from('customers').delete().eq('id', custId);
}

run();
