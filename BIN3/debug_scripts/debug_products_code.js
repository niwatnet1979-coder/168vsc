
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    console.log("Checking products starting with AA...");
    const { data: products, error } = await supabase
        .from('products')
        .select('uuid, product_code, name, category')
        .or('product_code.ilike.AA%');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${products.length} products.`);
    products.forEach(p => {
        console.log(`UUID: ${p.uuid}, Code: ${p.product_code}, Name: ${p.name}, Category: ${p.category}`);
    });
}

checkProducts();
