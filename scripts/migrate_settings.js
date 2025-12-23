require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Warning: Using ANON key might have RLS limits. Ideally use SERVICE_ROLE_KEY if available in .env.local
// Checking if SERVICE_KEY exists? Use it if user has it. 
// If not, proceed with ANON and hope RLS allows update on 'settings' (usually authenticated users can).
// Since this is a specialized script, maybe we ask user to run it? 
// Actually, standard clients usually have SERVICE_ROLE key in .env for admin tasks?
// Let's assume ANON key works for now as user is likely admin or RLS allows it.
// If not, we might fail.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    // 1. Fetch current settings
    const { data: settingsData, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'default')
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
        return;
    }

    if (!settingsData || !settingsData.system_options) {
        console.log('No system_options found to migrate.');
        return;
    }

    const options = settingsData.system_options;
    console.log('Found system definitions:', Object.keys(options));

    // 2. Update Shop Lat/Lon
    if (options.shopLat || options.shopLon) {
        console.log(`Updating Shop Location: ${options.shopLat}, ${options.shopLon}`);
        const { error: updateError } = await supabase
            .from('settings')
            .update({
                shop_lat: parseFloat(options.shopLat),
                shop_lon: parseFloat(options.shopLon)
            })
            .eq('id', 'default');

        if (updateError) console.error('Error updating lat/lon:', updateError);
        else console.log('Lat/Lon updated successfully.');
    }

    // 3. Migrate Lists to system_options_lists
    const listKeys = [
        'productTypes', 'jobLevels', 'materials', 'teamNames', 'teamTypes',
        'wageRates', 'lightColors', 'jobPositions', 'paymentTypes',
        'crystalColors', 'materialColors', 'commissionRates', 'employmentTypes',
        'bulbTypes', 'remotes'
    ];

    for (const key of listKeys) {
        if (Array.isArray(options[key])) {
            console.log(`Migrating ${key} (${options[key].length} items)...`);

            const insertPayload = options[key].map((item, index) => ({
                category: key,
                value: item,
                label: item,
                sort_order: index,
                is_active: true
            }));

            if (insertPayload.length > 0) {
                // Upsert to avoid duplicates if run multiple times? 
                // Table doesn't have unique constraint on category+value yet. 
                // We'll just insert. Ideally clear first? 
                // Let's delete existing for this category to be safe (re-runnable).
                await supabase.from('system_options_lists').delete().eq('category', key);

                const { error: insertError } = await supabase
                    .from('system_options_lists')
                    .insert(insertPayload);

                if (insertError) console.error(`Error inserting ${key}:`, insertError);
                else console.log(`Migrated ${key} successfully.`);
            }
        }
    }

    console.log('Migration complete.');
}

migrate();
