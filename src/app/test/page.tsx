export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Sayfası</h1>
      <p>Bu sayfa açılıyorsa, Next.js çalışıyor.</p>
      <p>Environment Variables:</p>
      <ul>
        <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'TANIMLANMAMIŞ'}</li>
        <li>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'VAR' : 'YOK'}</li>
      </ul>
    </div>
  )
} 