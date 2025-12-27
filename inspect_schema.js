
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Try to load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath))
        for (const k in envConfig) {
            process.env[k] = envConfig[k]
        }
    }
} catch (e) {
    console.error('Error loading .env.local', e)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchema() {
    console.log('--- Inspecting JOBS table structure ---')
    // Fetch 1 row to see actual columns
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching jobs:', error)
    } else if (jobs.length === 0) {
        console.log('Jobs table is empty. Cannot infer columns from data.')
        // If empty, we can try to insert a dummy to fail and see missing columns? No that's risky.
        // We will try to rely on what columns we see in the select if data existed.
        // If empty, we might have to assume standard columns or check migrations files.
    } else {
        console.log('Columns found in jobs table:', Object.keys(jobs[0]))
    }

    console.log('\n--- Inspecting ORDERS table relationships ---')
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id, customer_id, delivery_address_id')
        .limit(1)

    if (orderError) console.error(orderError)
    else console.log('Orders sample:', orders[0])

    console.log('\n--- Testing suspected relationships for JOBS ---')
    // Test location_id
    const { error: relError1 } = await supabase.from('jobs').select('id, location_id').limit(1)
    if (relError1) console.log('location_id: X', relError1.message)
    else console.log('location_id: OK')

    // Test install_location_id
    const { error: relError2 } = await supabase.from('jobs').select('id, install_location_id').limit(1)
    if (relError2) console.log('install_location_id: X', relError2.message)
    else console.log('install_location_id: OK')

    // Test site_address_id
    const { error: relError3 } = await supabase.from('jobs').select('id, site_address_id').limit(1)
    if (relError3) console.log('site_address_id: X', relError3.message)
    else console.log('site_address_id: OK')
}

inspectSchema()
