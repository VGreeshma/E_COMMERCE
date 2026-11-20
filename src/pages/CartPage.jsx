
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity) && quantity > 0) {
      updateQuantity(productId, quantity);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">🛒 Your Cart</h2>

      {cart.items.length === 0 ? (
        <p className="text-center">Your cart is empty.</p>
      ) : (
        <div className="card p-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="d-flex justify-content-between align-items-center border-bottom py-3"
            >
              <div>
                <h5 className="mb-1">{item.product.name}</h5>
                <p className="text-muted mb-0">
                  ${Number(item.product.price).toFixed(2)}
                </p>
              </div>

              <div className="d-flex align-items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.product.id, e.target.value)
                  }
                  className="form-control"
                  style={{ width: '70px' }}
                />

                <span
                  role="button"
                  className="text-danger"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  Remove
                </span>
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mt-4">
            <h5>
              Total:{' '}
              <span className="text-success">
                ${Number(cart.total_price).toFixed(2)}
              </span>
            </h5>

            <button
              className="btn btn-primary"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
