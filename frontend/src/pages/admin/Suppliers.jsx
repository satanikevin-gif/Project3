import { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/AdminNavbar';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { api } from '../../api/client';
import { PO_STATUS_COLORS } from '../../utils/constants';

const TABS = ['suppliers', 'pos', 'grns'];

export default function AdminSuppliers() {
  const [tab, setTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supplierModal, setSupplierModal] = useState(false);
  const [poModal, setPoModal] = useState(false);
  const [grnModal, setGrnModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', company: '', email: '', phone: '', gstNumber: '' });
  const [poForm, setPoForm] = useState({ supplierId: '', items: '', expectedDelivery: '', notes: '' });
  const [grnForm, setGrnForm] = useState({ poId: '', items: '', notes: '' });

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSuppliers(await api.get('/api/suppliers'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPOs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/suppliers/po/all', { limit: 50 });
      setPos(data.purchaseOrders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGRNs = useCallback(async () => {
    setLoading(true);
    try {
      setGrns(await api.get('/api/suppliers/grn/all'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'suppliers') loadSuppliers();
    if (tab === 'pos') loadPOs();
    if (tab === 'grns') loadGRNs();
  }, [tab, loadSuppliers, loadPOs, loadGRNs]);

  async function saveSupplier(e) {
    e.preventDefault();
    try {
      await api.post('/api/suppliers', supplierForm);
      setSupplierModal(false);
      loadSuppliers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteSupplier(id) {
    if (!confirm('Delete supplier?')) return;
    try {
      await api.del(`/api/suppliers/${id}`);
      loadSuppliers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function openPOModal() {
    const list = await api.get('/api/suppliers');
    setSuppliers(list);
    setPoForm({ supplierId: list[0]?._id || '', items: '', expectedDelivery: '', notes: '' });
    setPoModal(true);
  }

  async function createPO(e) {
    e.preventDefault();
    try {
      await api.post('/api/suppliers/po/create', {
        supplierId: poForm.supplierId,
        items: JSON.parse(poForm.items),
        expectedDelivery: poForm.expectedDelivery || undefined,
        notes: poForm.notes
      });
      setPoModal(false);
      setTab('pos');
    } catch (err) {
      alert(err.message || 'Invalid JSON or server error');
    }
  }

  async function updatePOStatus(id, status) {
    if (!status) return;
    try {
      await api.patch(`/api/suppliers/po/${id}/status`, { status });
      loadPOs();
    } catch (err) {
      alert(err.message);
    }
  }

  async function openGRNModal() {
    const data = await api.get('/api/suppliers/po/all');
    setPos(data.purchaseOrders || []);
    setGrnForm({ poId: '', items: '', notes: '' });
    setGrnModal(true);
  }

  async function createGRN(e) {
    e.preventDefault();
    try {
      await api.post('/api/suppliers/grn/create', {
        poId: grnForm.poId,
        items: JSON.parse(grnForm.items),
        notes: grnForm.notes
      });
      setGrnModal(false);
      setTab('grns');
    } catch (err) {
      alert(err.message || 'Invalid JSON or server error');
    }
  }

  return (
    <>
      <AdminNavbar />
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="flex-between mb-3">
          <h2>Suppliers & Purchase Orders</h2>
          <div className="flex gap-1">
            <button type="button" className="btn btn-primary" onClick={() => setSupplierModal(true)}>+ Add Supplier</button>
            <button type="button" className="btn btn-amber" onClick={openPOModal}>+ New PO</button>
            <button type="button" className="btn btn-secondary" onClick={openGRNModal}>+ GRN</button>
          </div>
        </div>
        <div className="tab-bar">
          {TABS.map(t => (
            <button key={t} type="button" className={`tab-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'suppliers' ? 'Suppliers' : t === 'pos' ? 'Purchase Orders' : 'GRN'}
            </button>
          ))}
        </div>

        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}

        {!loading && tab === 'suppliers' && !error && (
          suppliers.length === 0 ? <EmptyState title="No suppliers" /> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>GST</th><th>Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s._id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.company || '-'}</td>
                      <td>{s.email}</td>
                      <td>{s.phone}</td>
                      <td>{s.gstNumber || '-'}</td>
                      <td><button type="button" className="btn btn-danger btn-sm" onClick={() => deleteSupplier(s._id)}>Del</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {!loading && tab === 'pos' && !error && (
          pos.length === 0 ? <EmptyState title="No POs" /> : pos.map(po => (
            <div key={po._id} className="card mb-2">
              <div className="flex-between mb-1">
                <strong>{po.poNumber}</strong>
                <div className="flex gap-1">
                  <span className={`badge ${PO_STATUS_COLORS[po.status] || 'badge-gray'}`}>{po.status}</span>
                  <span>{po.supplierId?.name || po.supplierName}</span>
                </div>
              </div>
              <select className="form-control" style={{ width: 'auto', fontSize: 12 }} defaultValue="" onChange={e => updatePOStatus(po._id, e.target.value)}>
                <option value="">Update Status</option>
                <option value="accepted">Accept</option>
                <option value="rejected">Reject</option>
                <option value="dispatched">Dispatch</option>
                <option value="received">Receive</option>
              </select>
              {po.items && <div className="mt-1" style={{ fontSize: 13 }}>{po.items.map(i => `${i.medicineName} x${i.quantity}`).join(', ')}</div>}
            </div>
          ))
        )}

        {!loading && tab === 'grns' && !error && (
          grns.length === 0 ? <EmptyState title="No GRNs" /> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>PO</th><th>Supplier</th><th>Items</th><th>Date</th></tr></thead>
                <tbody>
                  {grns.map(g => (
                    <tr key={g._id}>
                      <td>{g.poId?.poNumber || '-'}</td>
                      <td>{g.supplierId?.name || '-'}</td>
                      <td>{g.items.map(i => `${i.medicineName}: ${i.receivedQty}`).join(', ')}</td>
                      <td>{new Date(g.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {supplierModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header"><h3>Add Supplier</h3><button type="button" className="modal-close" onClick={() => setSupplierModal(false)}>&times;</button></div>
            <form onSubmit={saveSupplier}>
              {['name', 'company', 'email', 'phone', 'gstNumber'].map(f => (
                <div key={f} className="form-group">
                  <label>{f === 'gstNumber' ? 'GST Number' : f.charAt(0).toUpperCase() + f.slice(1)}{f === 'name' || f === 'email' || f === 'phone' ? ' *' : ''}</label>
                  <input className="form-control" required={['name', 'email', 'phone'].includes(f)} value={supplierForm[f]} onChange={e => setSupplierForm(s => ({ ...s, [f]: e.target.value }))} />
                </div>
              ))}
              <button type="submit" className="btn btn-primary btn-full">Save Supplier</button>
            </form>
          </div>
        </div>
      )}

      {poModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Create Purchase Order</h3><button type="button" className="modal-close" onClick={() => setPoModal(false)}>&times;</button></div>
            <form onSubmit={createPO}>
              <div className="form-group">
                <label>Supplier *</label>
                <select className="form-control" required value={poForm.supplierId} onChange={e => setPoForm(f => ({ ...f, supplierId: e.target.value }))}>
                  {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.company})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Items JSON *</label>
                <textarea className="form-control" rows={4} required value={poForm.items} onChange={e => setPoForm(f => ({ ...f, items: e.target.value }))} placeholder='[{"medicineId":"...","medicineName":"...","quantity":10}]' />
              </div>
              <div className="form-group"><label>Expected Delivery</label><input type="date" className="form-control" value={poForm.expectedDelivery} onChange={e => setPoForm(f => ({ ...f, expectedDelivery: e.target.value }))} /></div>
              <div className="form-group"><label>Notes</label><textarea className="form-control" value={poForm.notes} onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <button type="submit" className="btn btn-primary btn-full">Create PO</button>
            </form>
          </div>
        </div>
      )}

      {grnModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header"><h3>Create GRN</h3><button type="button" className="modal-close" onClick={() => setGrnModal(false)}>&times;</button></div>
            <form onSubmit={createGRN}>
              <div className="form-group">
                <label>Purchase Order *</label>
                <select className="form-control" required value={grnForm.poId} onChange={e => setGrnForm(f => ({ ...f, poId: e.target.value }))}>
                  <option value="">Select PO</option>
                  {pos.filter(po => po.status !== 'received').map(po => (
                    <option key={po._id} value={po._id}>{po.poNumber} - {po.supplierName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Items JSON *</label>
                <textarea className="form-control" rows={4} required value={grnForm.items} onChange={e => setGrnForm(f => ({ ...f, items: e.target.value }))} placeholder='[{"medicineId":"...","medicineName":"...","orderedQty":10,"receivedQty":10}]' />
              </div>
              <div className="form-group"><label>Notes</label><textarea className="form-control" value={grnForm.notes} onChange={e => setGrnForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <button type="submit" className="btn btn-primary btn-full">Create GRN</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
