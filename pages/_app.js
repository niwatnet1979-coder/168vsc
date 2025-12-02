import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        padding: '2px 6px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 9999,
        borderBottomRightRadius: '4px',
        pointerEvents: 'none', // Click through
        opacity: 0.7
      }}>
        v1.11
      </div>
      <Component {...pageProps} />
    </>
  )
}
