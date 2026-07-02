import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/customer/Shop';
import Cart from './pages/customer/Cart';
import MyOrders from './pages/customer/MyOrders';
import OrderTracking from './pages/customer/OrderTracking';
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminStock from './pages/admin/Stock';
import AdminAlerts from './pages/admin/Alerts';
import AdminSuppliers from './pages/admin/Suppliers';
import SupplierDashboard from './pages/supplier/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/shop" element={<ProtectedRoute roles={['customer', 'supplier']}><Shop /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute roles={['customer', 'supplier']}><Cart /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute roles={['customer', 'supplier']}><MyOrders /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute roles={['customer', 'supplier']}><OrderTracking /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/stock" element={<ProtectedRoute roles={['admin']}><AdminStock /></ProtectedRoute>} />
            <Route path="/admin/alerts" element={<ProtectedRoute roles={['admin']}><AdminAlerts /></ProtectedRoute>} />
            <Route path="/admin/suppliers" element={<ProtectedRoute roles={['admin']}><AdminSuppliers /></ProtectedRoute>} />

            <Route path="/supplier" element={<ProtectedRoute roles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
