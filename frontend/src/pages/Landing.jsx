import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 48, color: 'var(--primary)', marginBottom: 8 }}>MediFlow</h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', marginBottom: 32 }}>Full Ecosystem Medical Store Management</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>Customer Login</Link>
          <Link to="/register" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>Customer Register</Link>
          <Link to="/shop" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>Browse Shop</Link>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login?redirect=/admin" className="btn btn-amber" style={{ fontSize: 16, padding: '14px 32px' }}>Admin Panel</Link>
          <Link to="/login?redirect=/supplier" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>Supplier Portal</Link>
        </div>
        <p style={{ marginTop: 32, fontSize: 13, color: 'var(--muted)' }}>
          Admin: admin@mediflow.com · Customer: rahul@example.com<br />
          Supplier: rajesh@supplier.com
        </p>
      </div>
    </div>
  );
}
