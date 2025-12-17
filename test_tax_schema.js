const { createClient } = require('@supabase/supabase-js');
// Need to find env vars or direct connection
// Assuming I can use the same client setup as the app if I can find the keys.
// Or I can use the 'run_command' to psql if available? No psql.
// I'll try to require the local helper if possible, or just raw node.

// I will look for .env.local first to get keys.
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

    // 1. Check Schema (using rpc if available or just raw error inspection)
    // Actually, we can't query information_schema via supabase-js easily unless we have a helper or mapped table.
    // But we can try to Insert a dummy record and see the EXACT error.

    const testId = '00000000-0000-0000-0000-000000000000'; // dummy customer uuid logic? No, need valid text ID for customer (it's TEXT PK)

    // Create a temp customer
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

    // 2. Try to insert Tax Invoice with minimal valid fields
    console.log('Attempting Insert Tax Invoice...');
    const { data, error } = await supabase.from('customer_tax_invoices').insert({
        customer_id: custId,
        company_name: 'Test Company',
        tax_id: '1234567890123'
        // Intentionally missing others
    });

    if (error) {
        console.error('Insert Error 1 (Minimal):', error);
    } else {
        console.log('Insert Success 1 (Minimal)');
    }

    // 3. Try to insert with empty strings
    console.log('Attempting Insert Tax Invoice with Empty Strings...');
    const { error: error2 } = await supabase.from('customer_tax_invoices').insert({
        customer_id: custId,
        company_name: '', // Empty string
        tax_id: ''        // Empty string
    });

    if (error2) {
        console.error('Insert Error 2 (Empty Strings):', error2);
    } else {
        console.log('Insert Success 2 (Empty Strings)');
    }

    // 4. Try to insert with keys that might be wrong (legacy)
    console.log('Attempting Insert with extra keys...');
    const { error: error3 } = await supabase.from('customer_tax_invoices').insert({
        customer_id: custId,
        company_name: 'Extra',
        tax_id: '111',
        addrNumber: '123' // Invalid column
    });

    if (error3) {
        console.log('Insert Error 3 (Expected - Invalid Column):', error3.message);
    }

    // 4. Test customer_addresses schema (Did phase2.10 apply?)
    console.log('Attempting Insert Address with "addr_number"...');
    const { error: errorAddr } = await supabase.from('customer_addresses').insert({
        customer_id: custId,
        addr_number: '99/9', // This column exists ONLY if phase2.10 applied
        address: 'Full address'
    });

    if (errorAddr) {
        console.error('Address Insert Error (addr_number):', errorAddr.message);

        // Try old column name
        console.log('Attempting Insert Address with "house_number"...');
        const { error: errorAddrOld } = await supabase.from('customer_addresses').insert({
            customer_id: custId,
            house_number: '99/9',
            address: 'Full address'
        });
        if (!errorAddrOld) {
            console.log('SUCCESS with OLD column "house_number". MIGRATION 2.10 NOT APPLIED!');
        } else {
            console.error('Address Insert Error (house_number):', errorAddrOld.message);
        }
    } else {
        console.log('Address Insert Success (measured phase2.10 applied)');
    }

    // 5. Test Insert with explicitly undefined ID
    console.log('Attempting Insert with explicit undefined ID...');
    const payloadWithUndefined = {
        id: undefined,
        customer_id: custId,
        company_name: 'Undefined ID Corp',
        tax_id: '999999'
    };
    // JSON.stringify removes undefined, so this should mimic what happens over wire?
    // But supabase-js might process it differently before fetch.
    const { error: errorUndef } = await supabase.from('customer_tax_invoices').insert([payloadWithUndefined]); // Pass as array like in app

    if (errorUndef) {
        console.error('Insert Error (Undefined ID):', errorUndef.message);
    } else {
        console.log('Insert Success (Undefined ID)');
    }

    // Cleanup
    await supabase.from('customers').delete().eq('id', custId);
}

run();
