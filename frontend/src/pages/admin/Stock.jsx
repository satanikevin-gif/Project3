import { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { api } from '../../api/client';
import { CATEGORIES } from '../../utils/constants';

const MED_FIELDS = ['name', 'genericName', 'brand', 'manufacturer', 'category', 'batchNo', 'unit', 'packSize', 'mrp', 'purchasePrice', 'stock', 'reorderThreshold', 'rackLocation', 'gstSlab', 'barcodeId'];

const emptyForm = () => ({
  name: '', genericName: '', brand: '', manufacturer: '', category: 'tablets', batchNo: '',
  mfgDate: '', expiryDate: '', unit: 'strip', packSize: 1, mrp: '', purchasePrice: '', stock: '',
  reorderThreshold: 10, rackLocation: '', gstSlab: 12, barcodeId: ''
});

export default function AdminStock() {
  const [medicines, setMedicines] = useState([]);
  const [lowStockIds, setLowStockIds] = useState(new Set());
  const [expiringIds, setExpiringIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [expiryStatus, setExpiryStatus] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState(emptyForm());

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const [data, lowStockData, expiringData] = await Promise.all([
        api.get('/api/medicines', { search, category, expiryStatus, lowStock: lowStockOnly ? 'true' : '', limit: 100 }),
        api.get('/api/medicines/low-stock').catch(() => ({})),
        api.get('/api/medicines/expiring').catch(() => [])
      ]);
      setMedicines(data.medicines || []);
      setLowStockIds(new Set((lowStockData.medicines || lowStockData)?.map?.(m => m._id) || []));
      setExpiringIds(new Set((expiringData || []).map(m => m._id)));
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, expiryStatus, lowStockOnly]);

  useEffect(() => {
    const t = setTimeout(loadMedicines, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadMedicines, search]);

  function openAdd() {
    setEditId('');
    setForm(emptyForm());
    setModalOpen(true);
  }

  async function openEdit(id) {
    try {
      const m = await api.get(`/api/medicines/${id}`);
      setEditId(id);
      setForm({
        ...emptyForm(),
        ...Object.fromEntries(MED_FIELDS.map(f => [f, m[f] ?? ''])),
        mfgDate: m.mfgDate?.split('T')[0] || '',
        expiryDate: m.expiryDate?.split('T')[0] || ''
      });
      setModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  }

  async function saveMedicine(e) {
    e.preventDefault();
    const data = {
      ...form,
      packSize: parseInt(form.packSize) || 1,
      mrp: parseFloat(form.mrp),
      purchasePrice: parseFloat(form.purchasePrice),
      stock: parseInt(form.stock),
      reorderThreshold: parseInt(form.reorderThreshold) || 10,
      gstSlab: parseInt(form.gstSlab) || 12
    };
    try {
      if (editId) await api.put(`/api/medicines/${editId}`, data);
      else await api.post('/api/medicines', data);
      setModalOpen(false);
      loadMedicines();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteMedicine(id) {
    if (!confirm('Deactivate this medicine?')) return;
    try {
      await api.del(`/api/medicines/${id}`);
      loadMedicines();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <AdminNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="flex-between mb-3">
          <h2>Inventory</h2>
          <button type="button" className="btn btn-primary" onClick={openAdd}>+ Add Medicine</button>
        </div>
        <div className="search-bar">
          <input type="text" className="form-control" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="form-control" value={expiryStatus} onChange={e => setExpiryStatus(e.target.value)}>
            <option value="">All Expiry</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} /> Low Stock
          </label>
        </div>
        {loading && <LoadingState message="Loading stock..." />}
        {!loading && medicines.length === 0 && <EmptyState title="No medicines found" />}
        {!loading && medicines.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Batch</th><th>Expiry</th><th>Stock</th><th>MRP</th><th>Cost</th><th>Rack</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {medicines.map(m => {
                  const isLow = lowStockIds.has(m._id);
                  const isExpiring = expiringIds.has(m._id);
                  const expired = new Date(m.expiryDate) < new Date();
                  return (
                    <tr key={m._id} style={{ background: isLow ? '#FEF3C7' : isExpiring ? '#FFF3E0' : undefined }}>
                      <td><strong>{m.name}</strong><br /><span className="text-muted" style={{ fontSize: 12 }}>{m.brand || ''}</span></td>
                      <td>{m.category}</td>
                      <td>{m.batchNo}</td>
                      <td style={{ color: expired ? 'var(--red)' : undefined }}>{new Date(m.expiryDate).toLocaleDateString('en-IN')}{expired ? ' ⚠' : ''}</td>
                      <td><strong style={{ color: isLow ? 'var(--amber)' : 'var(--primary)' }}>{m.stock}</strong>{isLow ? ' ⚠' : ''}</td>
                      <td>Rs. {m.mrp}</td>
                      <td>Rs. {m.purchasePrice}</td>
                      <td>{m.rackLocation || '-'}</td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(m._id)}>Edit</button>{' '}
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteMedicine(m._id)}>Del</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editId ? 'Edit Medicine' : 'Add Medicine'}</h3>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={saveMedicine}>
              <div className="grid grid-2 gap-1">
                <div className="form-group"><label>Name *</label><input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                <div className="form-group"><label>Generic Name</label><input className="form-control" value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))} /></div>
                <div className="form-group"><label>Brand</label><input className="form-control" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
                <div className="form-group"><label>Batch No *</label><input className="form-control" value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))} required /></div>
                <div className="form-group"><label>Mfg Date *</label><input type="date" className="form-control" value={form.mfgDate} onChange={e => setForm(f => ({ ...f, mfgDate: e.target.value }))} required /></div>
                <div className="form-group"><label>Expiry Date *</label><input type="date" className="form-control" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} required /></div>
                <div className="form-group"><label>MRP *</label><input type="number" step="0.01" className="form-control" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} required /></div>
                <div className="form-group"><label>Purchase Price *</label><input type="number" step="0.01" className="form-control" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} required /></div>
                <div className="form-group"><label>Stock *</label><input type="number" className="form-control" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required /></div>
                <div className="form-group"><label>Reorder Threshold</label><input type="number" className="form-control" value={form.reorderThreshold} onChange={e => setForm(f => ({ ...f, reorderThreshold: e.target.value }))} /></div>
              </div>
              <div className="flex gap-1 mt-2">
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
