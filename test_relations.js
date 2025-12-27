
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath))
        for (const k in envConfig) {
            process.env[k] = envConfig[k]
        }
    }
} catch (e) { console.error(e) }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function testRelationships() {
    console.log('Testing JOBS relationships...')

    // 1. Check location_id -> customer_addresses
    // We use the FK column as the hint !location_id
    const { data: locTest, error: locError } = await supabase
        .from('jobs')
        .select(`
            id,
            location_id,
            address:customer_addresses!location_id(*)
        `)
        .limit(1)

    if (locError) {
        console.log('location_id -> customer_addresses: FAILED', locError.message)
    } else {
        console.log('location_id -> customer_addresses: SUCCESS')
    }

    // 2. Check inspector_id -> customer_contacts
    const { data: inspTest, error: inspError } = await supabase
        .from('jobs')
        .select(`
            id,
            inspector_id,
            inspector:customer_contacts!inspector_id(*)
        `)
        .limit(1)

    if (inspError) {
        console.log('inspector_id -> customer_contacts: FAILED', inspError.message)
    } else {
        console.log('inspector_id -> customer_contacts: SUCCESS')
    }

    // 3. Check inspector_id -> site_inspectors (Alternate table?)
    // Note: Assuming site_inspectors is deprecated or alias for customer_contacts?
    // Let's check if site_inspectors table exists.
    const { error: tableError } = await supabase.from('site_inspectors').select('*').limit(1)
    if (!tableError) {
        console.log('Table site_inspectors EXISTS. Testing join...')
        const { error: inspError2 } = await supabase
            .from('jobs')
            .select(`inspector:site_inspectors!inspector_id(*)`)
            .limit(1)
        if (inspError2) console.log('inspector_id -> site_inspectors: FAILED', inspError2.message)
        else console.log('inspector_id -> site_inspectors: SUCCESS')
    } else {
        console.log('Table site_inspectors does NOT exist or not accessible.')
    }
}

testRelationships()
