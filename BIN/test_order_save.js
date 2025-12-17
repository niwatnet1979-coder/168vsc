
const { DataManager } = require('./lib/dataManager');

// Mock DataManager.saveOrder to inspect payload
const originalSaveOrder = DataManager.saveOrder;
DataManager.saveOrder = async (orderPayload) => {
    console.log('--- MOCK SAVE ORDER PAYLOAD ---');
    console.log(JSON.stringify(orderPayload.items, null, 2));
    return true; // Simulate success
};

// Mock Data to simulate OrderForm state
const mockVariant = {
    color: 'Gold',
    price: 5000,
    stock: 10,
    dimensions: { length: 10, width: 20, height: 30 },
    images: ['variant-img.jpg']
};

const mockItem = {
    code: 'P001',
    name: 'Test Product',
    qty: 1,
    unitPrice: mockVariant.price, // Should be set from variant
    selectedVariant: mockVariant,
    // ... other fields matching OrderItemModal output
};

// Simulate the processing logic from OrderForm.handleSaveOrder
// (Simplified version of what triggers DataManager.saveOrder)
async function testSaveLogic() {
    console.log('Starting Test: Verify Dimensions & Price in Order Payload');

    // Logic from OrderItemModal.handleSave (flattening variant data)
    const itemData = {
        ...mockItem,
        color: mockItem.selectedVariant?.color || '',
        stock: mockItem.selectedVariant?.stock || 0,
        dimensions: mockItem.selectedVariant?.dimensions || null,
        // unitPrice is already set in mockItem based on variant selection logic in modal
    };

    const items = [itemData];

    const orderPayload = {
        id: 'TEST-ORDER-001',
        items: items,
        // ... other required fields
    };

    await DataManager.saveOrder(orderPayload);
}

testSaveLogic();
