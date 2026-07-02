import { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'expiry', label: 'Expiry' },
  { id: 'unack', label: 'Unacknowledged' }
];

const severityColors = { critical: 'badge-red', warning: 'badge-amber', info: 'badge-blue' };

export default function AdminAlerts() {
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 100 };
      if (filter === 'low_stock') params.type = 'low_stock';
      else if (filter === 'expiry') params.type = 'expiry';
      else if (filter === 'unack') params.acknowledged = 'false';
      const data = await api.get('/api/alerts', params);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  async function acknowledge(id) {
    try {
      await api.patch(`/api/alerts/${id}/ack`);
      loadAlerts();
    } catch (err) {
      alert(err.message);
    }
  }

  async function triggerAlerts() {
    try {
      await api.post('/api/alerts/trigger');
      alert('Alert engine executed!');
      loadAlerts();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <AdminNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="flex-between mb-3">
          <h2>Alerts</h2>
          <button type="button" className="btn btn-amber" onClick={triggerAlerts}>Run Alert Engine</button>
        </div>
        <div className="tab-bar">
          {FILTERS.map(f => (
            <button key={f.id} type="button" className={`tab-item${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        {loading && <LoadingState message="Loading alerts..." />}
        {!loading && error && <ErrorState message={error} onRetry={loadAlerts} />}
        {!loading && !error && alerts.length === 0 && <EmptyState title="No alerts" message="All clear — no alerts match this filter." />}
        {!loading && !error && alerts.map(a => (
          <div key={a._id} className="card mb-2" style={{ opacity: a.isAcknowledged ? 0.6 : 1 }}>
            <div className="flex-between">
              <div>
                <span className={`badge ${severityColors[a.severity] || 'badge-gray'}`}>{a.severity}</span>
                <span className={`badge ${a.type === 'expiry' ? 'badge-amber' : 'badge-blue'}`}>{a.type}</span>
                <strong className="ml-1">{a.medicineName}</strong>
              </div>
              {!a.isAcknowledged ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => acknowledge(a._id)}>Acknowledge</button>
              ) : (
                <span className="text-muted" style={{ fontSize: 12 }}>Acknowledged</span>
              )}
            </div>
            <p className="mt-1" style={{ fontSize: 13 }}>{a.message}</p>
            <p className="text-muted" style={{ fontSize: 11 }}>{new Date(a.createdAt).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>
    </>
  );
}
