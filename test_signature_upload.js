const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignatureUpload() {
    console.log('Testing signature upload to Storage...\n')

    // Test data
    const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    try {
        // Convert base64 to blob
        const base64Data = testBase64.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })

        console.log('✓ Blob created successfully')
        console.log(`  Size: ${blob.size} bytes`)

        // Try to upload
        const filePath = 'test/0/receiver.png'
        console.log(`\nUploading to: ${filePath}`)

        const { data, error } = await supabase.storage
            .from('payment-signatures')
            .upload(filePath, blob, {
                upsert: true,
                contentType: 'image/png'
            })

        if (error) {
            console.error('\n❌ Upload failed!')
            console.error('Error:', error)
            console.error('Error message:', error.message)
            console.error('Error details:', JSON.stringify(error, null, 2))
            return
        }

        console.log('\n✓ Upload successful!')
        console.log('Data:', data)

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('payment-signatures')
            .getPublicUrl(filePath)

        console.log('\n✓ Public URL generated:')
        console.log(publicData.publicUrl)

    } catch (error) {
        console.error('\n❌ Error:', error)
    }
}

testSignatureUpload()
