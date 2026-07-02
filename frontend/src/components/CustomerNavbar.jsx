import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CustomerNavbar() {
  const { logout } = useAuth();
  const { count } = useCart();

  return (
    <nav className="navbar">
      <Link to="/shop" className="navbar-brand">
        <span className="brand-icon">+</span> MediFlow
      </Link>
      <div className="nav-links">
        <NavLink to="/shop" className={({ isActive }) => isActive ? 'active' : undefined}>Shop</NavLink>
        <NavLink to="/cart" className={({ isActive }) => isActive ? 'active cart-badge' : 'cart-badge'}>
          Cart {count > 0 && <span className="cart-count">{count}</span>}
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : undefined}>Orders</NavLink>
        <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
      </div>
    </nav>
  );
}
