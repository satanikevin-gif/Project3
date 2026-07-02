import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerNavbar from '../../components/CustomerNavbar';
import EmptyState from '../../components/EmptyState';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { items, updateQty, remove, clear, count, total } = useCart();
  const navigate = useNavigate();
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' });
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/api/auth/profile').then(d => setLoyaltyBalance(d.user?.loyaltyPoints || 0)).catch(() => {});
  }, []);

  async function placeOrder() {
    if (items.length === 0) return alert('Cart is empty.');
    const { street, city, state, pincode } = address;
    if (!street || !city || !state || !pincode) return alert('Please fill in your delivery address.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(items.map(i => ({ medicineId: i.medicineId, qty: i.qty }))));
      formData.append('deliveryAddress', JSON.stringify({ street, city, state, pincode }));
      formData.append('loyaltyPointsToUse', parseInt(loyaltyPoints) || 0);
      if (prescription) formData.append('prescription', prescription);
      await api.upload('/api/customer/orders', formData);
      clear();
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <CustomerNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="flex-between mb-3">
          <h2>Your Cart</h2>
          {items.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>Clear Cart</button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState title="Your cart is empty" message="Browse medicines and add what you need." action={<Link to="/shop" className="btn btn-primary">Browse Medicines</Link>} />
        ) : (
          <>
            <div className="card mb-3">
              <table>
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>MRP</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.medicineId}>
                      <td><strong>{item.name}</strong><br /><span className="text-muted" style={{ fontSize: 12 }}>{item.brand ? `${item.brand} · ` : ''}Rs. {item.mrp}/unit</span></td>
                      <td>
                        <input type="number" value={item.qty} min={1} max={item.stock} style={{ width: 60, padding: 6, border: '1px solid var(--border)', borderRadius: 4 }}
                          onChange={e => updateQty(item.medicineId, parseInt(e.target.value) || 0)} />
                      </td>
                      <td>Rs. {item.mrp}</td>
                      <td>Rs. {(item.mrp * item.qty).toFixed(2)}</td>
                      <td><button type="button" className="btn btn-danger btn-sm" onClick={() => remove(item.medicineId)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-2">
              <div className="card">
                <h3 className="mb-2">Delivery Address</h3>
                {['street', 'city', 'state', 'pincode'].map(field => (
                  <div key={field} className="form-group">
                    <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <input type="text" className="form-control" value={address[field]}
                      onChange={e => setAddress(a => ({ ...a, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 className="mb-2">Order Summary</h3>
                <div className="flex-between mb-1"><span>Items:</span><span>{count}</span></div>
                <div className="flex-between mb-1"><span>Subtotal:</span><span>Rs. {total.toFixed(2)}</span></div>
                <div className="form-group mt-2">
                  <label>Loyalty Points (balance: {loyaltyBalance})</label>
                  <input type="number" className="form-control" placeholder="Points to use (1 pt = Rs. 1)" min={0} value={loyaltyPoints} onChange={e => setLoyaltyPoints(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Prescription (optional)</label>
                  <input type="file" accept="image/*,.pdf" className="form-control" onChange={e => setPrescription(e.target.files[0] || null)} />
                </div>
                <hr style={{ borderColor: 'var(--border)', margin: '12px 0' }} />
                <div className="flex-between mb-2"><strong>Total:</strong><strong>Rs. {total.toFixed(2)}</strong></div>
                <button type="button" className="btn btn-primary btn-full" disabled={submitting} onClick={placeOrder}>
                  {submitting ? 'Placing order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
