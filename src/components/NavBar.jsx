import { Link, useNavigate } from 'react-router-dom';
import FAQAssistant from './FAQAssistant';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { user, logoutUser } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <nav className="d-flex justify-content-between align-items-center px-4 py-3 shadow-sm bg-white">
        <Link to="/" className="text-decoration-none text-dark">
          <h4 className="mb-0">🛍️ HappyKart</h4>
        </Link>

        <div className="d-flex align-items-center gap-4">
          <span className="text-dark">
            Welcome, {user?.name}
          </span>

          <Link
            to="/cart"
            className="text-decoration-none text-dark fs-5 position-relative"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-outline-danger"
          >
            Logout
          </button>
        </div>
      </nav>

      <FAQAssistant />
    </>
  );
}

export default Navbar;