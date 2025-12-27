
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
} catch (e) { }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function checkSchema() {
    console.log('Checking shipping_plan_items...')
    const { data: shipItems, error: shipError } = await supabase
        .from('shipping_plan_items')
        .select('*')
        .limit(1)

    if (shipError) console.error(shipError)
    else console.log('shipping_plan_items columns:', shipItems.length > 0 ? Object.keys(shipItems[0]) : 'No data (cant infer cols)')

    console.log('\nChecking inventory_items...')
    const { data: invItems, error: invError } = await supabase
        .from('inventory_items')
        .select('*')
        .limit(1)

    if (invError) console.error(invError)
    else console.log('inventory_items columns:', invItems.length > 0 ? Object.keys(invItems[0]) : 'No data')
}

checkSchema()
