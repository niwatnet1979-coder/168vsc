
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Mimic the helper functions from dataManager.js
const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return typeof id === 'string' && uuidRegex.test(id)
}

const preparePayload = (item, extraFields = {}) => {
    const payload = { ...extraFields }
    if (isValidUUID(item.id)) {
        payload.id = item.id
    }
    return payload
}

async function simulateSave() {
    console.log("Simulating saveCustomer...");

    // 1. Create/Get Customer
    // mimicking creating a new customer or using existing
    const customerId = 'test-sim-' + Date.now();
    const customerData = {
        id: customerId,
        name: 'Simulation Customer',
        taxInvoices: [
            {
                id: '1765983476739', // Temp ID from user logs
                companyName: 'niwat',
                taxId: '1234567890222',
                addrNumber: '99/9',
                addrProvince: 'Bangkok'
            }
        ]
    };

    console.log("Customer ID:", customerId);

    // Upsert Customer
    console.log("Upserting Customer...");
    const { error: custError } = await supabase.from('customers').upsert({
        id: customerId,
        name: customerData.name
    });
    if (custError) {
        console.error("Customer Upsert Failed:", custError);
        return;
    }
    console.log("Customer Upserted.");

    // Process Tax Invoices (Logic copied from dataManager.js)
    const validTaxInvoices = customerData.taxInvoices.filter(tax => {
        const isUUID = isValidUUID(tax.id)
        const hasData = (tax.companyName && tax.companyName.trim() !== '') && (tax.taxId && tax.taxId.trim() !== '')
        return isUUID || hasData
    });

    console.log("Valid Tax Invoices:", validTaxInvoices.length);

    if (validTaxInvoices.length > 0) {
        const taxInvoicesPayload = validTaxInvoices.map(tax => {
            const addressParts = [
                tax.addrNumber && `เลขที่ ${tax.addrNumber}`,
                tax.addrProvince && `จังหวัด${tax.addrProvince}`
            ].filter(Boolean).join(' ');

            const extraFields = {
                customer_id: customerId,
                company_name: tax.companyName,
                tax_id: tax.taxId,
                address: addressParts,
                branch_number: null,
                branch_name: null
            };

            return preparePayload(tax, extraFields);
        });

        const newTaxInvoices = taxInvoicesPayload.filter(t => !t.id);

        console.log("Inserting Payload:", newTaxInvoices);

        const { data, error } = await supabase.from('customer_tax_invoices').insert(newTaxInvoices).select();

        if (error) {
            console.error("Insert Failed:", error);
        } else {
            console.log("Insert Success:", data);
        }
    }
}

simulateSave();
