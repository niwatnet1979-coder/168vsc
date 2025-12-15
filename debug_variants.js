
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxsngjscyawiqbtocugp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVariants() {
    console.log('Fetching products...');
    // Fetch products with variants
    // We try to fetch some products that likely have variants
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(1); // Check first product column structure

    if (error) {
        console.error('Error fetching:', error);
        return;
    }

    console.log(`Fetched ${data.length} products.`);

    data.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            console.log(`\nProduct: ${p.id} / ${p.name}`);
            console.log('Variants:', JSON.stringify(p.variants, null, 2));

            // Check logic manually
            p.variants.forEach((v, i) => {
                const minStock = parseInt(v.minStock || 0);
                const currentStock = parseInt(v.stock || 0);
                console.log(`  Variant ${i}: Stock=${currentStock}, Min=${minStock}. Is Low? ${minStock > 0 && currentStock < minStock}`);
            });
        }
    });

    // Specifically check for one that might be AA001 if not in first 10
    const { data: specific, error: sErr } = await supabase.from('products').select('*').limit(5).order('updated_at', { ascending: false });
    if (specific) {
        console.log('\n--- Recently Updated Products ---');
        specific.forEach(p => {
            console.log(`Product: ${p.id} / ${p.product_code} / ${p.name}`);
            if (p.variants) {
                console.log(JSON.stringify(p.variants, null, 2));
            } else {
                console.log('No variants column or null');
            }
        });
    }
}

checkVariants();
