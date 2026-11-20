import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read Django's CSRF cookie
  const getCookie = (name) => {
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      const trimmedCookie = cookie.trim();

      if (trimmedCookie.startsWith(name + '=')) {
        return decodeURIComponent(
          trimmedCookie.substring(name.length + 1)
        );
      }
    }

    return null;
  };

  // Ask Django to set the CSRF cookie
  const getCsrfToken = async () => {
    const response = await fetch(
      `${BASEURL}/api/auth/csrf/`,
      {
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Unable to get CSRF token');
    }

    const token = getCookie('csrftoken');

    if (!token) {
      throw new Error('CSRF cookie not found');
    }

    return token;
  };

  // Check whether a customer is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCsrfToken();

        const response = await fetch(
          `${BASEURL}/api/auth/me/`,
          {
            credentials: 'include',
          }
        );

        const data = await response.json();

        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Register customer
  const register = async (formData) => {
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${BASEURL}/api/auth/register/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        Array.isArray(data.error)
          ? data.error.join(', ')
          : data.error || 'Registration failed'
      );
    }

    setUser(data.user);
    return data;
  };

  // Login customer
  const loginUser = async (email, password) => {
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${BASEURL}/api/auth/login/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setUser(data.user);
    return data;
  };

  // Logout customer
  const logoutUser = async () => {
    const csrfToken = await getCsrfToken();

    const response = await fetch(
      `${BASEURL}/api/auth/logout/`,
      {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Logout failed');
    }

    setUser(null);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
