import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  useEffect(() => {
    fetch(`${BASEURL}/api/products/${id}/`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch product');
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="text-center mt-5">Loading...</p>;
  if (error) return <p className="text-center mt-5 text-danger">Error: {error}</p>;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6">
          <img
            src={product.image}
            alt={product.name}
            className="img-fluid rounded"
            style={{ maxHeight: '500px', objectFit: 'contain', width: '100%' }}
          />
        </div>
        <div className="col-md-6">
          <h1>{product.name}</h1>
          <p className="text-muted">{product.description}</p>
          <p className="fw-bold fs-3">${Number(product.price).toFixed(2)}</p>
          <button className="btn btn-primary btn-lg" onClick={() => addToCart(product.id, 1)}>
            Add to Cart
          </button>

          <div className="mt-4">
            <Link to="/" className="text-decoration-none">
              ← Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;