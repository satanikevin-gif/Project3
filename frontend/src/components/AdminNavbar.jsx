import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminNavbar() {
  const { logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/admin" className="navbar-brand">
        <span className="brand-icon">+</span> MediFlow Admin
      </Link>
      <div className="nav-links">
        <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : undefined}>Dashboard</NavLink>
        <NavLink to="/admin/orders" className={({ isActive }) => isActive ? 'active' : undefined}>Orders</NavLink>
        <NavLink to="/admin/stock" className={({ isActive }) => isActive ? 'active' : undefined}>Stock</NavLink>
        <NavLink to="/admin/alerts" className={({ isActive }) => isActive ? 'active' : undefined}>Alerts</NavLink>
        <NavLink to="/admin/suppliers" className={({ isActive }) => isActive ? 'active' : undefined}>Suppliers</NavLink>
        <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
      </div>
    </nav>
  );
}
