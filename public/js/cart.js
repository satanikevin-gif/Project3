const Cart = {
  getItems() {
    try {
      return JSON.parse(localStorage.getItem('mediflow_cart') || '[]');
    } catch { return []; }
  },

  saveItems(items) {
    localStorage.setItem('mediflow_cart', JSON.stringify(items));
    Cart.updateBadge();
  },

  add(medicine, qty = 1) {
    const items = Cart.getItems();
    const existing = items.find(i => i.medicineId === medicine._id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        medicineId: medicine._id,
        name: medicine.name,
        brand: medicine.brand || '',
        mrp: medicine.mrp,
        qty,
        gstSlab: medicine.gstSlab || 12,
        stock: medicine.stock,
        unit: medicine.unit || 'strip'
      });
    }
    Cart.saveItems(items);
    Cart.showToast(`${medicine.name} added to cart`);
    return items;
  },

  updateQty(medicineId, qty) {
    const items = Cart.getItems();
    const item = items.find(i => i.medicineId === medicineId);
    if (item) {
      if (qty <= 0) {
        return Cart.remove(medicineId);
      }
      item.qty = qty;
      Cart.saveItems(items);
    }
    return items;
  },

  remove(medicineId) {
    let items = Cart.getItems();
    items = items.filter(i => i.medicineId !== medicineId);
    Cart.saveItems(items);
    return items;
  },

  clear() {
    localStorage.removeItem('mediflow_cart');
    Cart.updateBadge();
  },

  getCount() {
    return Cart.getItems().reduce((sum, i) => sum + i.qty, 0);
  },

  getTotal() {
    return Cart.getItems().reduce((sum, i) => sum + i.mrp * i.qty, 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const count = Cart.getCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  showToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'toast toast-success show';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => { div.classList.remove('show'); setTimeout(() => div.remove(), 300); }, 2500);
  }
};

document.addEventListener('DOMContentLoaded', Cart.updateBadge);
