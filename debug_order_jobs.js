const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder() {
    const orderId = 'e09ca266-beac-4f23-acdb-2dae62920fec';

    console.log('Fetching keys for order:', orderId);

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('order_id', orderId);

    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }

    if (jobs && jobs.length > 0) {
        console.log('Found jobs:', jobs.length);
        jobs.forEach((job, idx) => {
            console.log(`Job #${idx + 1} (ID: ${job.id}):`);
            console.log('  - appointment_date:', job.appointment_date);
            console.log('  - completion_date:', job.completion_date);
        });
    } else {
        console.log('No jobs found for this order.');
    }
}

checkOrder();
