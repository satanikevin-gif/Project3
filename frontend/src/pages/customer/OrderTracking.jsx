import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import CustomerNavbar from '../../components/CustomerNavbar';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { ORDER_STATUS, ORDER_STATUS_COLORS, ORDER_STEPS } from '../../utils/constants';

export default function OrderTracking() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const orderRef = useRef(null);

  useEffect(() => { orderRef.current = order; }, [order]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/customer/orders/${id}/status`)
      .then(setOrder)
      .catch(err => setError(err.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user?._id || !id) return;
    const socket = io(import.meta.env.VITE_API_URL || window.location.origin, { path: '/socket.io' });
    socket.on('connect', () => socket.emit('joinRoom', user._id));
    socket.on('orderStatusUpdate', (data) => {
      if (data.orderId === id && orderRef.current) {
        setOrder(prev => ({ ...prev, status: data.status }));
      }
    });
    return () => socket.disconnect();
  }, [user, id]);

  function renderStepper(status) {
    if (status === 'cancelled') {
      return <p className="text-muted">Order was cancelled.</p>;
    }
    let passed = true;
    return (
      <div className="stepper">
        {ORDER_STEPS.map((step, i) => {
          const isActive = step === status;
          const isCompleted = passed && !isActive;
          if (isActive) passed = false;
          return (
            <div key={step} className={`step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`}>
              <div className="step-circle">{isCompleted ? '✓' : i + 1}</div>
              <div className="step-label">{ORDER_STATUS[step]}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        {loading && <LoadingState message="Loading order details..." />}
        {!loading && error && (
          <>
            <ErrorState title="Order not found" message={error} />
            <Link to="/orders" className="btn btn-secondary">Back to Orders</Link>
          </>
        )}
        {!loading && order && (
          <>
            <div className="flex-between mb-3">
              <div>
                <h2>{order.orderNo}</h2>
                <p className="text-muted">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <span className={`badge ${ORDER_STATUS_COLORS[order.status] || 'badge-gray'}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                {ORDER_STATUS[order.status] || order.status}
              </span>
            </div>
            <div className="card mb-3">
              <h3 className="mb-2">Order Progress</h3>
              {renderStepper(order.status)}
            </div>
            <div className="card mb-3">
              <h3 className="mb-2">Items</h3>
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th>MRP</th><th>Total</th></tr></thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={idx}><td>{i.name}</td><td>{i.qty}</td><td>Rs. {i.mrp}</td><td>Rs. {i.lineTotal}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={3} className="text-right"><strong>Total</strong></td><td>Rs. {order.totalAmount}</td></tr></tfoot>
              </table>
            </div>
            {order.deliveryAddress && (
              <div className="card">
                <h3 className="mb-2">Delivery Address</h3>
                <p>{order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
