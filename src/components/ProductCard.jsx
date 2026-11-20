import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;
  const navigate = useNavigate();
  const { addToCart } = useCart();

  return (
    <div
      className="card h-100 shadow-sm border-0"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div
        style={{
          height: '260px',
          overflow: 'hidden',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={`${BASEURL}${product.image}`}
          alt={product.name}
          className="w-100 h-100"
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title mb-1">{product.name}</h5>
        <p className="card-text fw-bold fs-5 mb-3">${Number(product.price).toFixed(2)}</p>
        <button
          className="btn btn-primary mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product.id, 1);
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default ProductCard;