import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CART_KEY = 'mediflow_cart';
const CartContext = createContext(null);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const [toast, setToast] = useState(null);

  const persist = useCallback((next) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  }, []);

  const add = useCallback((medicine, qty = 1) => {
    const current = readCart();
    const existing = current.find(i => i.medicineId === medicine._id);
    let next;
    if (existing) {
      next = current.map(i =>
        i.medicineId === medicine._id ? { ...i, qty: i.qty + qty } : i
      );
    } else {
      next = [...current, {
        medicineId: medicine._id,
        name: medicine.name,
        brand: medicine.brand || '',
        mrp: medicine.mrp,
        qty,
        gstSlab: medicine.gstSlab || 12,
        stock: medicine.stock,
        unit: medicine.unit || 'strip'
      }];
    }
    persist(next);
    setToast(`${medicine.name} added to cart`);
    setTimeout(() => setToast(null), 2500);
  }, [persist]);

  const updateQty = useCallback((medicineId, qty) => {
    if (qty <= 0) {
      persist(readCart().filter(i => i.medicineId !== medicineId));
      return;
    }
    persist(readCart().map(i => i.medicineId === medicineId ? { ...i, qty } : i));
  }, [persist]);

  const remove = useCallback((medicineId) => {
    persist(readCart().filter(i => i.medicineId !== medicineId));
  }, [persist]);

  const clear = useCallback(() => {
    localStorage.removeItem(CART_KEY);
    setItems([]);
  }, []);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.mrp * i.qty, 0);

  useEffect(() => {
    setItems(readCart());
  }, []);

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove, clear, count, total, toast }}>
      {children}
      {toast && <div className="toast toast-success show">{toast}</div>}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
