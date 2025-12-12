
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mxsngjscyawiqbtocugp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const getJobById = async (id) => {
    try {
        console.log(`Searching for Job ID: ${id}`);
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                customer:customers(*),
                order:orders(*)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Supabase Error:', error);
            // Try finding it without single() to see if multiple exist?
            const { data: multiple, error: multError } = await supabase.from('jobs').select('id').eq('id', id);
            console.log('Check lookup count:', multiple?.length);
            return null;
        }

        if (!data) {
            console.log('No data returned.');
            return null;
        }

        console.log('Found Job:', data.id);
        console.log('Job Data:', JSON.stringify(data, null, 2));
        if (data.order) {
            console.log('Order Data:', JSON.stringify(data.order, null, 2));
        }

        // Simulate the transformation logic
        let productSnapshot = job.product_snapshot
        if (typeof productSnapshot === 'string') {
            try { productSnapshot = JSON.parse(productSnapshot) } catch (e) { }
        }

        const productName = productSnapshot?.name || job.product_name || 'สินค้าไม่ระบุ'
        console.log('Product Name:', productName);

        return data;

    } catch (error) {
        console.error('Catch Error:', error);
        return null;
    }
}

// Test with the reported ID
getJobById('JB0000003');
