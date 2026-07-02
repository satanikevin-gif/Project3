import { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';

export default function AdminDashboard() {
  const [dash, setDash] = useState(null);
  const [sales, setSales] = useState(null);
  const [inv, setInv] = useState(null);
  const [expiryLoss, setExpiryLoss] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const to = new Date().toISOString().split('T')[0];
      const [d, s, i, e] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/analytics/sales', { from, to }),
        api.get('/api/analytics/inventory-value'),
        api.get('/api/analytics/expiry-loss')
      ]);
      setDash(d); setSales(s); setInv(i); setExpiryLoss(e);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <AdminNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <h2 className="mb-3">Dashboard</h2>
        {loading && <LoadingState message="Loading dashboard..." />}
        {!loading && error && <ErrorState title="Failed to load" message={error} onRetry={load} />}
        {!loading && dash && (
          <>
            <div className="grid grid-4 mb-3">
              <div className="stat-card"><div className="stat-value">{dash.totalMedicines}</div><div className="stat-label">Medicines</div></div>
              <div className="stat-card"><div className="stat-value">{dash.totalBills}</div><div className="stat-label">Bills</div></div>
              <div className="stat-card"><div className="stat-value">{dash.totalOrders}</div><div className="stat-label">Orders</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: dash.activeAlerts > 0 ? 'var(--amber)' : 'var(--primary)' }}>{dash.activeAlerts}</div><div className="stat-label">Active Alerts</div></div>
              <div className="stat-card"><div className="stat-value">Rs. {(dash.totalRevenue || 0).toLocaleString()}</div><div className="stat-label">Total Revenue</div></div>
              <div className="stat-card"><div className="stat-value">{dash.lowStockCount}</div><div className="stat-label">Low Stock Items</div></div>
              <div className="stat-card"><div className="stat-value">Rs. {(inv?.totalMrp || 0).toLocaleString()}</div><div className="stat-label">Inventory (MRP)</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: expiryLoss?.totalLossValue > 0 ? 'var(--red)' : 'var(--primary)' }}>Rs. {(expiryLoss?.totalLossValue || 0).toLocaleString()}</div><div className="stat-label">Expiry Loss</div></div>
            </div>
            <div className="grid grid-2">
              <div className="card">
                <h3 className="mb-2">Sales (30 days)</h3>
                <div className="flex-between mb-1"><span>Revenue:</span><strong>Rs. {(sales?.totalRevenue || 0).toLocaleString()}</strong></div>
                <div className="flex-between mb-1"><span>Bills:</span><strong>{sales?.totalBills}</strong></div>
                <div className="flex-between mb-1"><span>Avg Bill:</span><strong>Rs. {(sales?.avgBillValue || 0).toFixed(2)}</strong></div>
                {Object.entries(sales?.paymentBreakdown || {}).map(([mode, amt]) => (
                  <div key={mode} className="flex-between" style={{ fontSize: 13, paddingLeft: 16 }}><span>{mode}:</span><span>Rs. {(amt || 0).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="card">
                <h3 className="mb-2">Expiry Loss Alert</h3>
                {expiryLoss?.items?.length > 0 ? (
                  <>
                    <p className="text-muted mb-2">{expiryLoss.items.length} expired medicines with stock.</p>
                    <table>
                      <thead><tr><th>Medicine</th><th>Stock</th><th>Loss</th></tr></thead>
                      <tbody>
                        {expiryLoss.items.slice(0, 5).map((i, idx) => (
                          <tr key={idx}><td>{i.name}</td><td>{i.stock}</td><td>Rs. {i.lossValue}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : <p className="text-muted">No expired stock with losses.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
