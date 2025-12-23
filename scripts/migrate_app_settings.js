require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting app_settings migration...');

    // 1. Fetch data from app_settings
    // We expect keys: quotation.default_terms, quotation.warranty_policy
    const { data: appSettings, error } = await supabase
        .from('app_settings')
        .select('*');

    if (error) {
        console.error('Error fetching app_settings:', error);
        // If table doesn't exist, we can't migrate.
        return;
    }

    if (!appSettings || appSettings.length === 0) {
        console.log('No data in app_settings.');
        return;
    }

    const updatePayload = {};

    appSettings.forEach(item => {
        if (item.key === 'quotation.default_terms') {
            updatePayload.quotation_default_terms = item.value.replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes if present
        } else if (item.key === 'quotation.warranty_policy') {
            updatePayload.quotation_warranty_policy = item.value.replace(/^"(.*)"$/, '$1');
        }
    });

    if (Object.keys(updatePayload).length > 0) {
        console.log('Migrating payload:', updatePayload);
        const { error: updateError } = await supabase
            .from('settings')
            .update(updatePayload)
            .eq('id', 'default');

        if (updateError) {
            console.error('Error updating settings:', updateError);
        } else {
            console.log('Successfully migrated app_settings to settings table.');
        }
    } else {
        console.log('No matching keys found in app_settings.');
    }
}

migrate();
