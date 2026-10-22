export default function HomePage() {
  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', lineHeight: 1.6 }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px', color: '#0f172a' }}>SwapStay — Backend Service</h1>
        <p style={{ color: '#475569', fontSize: '1.1rem' }}>
          Four-City India MVP (Mumbai, Bengaluru, Delhi NCR, Hyderabad)
        </p>
        <div style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem' }}>
          Backend API Online &amp; Ready for Frontend Integration
        </div>
      </header>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b' }}>Frontend Integration Contract</h2>
        <p style={{ color: '#334155' }}>
          All endpoints return a standardized JSON envelope. Auth headers accept <code>Authorization: Bearer &lt;supabase_jwt&gt;</code> or active Supabase session cookies.
        </p>
        <div style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem' }}>
          <span style={{ color: '#94a3b8' }}>// Standard Response Structure</span><br/>
          {`{ "success": true, "data": { ... }, "meta": { "page": 1, "total": 10 } }`}<br/><br/>
          <span style={{ color: '#94a3b8' }}>// Error Structure</span><br/>
          {`{ "success": false, "error": { "code": "INSUFFICIENT_CREDITS", "message": "..." } }`}
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b' }}>Available API Endpoints</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '10px 12px' }}>Method</th>
              <th style={{ padding: '10px 12px' }}>Endpoint</th>
              <th style={{ padding: '10px 12px' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2563eb' }}>GET</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/properties/search</td>
              <td style={{ padding: '10px 12px' }}>Search eligible homes by city, dates, guests, SwapScore</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/properties</td>
              <td style={{ padding: '10px 12px' }}>Create new property listing</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2563eb' }}>GET</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/properties/:id</td>
              <td style={{ padding: '10px 12px' }}>Public property detail with SwapScore breakdown</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/properties/:id/availability</td>
              <td style={{ padding: '10px 12px' }}>Update host availability calendar</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/swaps</td>
              <td style={{ padding: '10px 12px' }}>Propose direct swap between two properties</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/swaps/:id/accept</td>
              <td style={{ padding: '10px 12px' }}>Mutual consent acceptance &amp; atomic confirmation</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/bookings</td>
              <td style={{ padding: '10px 12px' }}>Request credit stay (checks wallet, reserves credits)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/bookings/:id/confirm</td>
              <td style={{ padding: '10px 12px' }}>Host confirms booking request</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#dc2626' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/bookings/:id/cancel</td>
              <td style={{ padding: '10px 12px' }}>Cancel booking and release reserved credits</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2563eb' }}>GET</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/wallet</td>
              <td style={{ padding: '10px 12px' }}>Available vs reserved credit balance</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#2563eb' }}>GET</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/wallet/transactions</td>
              <td style={{ padding: '10px 12px' }}>Append-only ledger history</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/reviews</td>
              <td style={{ padding: '10px 12px' }}>Submit review for completed stay</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#16a34a' }}>POST</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>/api/reports</td>
              <td style={{ padding: '10px 12px' }}>Report safety, property, or fraud issue</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
