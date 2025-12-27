
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

async function checkSchema() {
    console.log('Checking jobs table schema...')

    // Get Columns
    const { data: columns, error: colError } = await supabase
        .rpc('get_table_info', { table_name: 'jobs' })

    // If RPC not available (it's custom), try basic select if possible, or just raw query if we had access (we don't have direct SQL access usually, only via client)
    // Actually, we can't run arbitrary SQL unless we have a backend function.
    // But we can check if column exists by selecting it.

    // Alternative: List constraints via rpc if available, or just try to deduce from error.
    // Let's try to query just the column.

    const { data: jobsSample, error: sampleError } = await supabase
        .from('jobs')
        .select('site_address_id')
        .limit(1)

    if (sampleError) {
        console.error('Error selecting site_address_id:', sampleError)
    } else {
        console.log('Column site_address_id exists.')
    }

    // Check relationship by trying to join with correct table name
    console.log('Testing join with customer_addresses...')
    const { data: joinTest, error: joinError } = await supabase
        .from('jobs')
        .select('id, customer_addresses!site_address_id(*)')
        .limit(1)

    if (joinError) {
        console.error('Error joining customer_addresses!site_address_id:', joinError)
    } else {
        console.log('Join with customer_addresses!site_address_id works!')
    }

    console.log('Testing join with site_address_id (as table?)...')
    const { data: joinTest2, error: joinError2 } = await supabase
        .from('jobs')
        .select('id, site_address_id(*)')
        .limit(1)

    if (joinError2) {
        console.error('Error joining site_address_id(*):', joinError2)
    } else {
        console.log('Join with site_address_id(*) works!')
    }
}

checkSchema()
