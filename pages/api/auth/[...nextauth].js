import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        CredentialsProvider({
            name: 'OTP',
            credentials: {
                email: { label: "Email", type: "text" },
                otp: { label: "OTP", type: "text" }
            },
            async authorize(credentials) {
                const allowedEmails = [
                    'niwatnet1979@gmail.com',
                    'saseng1981@gmail.com',
                    'katoon2444@gmail.com'
                ]

                if (allowedEmails.includes(credentials.email) && credentials.otp === '123456') {
                    return {
                        id: credentials.email,
                        email: credentials.email,
                        name: credentials.email.split('@')[0],
                        image: null
                    }
                }
                return null
            }
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Allow all Google sign-ins
            return true
        },
        async session({ session, token }) {
            // Add user info to session
            if (session?.user) {
                session.user.id = token.sub
                session.user.email = token.email

                // Determine role based on email or database
                // TODO: Replace with actual role lookup from database
                const email = token.email?.toLowerCase() || ''

                if (email.includes('admin') || email === 'niwatnet1979@gmail.com') {
                    session.user.role = 'admin'
                    session.user.team = 'All Teams'
                } else if (email.includes('qc')) {
                    session.user.role = 'qc'
                    session.user.team = 'ทีม A' // TODO: Get from database
                } else {
                    session.user.role = 'ช่าง'
                    session.user.team = 'ทีม A' // TODO: Get from database
                }
            }
            return session
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
