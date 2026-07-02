import { useState, useEffect, useCallback } from 'react';
import CustomerNavbar from '../../components/CustomerNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { CATEGORIES } from '../../utils/constants';

export default function Shop() {
  const { add } = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/api/customer/medicines', { search, category, limit: 50 });
      setMedicines(data.medicines || []);
    } catch (err) {
      setError(err.message || 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const timer = setTimeout(loadMedicines, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadMedicines, search]);

  return (
    <>
      <CustomerNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="search-bar">
          <input type="text" className="form-control" placeholder="Search medicines by name, brand, or generic name..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {loading && <LoadingState message="Loading medicines..." />}
        {!loading && error && <ErrorState message={error} onRetry={loadMedicines} />}
        {!loading && !error && medicines.length === 0 && (
          <EmptyState title="No medicines found" message="Try adjusting your search or filter." />
        )}
        {!loading && !error && medicines.length > 0 && (
          <div className="grid grid-3">
            {medicines.map(m => (
              <div key={m._id} className="medicine-card">
                <h3>{m.name}</h3>
                <div className="med-meta">{m.brand ? `${m.brand} · ` : ''}{m.genericName || ''}{m.manufacturer ? ` · ${m.manufacturer}` : ''}</div>
                <div className="med-price">Rs. {m.mrp}</div>
                <div className="med-meta">{m.unit}{m.packSize ? ` × ${m.packSize}` : ''}</div>
                <div className={`med-stock ${m.stock <= 10 ? 'badge badge-amber' : 'badge badge-green'}`}>
                  {m.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
                <button type="button" className="btn btn-primary btn-sm btn-full" disabled={m.stock <= 0} onClick={() => add(m)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
