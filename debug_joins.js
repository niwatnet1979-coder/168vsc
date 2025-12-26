
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

async function checkJoins() {
    const jobId = '00d271cb-9b94-42d9-8cad-8322f4debc26'; // ID from previous debug output
    console.log(`Testing Joins for Job ID: ${jobId}`);

    const { data, error } = await supabase
        .from('jobs')
        .select(`
            id,
            team,
            team_payment_id,
            inspector_id,
            siteInspectorRecord:inspector_id(*)
        `)
        .eq('id', jobId)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Job Data:', data);
        console.log('Inspector Record:', data.siteInspectorRecord);
    }
}

checkJoins();
