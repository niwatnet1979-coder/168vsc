
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

async function checkTeams() {
    console.log('Checking teams table...');

    const { data, error } = await supabase.from('teams').select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Teams Found:', data.length);
        data.forEach(t => {
            console.log(`ID: ${t.id}, Name: "${t.name}"`);
        });
    }
}

checkTeams();
