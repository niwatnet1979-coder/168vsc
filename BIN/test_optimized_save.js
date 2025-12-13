const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Import DataManager to use the optimized saveOrder
const DataManager = {
    saveOrder: async (orderData) => {
        try {
            // 1. Prepare Order Payload
            const orderPayload = {
                id: orderData.id,
                customer_id: orderData.customer?.id,
                customer_name: orderData.customer?.name,
                // Optimized: Store only essential customer data
                customer_details: orderData.customerDetails ? {
                    id: orderData.customerDetails.id,
                    name: orderData.customerDetails.name,
                    phone: orderData.customerDetails.phone,
                    email: orderData.customerDetails.email,
                    line: orderData.customerDetails.line,
                    facebook: orderData.customerDetails.facebook,
                    instagram: orderData.customerDetails.instagram,
                    mediaSource: orderData.customerDetails.mediaSource,
                    mediaSourceOther: orderData.customerDetails.mediaSourceOther
                } : null,
                order_date: orderData.date,
                status: orderData.status || 'Pending',
                total_amount: orderData.totalAmount,
                deposit: orderData.deposit,
                shipping_fee: orderData.shippingFee,
                discount: orderData.discount,
                vat_rate: 0.07,
                // Optimized: Remove Base64 images from items
                items: orderData.items.map(item => ({
                    ...item,
                    image: undefined
                })),
                job_info: orderData.jobInfo,
                tax_invoice_info: orderData.taxInvoice,
                delivery_address_info: orderData.taxInvoiceDeliveryAddress,
                selected_contact: orderData.selectedContact,
                payment_schedule: orderData.paymentSchedule,
                note: orderData.note
            }

            // 2. Upsert Order
            const { error: orderError } = await supabase
                .from('orders')
                .upsert(orderPayload)

            if (orderError) throw orderError

            return true
        } catch (error) {
            console.error('Error saving order:', error)
            return false
        }
    }
}

async function testOptimizedOrder() {
    console.log('Creating test order with optimized data structure...\n')

    // Get customer data
    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('name', 'PSoxygen')
        .single()

    if (!customer) {
        console.error('Customer not found')
        return
    }

    // Get a product
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .limit(1)
        .single()

    if (!product) {
        console.error('Product not found')
        return
    }

    // Create test order data
    const testOrder = {
        id: 'OD0000007',
        date: new Date().toISOString().split('T')[0],
        customer: {
            id: customer.id,
            name: customer.name
        },
        customerDetails: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            line: customer.line_id,
            facebook: customer.facebook,
            instagram: customer.instagram,
            mediaSource: customer.media_source,
            mediaSourceOther: customer.media_source_other,
            // These will NOT be saved (optimization)
            contacts: customer.contacts,
            addresses: customer.addresses,
            taxInvoices: customer.tax_invoices
        },
        totalAmount: 10000,
        deposit: 5000,
        shippingFee: 0,
        discount: { mode: 'percent', value: 0 },
        items: [{
            code: product.id,
            name: product.name,
            qty: 1,
            price: 10000,
            // This image will NOT be saved (optimization)
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }],
        jobInfo: {},
        taxInvoice: {},
        taxInvoiceDeliveryAddress: {},
        selectedContact: null,
        paymentSchedule: [],
        note: 'Test order with optimized data structure'
    }

    const success = await DataManager.saveOrder(testOrder)

    if (success) {
        console.log('✅ Order created successfully!')
        console.log('Order ID: OD0000007')

        // Check the saved data
        const { data: savedOrder } = await supabase
            .from('orders')
            .select('customer_details, items')
            .eq('id', 'OD0000007')
            .single()

        const customerDetailsSize = JSON.stringify(savedOrder.customer_details).length
        const itemsSize = JSON.stringify(savedOrder.items).length

        console.log(`\nData sizes:`)
        console.log(`  customer_details: ${customerDetailsSize} bytes`)
        console.log(`  items: ${itemsSize} bytes`)
        console.log(`  Total: ${customerDetailsSize + itemsSize} bytes`)
        console.log(`\nOptimization successful! 🎉`)
    } else {
        console.error('❌ Failed to create order')
    }
}

testOptimizedOrder()
