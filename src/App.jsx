
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/NavBar';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import Register from './pages/Register';
import Login from './pages/Login';

import { useAuth } from './context/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5">Loading HappyKart...</div>;
  }

  return (
    <>
      {user && <Navbar />}

      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />

        <Route
          path="/"
          element={user ? <ProductList /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/product/:id"
          element={user ? <ProductDetails /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/cart"
          element={user ? <CartPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/checkout"
          element={user ? <CheckoutPage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
