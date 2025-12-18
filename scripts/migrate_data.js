
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    console.log("Starting Data Migration...");

    // 1. Migrate Products & Variants
    console.log("Fetching Products...");
    const { data: products, error: prodError } = await supabase.from('products').select('*');
    if (prodError) throw prodError;

    for (const p of products) {
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
            console.log(`Processing Product: ${p.name} (${p.variants.length} variants)`);

            for (const v of p.variants) {
                // Construct Variant Payload
                const variantPayload = {
                    product_id: p.uuid,
                    color: v.color || null,
                    size: v.dimensions ? `${v.dimensions.length}x${v.dimensions.width}x${v.dimensions.height}` : null,
                    price: v.price || p.price,
                    stock: parseInt(v.stock || 0),
                    min_stock: parseInt(v.minStock || 0),
                    image_url: v.images && v.images[0] ? v.images[0] : null,
                    sku: v.sku || `${p.product_code}-${v.color ? v.color.substring(0, 3) : 'VAR'}`
                };

                const { error: insError } = await supabase.from('product_variants').insert(variantPayload);
                if (insError) console.error(`Failed to insert variant for ${p.name}:`, insError.message);
            }
        }
    }

    // 2. Migrate Orders & Items
    console.log("Fetching Orders...");
    const { data: orders, error: ordError } = await supabase.from('orders').select('*');
    if (ordError) throw ordError;

    for (const o of orders) {
        if (o.items && Array.isArray(o.items) && o.items.length > 0) {
            console.log(`Processing Order #${o.id}`);

            for (const item of o.items) {
                // Match Variant
                const prodId = item.product_id || item.id;
                if (!prodId) continue;

                const color = item.selectedVariant?.color || item.color;
                let variantId = null;

                if (color) {
                    const { data: variants } = await supabase
                        .from('product_variants')
                        .select('id')
                        .eq('product_id', prodId)
                        .ilike('color', color)
                        .limit(1);

                    if (variants && variants.length > 0) {
                        variantId = variants[0].id;
                    }
                }

                // If variant not found, maybe fallback to checking SKU? 
                // For now, if no variant ID, we just insert without it (it's nullable? No, FK is strict?)
                // Schema definition: product_variant_id UUID REFERENCES ...
                // It should be nullable if we want to allow items without variants. 
                // My script: product_variant_id UUID REFERENCES product_variants(id).
                // It defaults to NULL if not supplied, which is fine unless I made it NOT NULL. I didn't.

                const itemPayload = {
                    order_id: o.id, // ID is TEXT now
                    product_id: prodId,
                    product_variant_id: variantId,
                    quantity: parseInt(item.qty || item.quantity || 1),
                    unit_price: parseFloat(item.price || item.unitPrice || 0),
                    status: o.status
                };

                const { error: itemErr } = await supabase.from('order_items').insert(itemPayload);
                if (itemErr) console.error(`Failed to insert item for Order #${o.id}:`, itemErr.message);
            }
        }
    }

    console.log("Migration Complete.");
}

migrateData().catch(e => console.error(e));
