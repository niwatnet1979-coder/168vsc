
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
    console.log('Checking customers table columns...');
    const { data, error } = await supabase.from('customers').select('*').limit(1);
    if (error) console.error('Error:', error);
    else console.log('Columns found:', Object.keys(data[0] || {}));
}

checkSchema();
