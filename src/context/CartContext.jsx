import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const EMPTY_CART = { items: [], total_price: 0 };

// fetch that gives up after `ms` milliseconds instead of hanging forever
const fetchWithTimeout = async (url, options = {}, ms = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY_CART);
  const [toastMessage, setToastMessage] = useState('');

  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  // Total number of items in the cart (sum of quantities)
  const cartCount = (cart.items || []).reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  // Read Django's CSRF cookie
  const getCookie = (name) => {
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      const trimmedCookie = cookie.trim();

      if (trimmedCookie.startsWith(name + '=')) {
        return decodeURIComponent(trimmedCookie.substring(name.length + 1));
      }
    }

    return null;
  };

  // Get the CSRF token, asking Django to set the cookie if it's missing
  const getCsrfToken = async () => {
    let token = getCookie('csrftoken');

    if (!token) {
      await fetchWithTimeout(`${BASEURL}/api/auth/csrf/`, {
        credentials: 'include',
      });
      token = getCookie('csrftoken');
    }

    if (!token) {
      throw new Error('CSRF cookie not found');
    }

    return token;
  };

  // Shared helper for all cart POST requests
  const postCart = async (path, body) => {
    const csrfToken = await getCsrfToken();

    const res = await fetchWithTimeout(`${BASEURL}/api/cart/${path}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`${path} failed (${res.status})`);
    }

    return res.json();
  };

  const fetchCart = () => {
    fetchWithTimeout(`${BASEURL}/api/cart/`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Cart request failed (${res.status})`);
        return res.json();
      })
      .then((data) => setCart(data))
      .catch((err) => {
        console.error('Error fetching cart:', err);
        setCart(EMPTY_CART);
      });
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const addToCart = (productId, quantity = 1) => {
    postCart('add_to_cart', { product_id: productId, quantity })
      .then(() => {
        fetchCart();
        showToast('Added to cart successfully!');
      })
      .catch((err) => console.error('Error adding to cart:', err));
  };

  const removeFromCart = (productId) => {
    postCart('remove', { product_id: productId })
      .then(() => fetchCart())
      .catch((err) => console.error('Error removing from cart:', err));
  };

  const updateQuantity = (productId, quantity) => {
    postCart('update', { product_id: productId, quantity })
      .then(() => fetchCart())
      .catch((err) => console.error('Error updating cart:', err));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        fetchCart,
      }}
    >
      {children}

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#198754',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  );
}