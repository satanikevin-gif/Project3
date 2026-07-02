import { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';
import { ORDER_STATUS, ORDER_STATUS_COLORS } from '../../utils/constants';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/customer/orders/all', { status: statusFilter, limit: 50 });
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function updateStatus(orderId, status) {
    if (!status) return;
    try {
      await api.patch(`/api/customer/orders/${orderId}/status`, { status });
      alert('Status updated!');
      loadOrders();
    } catch (err) {
      alert(err.message || 'Failed to update');
    }
  }

  return (
    <>
      <AdminNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="flex-between mb-3">
          <h2>Customer Orders</h2>
          <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {loading && <LoadingState message="Loading orders..." />}
        {!loading && error && <ErrorState title="Failed" message={error} onRetry={loadOrders} />}
        {!loading && !error && orders.length === 0 && <EmptyState title="No orders" message="No orders match the current filter." />}
        {!loading && !error && orders.map(order => (
          <div key={order._id} className="card mb-2">
            <div className="flex-between mb-2">
              <div>
                <strong>{order.orderNo}</strong>
                <span className="text-muted" style={{ fontSize: 13, marginLeft: 12 }}>{order.customerId?.name || 'Unknown'} ({order.customerId?.email || ''})</span>
              </div>
              <div className="flex gap-1">
                <span className={`badge ${ORDER_STATUS_COLORS[order.status] || 'badge-gray'}`}>{ORDER_STATUS[order.status] || order.status}</span>
                <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-green' : 'badge-amber'}`}>{order.paymentStatus}</span>
              </div>
            </div>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>MRP</th><th>Total</th></tr></thead>
              <tbody>{order.items.map((i, idx) => <tr key={idx}><td>{i.name}</td><td>{i.qty}</td><td>Rs. {i.mrp}</td><td>Rs. {i.lineTotal}</td></tr>)}</tbody>
            </table>
            <div className="flex-between mt-2">
              <div className="flex gap-1">
                <select className="form-control" style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }} defaultValue="" onChange={e => updateStatus(order._id, e.target.value)}>
                  <option value="">Change Status</option>
                  <option value="confirmed">Confirm</option>
                  <option value="packed">Pack</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Deliver</option>
                  <option value="cancelled">Cancel</option>
                </select>
                {order.prescriptionUrl && (
                  <a href={`/${order.prescriptionUrl.replace(/\\/g, '/')}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View Rx</a>
                )}
              </div>
              <span className="text-muted" style={{ fontSize: 13 }}>Total: Rs. {order.totalAmount}{order.loyaltyPointsUsed > 0 ? ` (LP: -${order.loyaltyPointsUsed})` : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
