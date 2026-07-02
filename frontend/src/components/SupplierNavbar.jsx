import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SupplierNavbar() {
  const { logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/supplier" className="navbar-brand">
        <span className="brand-icon">+</span> MediFlow Supplier
      </Link>
      <div className="nav-links">
        <NavLink to="/supplier" end className={({ isActive }) => isActive ? 'active' : undefined}>Dashboard</NavLink>
        <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
      </div>
    </nav>
  );
}
