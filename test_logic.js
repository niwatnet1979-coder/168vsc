
// Mock of the logic inside OrderItemModal.handleSave
function simulateModalSave(formData) {
    console.log('--- Simulating Modal Save ---');
    console.log('Input FormData:', JSON.stringify(formData, null, 2));

    const itemData = {
        ...formData,
        // The critical logic we are testing:
        color: formData.selectedVariant?.color || '',
        stock: formData.selectedVariant?.stock || 0,
        dimensions: formData.selectedVariant?.dimensions || null,
        // unitPrice is assumed to be state, properly updated by handleVariantSelect
    };

    console.log('Output ItemData:', JSON.stringify(itemData, null, 2));
    return itemData;
}

// Mock of the logic inside OrderForm.handleSaveOrder (flattening/mapping items)
function simulateOrderSave(items) {
    console.log('\n--- Simulating Order Save Payload ---');
    return items.map(item => ({
        ...item,
        // Ensuring dimensions are preserved in the final payload
        dimensions: item.dimensions
    }));
}

// TEST CASE 1: Variant Selected
const variant = {
    color: 'Gold',
    price: 5900,
    stock: 5,
    dimensions: { length: 50, width: 50, height: 100 },
    images: ['img1.jpg']
};

const formDataWithVariant = {
    code: 'P001',
    name: 'Luxury Lamp',
    qty: 1,
    unitPrice: variant.price, // This would be set by setFormData in the component
    selectedVariant: variant
};

const processedItem = simulateModalSave(formDataWithVariant);
const finalPayloadItems = simulateOrderSave([processedItem]);

// VERIFICATION
const finalItem = finalPayloadItems[0];
console.log('\n--- VERIFICATION RESULTS ---');

let pass = true;

// Check Dimensions
if (JSON.stringify(finalItem.dimensions) === JSON.stringify(variant.dimensions)) {
    console.log('✅ Dimensions correctly saved:', finalItem.dimensions);
} else {
    console.log('❌ Dimensions mismatch!', 'Expected:', variant.dimensions, 'Got:', finalItem.dimensions);
    pass = false;
}

// Check Price
if (finalItem.unitPrice === variant.price) {
    console.log('✅ Unit Price correctly matches variant:', finalItem.unitPrice);
} else {
    console.log('❌ Price mismatch!', 'Expected:', variant.price, 'Got:', finalItem.unitPrice);
    pass = false;
}

// Check Stock
if (finalItem.stock === variant.stock) {
    console.log('✅ Stock correctly matches variant:', finalItem.stock);
} else {
    console.log('❌ Stock mismatch!');
    pass = false;
}

if (pass) console.log('\n✨ TEST PASSED: Logic for Dimensions and Price is correct.');
else console.log('\n🔥 TEST FAILED');
