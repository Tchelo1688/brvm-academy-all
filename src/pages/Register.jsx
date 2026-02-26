import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UEMOA_COUNTRIES } from '../utils/sampleData';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', country: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Le mot de passe doit contenir au moins 6 caractères');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.country);
      toast.success('Bienvenue sur BRVM Academy !');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-night-DEFAULT">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center font-serif font-bold text-night-DEFAULT">B</div>
          <span className="font-serif text-xl text-gold">BRVM Academy</span>
        </div>

        <h1 className="font-serif text-3xl mb-2">Créer un compte</h1>
        <p className="text-gray-500 mb-8">Rejoignez la communauté des investisseurs BRVM</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom complet</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Amadou Konaté" required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="amadou@email.com" required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Pays</label>
            <select name="country" value={form.country} onChange={handleChange} required className={inputClass}>
              <option value="">Sélectionnez votre pays</option>
              {UEMOA_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 caractères" required className={inputClass} />
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full text-sm disabled:opacity-50 mt-2">
            {loading ? 'Création...' : "S'inscrire Gratuitement"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-gold hover:underline font-semibold">Se connecter</Link>
        </p>

        <div className="mt-8 pt-4 border-t border-night-border text-center text-[10px] text-gray-600">
          <p>&copy; {new Date().getFullYear()} BRVM Academy. Tous droits reserves.</p>
          <p className="mt-1">En vous inscrivant, vous acceptez nos <a href="/cgu" className="text-gold hover:underline">CGU</a> et notre <a href="/confidentialite" className="text-gold hover:underline">Politique de Confidentialite</a>.</p>
        </div>
      </div>
    </div>
  );
}
