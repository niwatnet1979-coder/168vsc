
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mxsngjscyawiqbtocugp.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getLowStockItems() {
    try {
        console.log('Querying products...');
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select('uuid, name, product_code, image, variants')

        if (prodError) throw prodError

        console.log(`Fetched ${products?.length} products.`);

        const lowStock = []

        products.forEach(product => {
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach((variant, index) => {
                    const minStock = parseInt(variant.minStock || 0)
                    const currentStock = parseInt(variant.stock || 0)

                    if (minStock > 0 && currentStock < minStock) {
                        // Helper to generate display name
                        let variantName = product.name
                        if (variant.color) variantName += ` - ${variant.color}`
                        if (variant.crystalColor) variantName += ` (${variant.crystalColor})`

                        // Helper to generate display code
                        let variantCode = product.product_code || ''
                        if (variant.color) variantCode += `-${variant.color.substring(0, 2).toUpperCase()}`

                        lowStock.push({
                            id: `${product.uuid}_v${index}`,
                            product_id: product.uuid,
                            uuid: product.uuid,
                            name: variantName,
                            code: variantCode,
                            image_url: (variant.images && variant.images[0]) || product.image,
                            current_stock: currentStock,
                            min_stock_level: minStock,
                            reorder_qty: minStock - currentStock
                        })
                    }
                })
            } else {
                console.log(`Product ${product.name} has no valid variants array.`);
            }
        })

        console.log(`Found ${lowStock.length} low stock items.`);
        console.log(JSON.stringify(lowStock, null, 2));
        return lowStock
    } catch (error) {
        console.error("Error fetching low stock items:", error)
        return []
    }
}

getLowStockItems();
