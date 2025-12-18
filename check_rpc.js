
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRPC() {
    console.log("Checking RPCs...");
    // There is no direct "list rpcs" in client.
    // But we can try to call a common one like 'exec_sql' or 'run_query'
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error) {
        console.log("exec_sql failed:", error.message);
    } else {
        console.log("exec_sql success!");
    }
}

checkRPC();
