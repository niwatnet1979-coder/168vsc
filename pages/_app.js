import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react'
import Head from 'next/head'
import { DebugProvider } from '../contexts/DebugContext'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/logo-512.png" />
        <meta name="theme-color" content="#4F46E5" />
      </Head>
      <SessionProvider session={session}>
        <DebugProvider>
          <Component {...pageProps} />
        </DebugProvider>
      </SessionProvider>
    </>
  )
}
