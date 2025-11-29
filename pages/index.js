import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: 32, fontFamily: 'Inter, system-ui, -apple-system' }}>
      <h1>168VSC — 168 Interior Lighting</h1>
      <p>Welcome. Use the quotation page to create a sales quotation (ใบเสนอราคา).</p>
      <p style={{ display: 'flex', gap: 12 }}>
        <Link href="/quotation" style={{ display: 'inline-block', padding: '8px 14px', background: '#0070f3', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
          Open Quotation
        </Link>
        <Link href="/order" style={{ display: 'inline-block', padding: '8px 14px', background: '#10b981', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
          Create Purchase Order
        </Link>
      </p>
    </main>
  )
}
