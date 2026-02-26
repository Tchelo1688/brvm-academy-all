import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// Utilisateur démo (quand le backend n'est pas connecté)
const DEMO_USER = {
  id: 'demo-user',
  name: 'Amadou Konaté',
  email: 'demo@brvm-academy.com',
  country: 'ML',
  plan: 'Premium ✦',
  role: 'admin',
  xp: 4250,
  progress: {},
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier le token au chargement
  useEffect(() => {
    const token = localStorage.getItem('brvm_token');
    if (token === 'demo-token') {
      // Mode démo — pas besoin du backend
      setUser(DEMO_USER);
      setLoading(false);
    } else if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('brvm_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, twoFactorCode) => {
    const res = await api.post('/api/auth/login', { email, password, twoFactorCode });
    // Si le serveur demande la 2FA
    if (res.data.requires2FA) {
      return { requires2FA: true };
    }
    const { token, user } = res.data;
    localStorage.setItem('brvm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const register = async (name, email, password, country) => {
    const res = await api.post('/api/auth/register', { name, email, password, country });
    const { token, user } = res.data;
    localStorage.setItem('brvm_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  // Mode démo — connexion sans backend
  const loginDemo = () => {
    localStorage.setItem('brvm_token', 'demo-token');
    setUser(DEMO_USER);
  };

  const logout = () => {
    localStorage.removeItem('brvm_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProgress = (courseId, lessonIndex) => {
    setUser((prev) => ({
      ...prev,
      progress: {
        ...prev.progress,
        [courseId]: lessonIndex,
      },
    }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginDemo, logout, updateProgress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
