import { useState, useEffect, useCallback } from 'react';
import SupplierNavbar from '../../components/SupplierNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';
import { PO_STATUS, PO_STATUS_COLORS } from '../../utils/constants';

export default function SupplierDashboard() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPOs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/suppliers/my-pos');
      setPos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPOs(); }, [loadPOs]);

  async function respondPO(id, status) {
    try {
      await api.patch(`/api/suppliers/po/${id}/respond`, { status });
      alert(`PO ${status === 'accepted' ? 'accepted' : 'rejected'}!`);
      loadPOs();
    } catch (err) {
      alert(err.message || 'Failed to respond');
    }
  }

  return (
    <>
      <SupplierNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <h2 className="mb-3">My Purchase Orders</h2>
        {loading && <LoadingState message="Loading POs..." />}
        {!loading && error && <ErrorState title="Failed to load" message={error} onRetry={loadPOs} />}
        {!loading && !error && pos.length === 0 && <EmptyState title="No Purchase Orders" message="You have no purchase orders yet." />}
        {!loading && !error && pos.map(po => (
          <div key={po._id} className="card mb-2">
            <div className="flex-between mb-2">
              <div>
                <strong>{po.poNumber}</strong>
                <span className="text-muted" style={{ fontSize: 13, marginLeft: 12 }}>{new Date(po.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <span className={`badge ${PO_STATUS_COLORS[po.status] || 'badge-gray'}`}>{PO_STATUS[po.status] || po.status}</span>
            </div>
            <table>
              <thead><tr><th>Item</th><th>Qty</th></tr></thead>
              <tbody>{po.items.map((i, idx) => <tr key={idx}><td>{i.medicineName}</td><td>{i.quantity}</td></tr>)}</tbody>
            </table>
            {po.notes && <p className="mt-1 text-muted" style={{ fontSize: 13 }}>Notes: {po.notes}</p>}
            {po.expectedDelivery && <p className="text-muted" style={{ fontSize: 13 }}>Expected Delivery: {new Date(po.expectedDelivery).toLocaleDateString('en-IN')}</p>}
            {po.status === 'pending' && (
              <div className="flex gap-1 mt-2">
                <button type="button" className="btn btn-success btn-sm" onClick={() => respondPO(po._id, 'accepted')}>Accept</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => respondPO(po._id, 'rejected')}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
