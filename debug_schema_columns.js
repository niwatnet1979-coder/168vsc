
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function checkSchema() {
    console.log('Checking jobs table columns...');

    // We can't query information_schema easily with supabase-js directly unless referencing it as table
    // But we can just select one row from jobs and see keys

    const { data, error } = await supabase.from('jobs').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
            console.log('Sample Data:', data[0]);
        } else {
            console.log('No jobs found to inspect columns.');
        }
    }
}

checkSchema();
