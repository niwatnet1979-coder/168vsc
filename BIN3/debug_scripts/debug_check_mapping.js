import { DataManager } from './lib/dataManager.js';

async function testMapping() {
    console.log('Testing getOrderById Mapping...');
    const orderId = 'OD0000001'; // Use a known order ID
    const order = await DataManager.getOrderById(orderId);

    if (!order) {
        console.error('Order not found!');
        return;
    }

    console.log('Order ID:', order.id);
    console.log('Customer Object:', JSON.stringify(order.customer, null, 2));

    if (order.customer && order.customer.addresses && order.customer.addresses.length > 0) {
        const addr = order.customer.addresses[0];
        console.log('Sample Address Keys:', Object.keys(addr));
        const expectedKeys = ['addrNumber', 'addrMoo', 'addrProvince'];
        const missingKeys = expectedKeys.filter(k => !addr[k]);
        if (missingKeys.length > 0) {
            console.warn('!!! BUG: Missing camelCase keys in addresses:', missingKeys);
        } else {
            console.log('Addresses are mapped correctly.');
        }
    } else {
        console.log('No addresses found for this customer.');
    }

    if (order.customer && order.customer.contacts && order.customer.contacts.length > 0) {
        const contact = order.customer.contacts[0];
        console.log('Sample Contact Keys:', Object.keys(contact));
        if (!contact.lineId && contact.line_id) {
            console.warn('!!! BUG: Missing lineId in contacts (found line_id instead)');
        }
    }
}

testMapping();
