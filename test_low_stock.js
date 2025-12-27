
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Mock supabase client for the module if needed, or just re-implement the logic to test the QUERY.
// Since we want to test the function, let's try to import it.
// However, ES modules vs CommonJS might be tricky. Next.js uses ESM/Babel.
// Easier to just run the logic from the script directly to verify the DATA.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLowStock() {
    console.log("Fetching variants...");
    const { data: variants, error: vError } = await supabase
        .from('product_variants')
        .select(`
            *,
            product:products(name, product_code)
        `);

    if (vError) { console.error(vError); return; }
    console.log(`Found ${variants.length} variants.`);

    console.log("Fetching live stock...");
    const { data: liveStock, error: viewError } = await supabase
        .from('view_product_stock_live')
        .select('*');

    if (viewError) { console.error(viewError); return; }
    console.log(`Found ${liveStock.length} stock records.`);

    const stockMap = {};
    if (liveStock) {
        liveStock.forEach(item => {
            stockMap[item.variant_id] = item;
        });
    }

    const lowStock = variants.map(v => {
        const sInfo = stockMap[v.id] || {};
        const currentStock = sInfo.physical_stock ?? v.stock ?? 0;
        const minStock = v.min_stock_level || 0;

        // Debug specific SKU
        if (v.min_stock_level > 0) {
            console.log(`Checking ${v.sku}: Stock=${currentStock}, Min=${minStock}, IsLow=${currentStock <= minStock}`);
        }

        return {
            sku: v.sku,
            current_stock: currentStock,
            min_stock_level: minStock,
            is_low: minStock > 0 && currentStock <= minStock
        };
    }).filter(item => item.is_low);

    console.log("Low Stock Items:", lowStock);
}

testLowStock();
