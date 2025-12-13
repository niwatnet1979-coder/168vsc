const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testActualUpload() {
    console.log('=== Testing ACTUAL signature upload ===\n')

    // Use a real base64 signature (small test image)
    const testSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    try {
        console.log('1. Converting Base64 to Blob...')
        const base64Data = testSignature.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        console.log('   ✓ Blob created:', blob.size, 'bytes\n')

        console.log('2. Uploading to Storage...')
        const filePath = 'TEST001/0/receiver.png'
        console.log('   Path:', filePath)
        console.log('   Bucket: payment-signatures\n')

        const { data, error } = await supabase.storage
            .from('payment-signatures')
            .upload(filePath, blob, {
                upsert: true,
                contentType: 'image/png'
            })

        if (error) {
            console.error('   ❌ Upload FAILED!')
            console.error('   Error:', error.message)
            console.error('   Details:', JSON.stringify(error, null, 2))
            return
        }

        console.log('   ✓ Upload successful!')
        console.log('   Data:', data)

        console.log('\n3. Getting public URL...')
        const { data: publicData } = supabase.storage
            .from('payment-signatures')
            .getPublicUrl(filePath)

        console.log('   ✓ Public URL:', publicData.publicUrl)

        console.log('\n✅ SUCCESS! Signature upload is working!')

    } catch (error) {
        console.error('\n❌ ERROR:', error.message)
        console.error('Stack:', error.stack)
    }
}

testActualUpload()
