
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSaveProduct() {
    console.log("Testing Save Product...");

    // 1. Create/Upsert Main Product
    const productPayload = {
        name: 'Test Product debug',
        category: 'AA โคมไฟระย้า',
        description: 'Debug Description',
        product_code: 'DEBUG-001-' + Date.now(), // Unique
        updated_at: new Date().toISOString()
    };

    console.log("Saving Product:", productPayload);
    const { data: savedProd, error: prodError } = await supabase
        .from('products')
        .upsert(productPayload, { onConflict: 'product_code' })
        .select()
        .single();

    if (prodError) {
        console.error("Product Save Error:", prodError);
        return;
    }
    console.log("Product Saved UUID:", savedProd.uuid);

    // 2. Save Variant
    const variantPayload = {
        product_id: savedProd.uuid,
        color: 'RG โรสโกลด์',
        size: '20x10x30',
        sku: savedProd.product_code + '-D20x10x30-PG',
        price: 10000,
        stock: 5,
        min_stock_level: 1,
        crystal_color: 'BK ดำ',
        image_url: null
    };

    console.log("Saving Variant:", variantPayload);
    const { data: savedVar, error: varError } = await supabase
        .from('product_variants')
        .upsert(variantPayload, { onConflict: 'sku' }) // Assuming SKU is unique constraint? Or ID?
        .select();

    if (varError) {
        console.error("Variant Save Error:", varError);
    } else {
        console.log("Variant Saved:", savedVar);
    }
}

testSaveProduct();
