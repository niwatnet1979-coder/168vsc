
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

async function checkBatch() {
    console.log('Checking batch linkage...');
    const teamName = 'ทีมช่างกี';
    const batchId = 'd23cc329-9fc1-401a-becd-442da7c087e5';

    // 1. Get Team ID
    const { data: teams } = await supabase.from('teams').select('*').eq('name', teamName);
    const team = teams[0];

    if (!team) {
        console.log(`Team "${teamName}" NOT FOUND in DB.`);
        return;
    }
    console.log(`Team Found: ${team.name} (ID: ${team.id})`);

    // 2. Get Batch
    const { data: batch } = await supabase.from('team_service_fees').select('*').eq('id', batchId).single();

    if (!batch) {
        console.log(`Batch ${batchId} NOT FOUND in DB.`);
    } else {
        console.log('Batch Found:', batch);
        console.log(`Batch matches team? ${batch.team_id === team.id}`);
    }
}

checkBatch();
