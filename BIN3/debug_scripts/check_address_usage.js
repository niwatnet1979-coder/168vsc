
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAddressUsage(addressId) {
    console.log(`Checking usage for address ID: ${addressId}`);

    // Check jobs table
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id')
        .eq('site_address_id', addressId);

    if (error) {
        console.error('Error checking jobs:', error);
        return;
    }

    if (jobs && jobs.length > 0) {
        console.log(`Address is used in ${jobs.length} jobs:`);
        jobs.forEach(job => {
            console.log(`- Job ID: ${job.job_running_id} (${job.client_name})`);
        });
    } else {
        console.log('Address is NOT linked to any jobs.');
    }
}

// The ID from the screenshot for "True Corporation"
const targetAddressId = '0ab17cc0-d4b1-4ee6-ad24-f7592f29184a';

checkAddressUsage(targetAddressId).catch(err => console.error(err));
