import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';
import { ORDER_STATUS, ORDER_STATUS_COLORS } from '../../utils/constants';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/customer/orders/my');
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  return (
    <>
      <CustomerNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <h2 className="mb-3">My Orders</h2>
        {loading && <LoadingState message="Loading orders..." />}
        {!loading && error && <ErrorState title="Failed to load orders" message={error} onRetry={loadOrders} />}
        {!loading && !error && orders.length === 0 && (
          <EmptyState title="No orders yet" message="Place your first order to see it here." action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>} />
        )}
        {!loading && !error && orders.map(order => (
          <div key={order._id} className="card mb-2">
            <div className="flex-between mb-2">
              <div>
                <strong>{order.orderNo}</strong>
                <span className="text-muted" style={{ fontSize: 13, marginLeft: 12 }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <span className={`badge ${ORDER_STATUS_COLORS[order.status] || 'badge-gray'}`}>{ORDER_STATUS[order.status] || order.status}</span>
            </div>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                {order.items.map((i, idx) => (
                  <tr key={idx}><td>{i.name}</td><td>{i.qty}</td><td>Rs. {i.mrp}</td><td>Rs. {i.lineTotal}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex-between mt-2" style={{ fontSize: 13 }}>
              <span className="text-muted">Total: Rs. {order.totalAmount}</span>
              <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-sm">Track Order</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
