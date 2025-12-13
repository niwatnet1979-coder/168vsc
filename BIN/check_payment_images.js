const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPaymentSchedule() {
    console.log('=== Checking payment_schedule for images ===\n')

    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, payment_schedule')
        .not('payment_schedule', 'is', null)
        .limit(10)

    if (error) {
        console.error('Error:', error)
        return
    }

    let foundImages = false

    orders.forEach(order => {
        if (!order.payment_schedule || order.payment_schedule.length === 0) return

        order.payment_schedule.forEach((payment, idx) => {
            const paymentStr = JSON.stringify(payment)

            // Check for base64 images
            const hasReceiverSignature = payment.receiverSignature?.startsWith('data:image')
            const hasPayerSignature = payment.payerSignature?.startsWith('data:image')

            if (hasReceiverSignature || hasPayerSignature) {
                foundImages = true
                console.log(`Order ${order.id} - Payment ${idx + 1}:`)

                if (hasReceiverSignature) {
                    const size = payment.receiverSignature.length
                    console.log(`  ✗ receiverSignature: ${size} bytes (Base64 image)`)
                }

                if (hasPayerSignature) {
                    const size = payment.payerSignature.length
                    console.log(`  ✗ payerSignature: ${size} bytes (Base64 image)`)
                }

                console.log(`  Payment date: ${payment.date}`)
                console.log(`  Amount: ${payment.amount}`)
                console.log('')
            }
        })
    })

    if (!foundImages) {
        console.log('✅ No Base64 images found in payment_schedule')
    } else {
        console.log('\n⚠️ Found Base64 images in payment_schedule!')
        console.log('These should be uploaded to storage and stored as URLs instead.')
    }
}

checkPaymentSchedule()
