
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function checkSchema() {
    console.log('Checking orders table columns...');
    const { data: orders, error: orderError } = await supabase.from('orders').select('*').limit(1);
    if (orders && orders.length > 0) {
        console.log('Orders columns:', Object.keys(orders[0]));
        // Check specific address fields
        console.log('Order Sample (ADDR):', {
            delivery_address: orders[0].delivery_address, // Potential field?
            tax_invoice_address: orders[0].tax_invoice_address, // Potential field?
            shipping_address: orders[0].shipping_address
        });
    }

    console.log('\nChecking jobs table columns...');
    const { data: jobs, error: jobError } = await supabase.from('jobs').select('*').limit(1);
    if (jobs && jobs.length > 0) {
        console.log('Jobs columns:', Object.keys(jobs[0]));
        console.log('Job Sample (ADDR):', {
            location: jobs[0].location,
            site_address: jobs[0].site_address,
            install_address: jobs[0].install_address
        });
    }
}

checkSchema();
