import nodemailer from 'nodemailer'
import crypto from 'crypto'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const { email } = req.body

    if (!email) {
        return res.status(400).json({ message: 'Email is required' })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Create a hash of the OTP + Email + Secret to verify later
    // In a real app with DB, we would store this. For stateless, we send it back to client.
    // The secret should be in env vars.
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-prod'
    const ttl = 5 * 60 * 1000 // 5 minutes
    const expires = Date.now() + ttl
    const data = `${email}.${otp}.${expires}`
    const hash = crypto.createHmac('sha256', secret).update(data).digest('hex')
    const fullHash = `${hash}.${expires}`

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER, // Your Gmail address
            pass: process.env.GMAIL_APP_PASSWORD // Your App Password
        }
    })

    try {
        await transporter.sendMail({
            from: `"168VSC System" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'รหัส OTP สำหรับเข้าสู่ระบบ 168VSC',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">รหัส OTP ของคุณ</h2>
                    <p>ใช้รหัสต่อไปนี้เพื่อเข้าสู่ระบบ (รหัสมีอายุ 5 นาที):</p>
                    <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1F2937;">${otp}</span>
                    </div>
                    <p style="color: #6B7280; font-size: 14px;">หากคุณไม่ได้ร้องขอรหัสนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
                </div>
            `
        })

        // Return success and the hash (to be sent back during login for verification)
        res.status(200).json({ success: true, hash: fullHash })
    } catch (error) {
        console.error('Error sending email:', error)
        res.status(500).json({ message: 'Failed to send OTP', error: error.message })
    }
}
