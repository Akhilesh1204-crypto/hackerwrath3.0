export default function HomePage() {
  return (
    <main style={{ maxWidth: '960px', margin: '40px auto', padding: '0 24px', lineHeight: 1.6, color: '#0f172a' }}>
      <header style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>
            SS
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              SwapStay — Backend Service &amp; API
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
              Four-City India MVP (Mumbai, Bengaluru, Delhi NCR, Hyderabad)
            </p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
          ● Authoritative Backend Online &amp; Database Connected
        </div>
      </header>

      {/* FRONTEND INTEGRATION CONTRACT */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
          Frontend Developer Contract
        </h2>
        <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '16px' }}>
          All backend routes return a standardized JSON envelope. The frontend should call these endpoints and handle validation and conflict error codes:
        </p>
        <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '20px', borderRadius: '12px', fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.85rem', lineHeight: 1.5 }}>
          <span style={{ color: '#94a3b8' }}>// Standard Successful Response (HTTP 200 / 201)</span><br />
          {`{ "success": true, "data": { ... }, "meta": { "page": 1, "total": 20 } }`}<br /><br />
          <span style={{ color: '#94a3b8' }}>// Standard Error Response (HTTP 400 / 401 / 403 / 404 / 409)</span><br />
          {`{ "success": false, "error": { "code": "INSUFFICIENT_CREDITS", "message": "Stay requires 3 credits, 1 available." } }`}
        </div>
      </section>

      {/* API ENDPOINTS TABLE */}
      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>
          Available Backend API Endpoints
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b' }}>
              <th style={{ padding: '12px 16px' }}>Method</th>
              <th style={{ padding: '12px 16px' }}>Endpoint</th>
              <th style={{ padding: '12px 16px' }}>Purpose &amp; Description</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '0.9rem' }}>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>GET</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/properties/search</td>
              <td style={{ padding: '12px 16px' }}>Search eligible homes by city, dates, capacity, SwapScore</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/properties</td>
              <td style={{ padding: '12px 16px' }}>Create listing (Mumbai, Bengaluru, Delhi, Gurugram, Noida, Hyderabad)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>GET</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/properties/:id</td>
              <td style={{ padding: '12px 16px' }}>Public listing details &amp; explainable SwapScore breakdown</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/properties/:id/availability</td>
              <td style={{ padding: '12px 16px' }}>Update host availability calendar by night</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/properties/:id/photos</td>
              <td style={{ padding: '12px 16px' }}>Add photos to property gallery with display order</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/swaps</td>
              <td style={{ padding: '12px 16px' }}>Propose direct mutual swap between two member homes</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/swaps/:id/accept</td>
              <td style={{ padding: '12px 16px' }}>Accept swap &bull; Atomically confirms both stays and saves agreement</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/bookings</td>
              <td style={{ padding: '12px 16px' }}>Request stay &bull; Verifies credits, holds in reserve, checks date conflicts</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/bookings/:id/confirm</td>
              <td style={{ padding: '12px 16px' }}>Host confirms stay request</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/bookings/:id/complete</td>
              <td style={{ padding: '12px 16px' }}>Mark stay completed &bull; Automatically settles host credit earnings</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#dc2626' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/bookings/:id/cancel</td>
              <td style={{ padding: '12px 16px' }}>Cancel stay under policy &bull; Releases reserved credits back to guest</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>GET</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/wallet</td>
              <td style={{ padding: '12px 16px' }}>Caller wallet balance (available vs reserved balance)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>GET</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/wallet/transactions</td>
              <td style={{ padding: '12px 16px' }}>Append-only auditable credit transaction ledger</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/reviews</td>
              <td style={{ padding: '12px 16px' }}>Submit review (enforced only for eligible completed stays)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#16a34a' }}>POST</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/reports</td>
              <td style={{ padding: '12px 16px' }}>Report safety, cleanliness, or fraud issue</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563eb' }}>GET</td>
              <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>/api/admin/reports</td>
              <td style={{ padding: '12px 16px' }}>Admin moderation review for submitted disputes and claims</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* FRONTEND REPO INSTRUCTIONS */}
      <section style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
          Guide for the Frontend Developer
        </h3>
        <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 12px' }}>
          Refer to <code>FRONTEND_INTEGRATION_GUIDE.md</code> in the repository root. You can import all database types directly from <code>src/types/database.ts</code>, API contracts from <code>src/types/api.ts</code>, and validation schemas from <code>src/lib/validations/</code>.
        </p>
      </section>
    </main>
  );
}
