export const ORDER_STATUS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export const ORDER_STATUS_COLORS = {
  pending: 'badge-amber',
  confirmed: 'badge-blue',
  packed: 'badge-blue',
  out_for_delivery: 'badge-amber',
  delivered: 'badge-green',
  cancelled: 'badge-red'
};

export const PO_STATUS = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  dispatched: 'Dispatched',
  received: 'Received'
};

export const PO_STATUS_COLORS = {
  pending: 'badge-amber',
  accepted: 'badge-green',
  rejected: 'badge-red',
  dispatched: 'badge-blue',
  received: 'badge-green'
};

export const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'tablets', label: 'Tablets' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'injection', label: 'Injection' },
  { value: 'topical', label: 'Topical' },
  { value: 'drops', label: 'Drops' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'other', label: 'Other' }
];

export const ORDER_STEPS = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
