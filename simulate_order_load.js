const { supabase } = require('./lib/supabaseClient');

const orderId = 'e09ca266-beac-4f23-acdb-2dae62920fec';

async function simulate() {
    console.log('--- Simulating getOrderById ---');
    const { data: order } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*, product:products(name, description, product_code), variant:product_variants!product_variant_id(*))
        `)
        .eq('id', orderId)
        .single();

    if (!order) {
        console.log('Order not found');
        return;
    }

    console.log('Raw Item 1:', JSON.stringify(order.items[0], null, 2));

    console.log('\n--- Simulating useOrderLoader mapping ---');
    const processedItems = order.items.map(item => {
        const normalizedItem = {
            ...item,
            unitPrice: Number(item.unitPrice || item.unit_price || item.price || 0),
            price: Number(item.unitPrice || item.unit_price || item.price || 0),
            qty: Number(item.qty || item.quantity || 1),
        };

        const product = item.product;
        const variant = item.variant;

        if (product) {
            return {
                ...normalizedItem,
                product,
                selectedVariant: variant || null,
                variant_id: item.product_variant_id || variant?.id || null,
                variantId: item.product_variant_id || variant?.id || null,
            };
        }
        return normalizedItem;
    });

    console.log('Processed Item 1:', JSON.stringify(processedItems[0], null, 2));

    console.log('\n--- Simulating OrderItemModal productId resolution ---');
    const item = processedItems[0];
    const productIdResolutin = item.product_id || item.product_code || item.code;
    console.log('productId resolution in Modal:', productIdResolutin);

    console.log('\n--- Checking products.find in Modal ---');
    const { data: allProducts } = await supabase.from('products').select('*');
    const foundProduct = allProducts.find(p =>
        p.uuid === item.product_id ||
        p.product_code === item.product_code ||
        p.product_code === item.code ||
        p.id === item.code
    );
    console.log('Found product in Modal:', foundProduct ? `${foundProduct.product_code} (${foundProduct.uuid})` : 'Not found');
}

simulate();
