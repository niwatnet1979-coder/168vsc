import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import crypto from 'crypto'

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
            // Note: Disabled user check is done client-side in AppLayout
            // because NextAuth callbacks run server-side and can't access localStorage
            return true
        },
        async session({ session, token }) {
            // Add user info to session
            if (session?.user) {
                session.user.id = token.sub
                session.user.email = token.email

                // Basic role assignment (will be overridden by client-side team_data)
                const email = token.email?.toLowerCase() || ''
                if (email.includes('admin') || email === 'niwatnet1979@gmail.com') {
                    session.user.role = 'admin'
                    session.user.team = 'All Teams'
                } else {
                    session.user.role = 'user'
                    session.user.team = 'ทีม A'
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
