const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPaymentSignatures() {
    console.log('=== Checking Payment Signatures in Database ===\n')

    const { data, error } = await supabase
        .from('orders')
        .select('id, payment_schedule')
        .eq('id', 'OD0000001')
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Order ID:', data.id)
    console.log('Payment Schedule:', data.payment_schedule)

    if (data.payment_schedule && data.payment_schedule.length > 0) {
        data.payment_schedule.forEach((payment, index) => {
            console.log(`\n=== Payment ${index} ===`)
            console.log('Date:', payment.date)
            console.log('Amount:', payment.amount)
            console.log('Method:', payment.paymentMethod)

            const receiverSig = payment.receiverSignature
            const payerSig = payment.payerSignature

            console.log('\nReceiver Signature:')
            if (receiverSig) {
                if (receiverSig.startsWith('http')) {
                    console.log('  ✅ URL:', receiverSig)
                } else if (receiverSig.startsWith('data:image')) {
                    console.log('  ❌ Base64 (length:', receiverSig.length, 'bytes)')
                } else {
                    console.log('  ❓ Unknown format:', receiverSig.substring(0, 50))
                }
            } else {
                console.log('  ⚠️  No signature')
            }

            console.log('\nPayer Signature:')
            if (payerSig) {
                if (payerSig.startsWith('http')) {
                    console.log('  ✅ URL:', payerSig)
                } else if (payerSig.startsWith('data:image')) {
                    console.log('  ❌ Base64 (length:', payerSig.length, 'bytes)')
                } else {
                    console.log('  ❓ Unknown format:', payerSig.substring(0, 50))
                }
            } else {
                console.log('  ⚠️  No signature')
            }
        })
    } else {
        console.log('\n⚠️  No payment schedule found')
    }
}

checkPaymentSignatures()
