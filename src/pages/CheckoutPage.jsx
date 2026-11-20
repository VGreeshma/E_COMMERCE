
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function CheckoutPage() {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (!address.trim() || !phone.trim()) {
      setError('Please enter your delivery address and phone number.');
      return;
    }

    if (!/^[0-9]{7,15}$/.test(phone.trim())) {
      setError('Please enter a valid phone number (7–15 digits).');
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      // Get the CSRF cookie from Django
      await fetch(`${BASEURL}/api/auth/csrf/`, {
        credentials: 'include',
      });

      const response = await fetch(`${BASEURL}/api/orders/checkout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          address: address.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to place your order.');
      }

      setPlacedOrder(data.order);
      await fetchCart();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="container mt-5" style={{ maxWidth: '600px' }}>
        <div className="card shadow p-4 text-center">
          <h2 className="text-success">Order Placed Successfully!</h2>
          <p className="mt-3">Thank you for shopping with HappyKart.</p>

          <hr />

          <p>
            <strong>Order Number:</strong> {placedOrder.order_number}
          </p>
          <p>
            <strong>Total Amount:</strong> ${Number(placedOrder.total_amount).toFixed(2)}
          </p>
          <p>
            <strong>Payment Method:</strong> {placedOrder.payment_method}
          </p>
          <p>
            <strong>Order Status:</strong> {placedOrder.status}
          </p>
          <p>
            <strong>Delivery Address:</strong> {placedOrder.delivery_address}
          </p>

          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '650px' }}>
      <h2 className="text-center mb-4">HappyKart Checkout</h2>

      <div className="card shadow p-4">
        <h4>Order Summary</h4>

        {cart.items.map((item) => (
          <div
            key={item.id}
            className="d-flex justify-content-between border-bottom py-2"
          >
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span>
              ${(Number(item.product.price) * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        <h5 className="text-success text-end mt-3">
          Total: ${Number(cart.total_price).toFixed(2)}
        </h5>

        <hr />

        <form onSubmit={handleCheckout}>
          <h4 className="mb-3">Delivery Details</h4>

          <div className="mb-3">
            <label className="form-label">Delivery Address</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter your complete delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <hr />

          <h4>Payment Method</h4>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="radio"
              checked
              readOnly
            />
            <label className="form-check-label">
              Cash on Delivery (COD)
            </label>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading || cart.items.length === 0}
          >
            {loading ? 'Placing Order...' : 'Confirm Cash on Delivery'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;
