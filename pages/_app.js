import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react'
import Head from 'next/head'
import { DebugProvider } from '../contexts/DebugContext'
import { LanguageProvider } from '../contexts/LanguageContext'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/logo-512.png" />
        <meta name="theme-color" content="#4F46E5" />
      </Head>
      <SessionProvider session={session}>
        <DebugProvider>
          <LanguageProvider>
            <Component {...pageProps} />
          </LanguageProvider>
        </DebugProvider>
      </SessionProvider>
    </>
  )
}
