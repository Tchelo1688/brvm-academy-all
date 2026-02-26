import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password, twoFactorCode || undefined);
      // Si le backend demande la 2FA
      if (result?.requires2FA) {
        setShow2FA(true);
        toast('Entrez votre code 2FA', { icon: '🔐' });
        setLoading(false);
        return;
      }
      toast.success('Bienvenue !');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur de connexion';
      if (err.response?.data?.requires2FA) {
        setShow2FA(true);
        toast('Entrez votre code 2FA', { icon: '🔐' });
      } else if (err.code === 'ERR_NETWORK') {
        toast.error('Serveur non connecte. Utilisez le mode demo.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    toast.success('Mode démo activé — Bienvenue !');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-deep via-night-DEFAULT to-night-light relative items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-20 w-96 h-96 bg-gold/8 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center font-serif text-xl font-bold text-night-DEFAULT shadow-lg">
              B
            </div>
            <div>
              <span className="font-serif text-2xl text-gold block leading-tight">BRVM Academy</span>
              <span className="text-xs text-gray-500 tracking-widest uppercase">Trading Afrique de l'Ouest</span>
            </div>
          </div>
          <h2 className="font-serif text-4xl text-white leading-tight mb-4">
            Apprenez à investir sur la <em className="text-gold">BRVM</em>
          </h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Rejoignez plus de 12 000 apprenants en Afrique de l'Ouest. Cours vidéo, tutoriels pratiques et portefeuille virtuel pour maîtriser le trading.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <div><span className="block font-serif text-2xl text-white">46+</span>Cours HD</div>
            <div><span className="block font-serif text-2xl text-white">8</span>Pays UEMOA</div>
            <div><span className="block font-serif text-2xl text-white">12K</span>Étudiants</div>
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-night-DEFAULT">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center font-serif font-bold text-night-DEFAULT">B</div>
            <span className="font-serif text-xl text-gold">BRVM Academy</span>
          </div>

          <h1 className="font-serif text-3xl mb-2">Connexion</h1>
          <p className="text-gray-500 mb-8">Accédez à votre espace de formation</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full text-sm disabled:opacity-50"
            >
              {loading ? 'Connexion...' : show2FA ? 'Verifier le code 2FA' : 'Se Connecter'}
            </button>

            {/* 2FA Input */}
            {show2FA && (
              <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
                <label className="block text-sm font-medium text-gold mb-1.5">Code 2FA</label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-night-light border border-gold/30 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors"
                  autoFocus
                />
                <p className="text-[11px] text-gray-500 mt-2">Entrez le code de Google Authenticator ou un code de secours</p>
              </div>
            )}
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-night-border"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-night-DEFAULT px-3 text-gray-500">ou</span></div>
          </div>

          <button
            onClick={handleDemo}
            className="btn-outline w-full text-sm"
          >
            🎮 Mode Démo (sans compte)
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-gold hover:underline font-semibold">S'inscrire gratuitement</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
