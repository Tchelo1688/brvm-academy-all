import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CURRENCIES = [
  { code: 'XOF', symbol: 'FCFA', flag: '🇨🇮' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'CAD', symbol: '$CA', flag: '🇨🇦' },
  { code: 'USD', symbol: '$US', flag: '🇺🇸' },
];

const FALLBACK_PRICES = {
  premium: { monthly: { XOF: 5000, EUR: 8, CAD: 12, USD: 9 }, yearly: { XOF: 45000, EUR: 72, CAD: 108, USD: 81 } },
  pro: { monthly: { XOF: 15000, EUR: 23, CAD: 35, USD: 26 }, yearly: { XOF: 135000, EUR: 207, CAD: 315, USD: 234 } },
};

const PLAN_FEATURES = {
  gratuit: {
    label: 'Gratuit', emoji: '🎓', color: 'border-gray-600',
    features: ['Cours gratuits uniquement', 'Tutoriels gratuits', 'Forum communautaire'],
    notIncluded: ['Cours premium & pro', 'PDFs premium', 'Mentorat', 'Certificats', 'Support prioritaire'],
  },
  premium: {
    label: 'Premium', emoji: '⭐', color: 'border-gold', popular: true,
    features: ['Tous les cours video', 'Tous les tutoriels & PDFs', 'Quiz avances', 'Portefeuille virtuel', 'Progression illimitee'],
    notIncluded: ['Mentorat personnalise', 'Certificats officiels'],
  },
  pro: {
    label: 'Pro', emoji: '💎', color: 'border-emerald',
    features: ['Tout Premium inclus', 'Mentorat personnalise', 'Certificats officiels', 'Support prioritaire 24/7', 'Acces anticipe aux nouveaux cours', 'Webinaires exclusifs en live'],
    notIncluded: [],
  },
};

export default function Pricing() {
  const { user } = useAuth();
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [duration, setDuration] = useState('monthly');
  const [currency, setCurrency] = useState('XOF');
  const [loading, setLoading] = useState('');
  const [cinetpayConfigured, setCinetpayConfigured] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadPlans();
    loadStatus();
    loadHistory();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get('/api/payments/plans');
      if (res.data?.prices) setPrices(res.data.prices);
    } catch { /* use fallback */ }
  };

  const loadStatus = async () => {
    try {
      const res = await api.get('/api/payments/status');
      setCinetpayConfigured(res.data.configured);
    } catch { /* ignore */ }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/api/payments/history');
      setHistory(res.data || []);
    } catch { /* ignore */ }
  };

  const getPrice = (plan) => {
    if (!prices[plan]) return 0;
    return prices[plan][duration]?.[currency] || 0;
  };

  const getCurrencyInfo = () => CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const formatPrice = (amount) => {
    const cur = getCurrencyInfo();
    const formatted = new Intl.NumberFormat('fr-FR').format(amount);
    return cur.code === 'XOF' ? `${formatted} FCFA` :
           cur.code === 'EUR' ? `${formatted} €` :
           cur.code === 'CAD' ? `${formatted} $CA` :
           `${formatted} $US`;
  };

  const handleSubscribe = async (plan) => {
    if (user?.plan === plan) return toast('Vous etes deja sur ce plan !');
    if (plan === 'gratuit') return;

    setLoading(plan);
    try {
      if (cinetpayConfigured) {
        const res = await api.post('/api/payments/initialize', { plan, duration, currency });
        if (res.data.paymentUrl) {
          toast.success('Redirection vers CinetPay...');
          window.location.href = res.data.paymentUrl;
        }
      } else {
        const res = await api.post('/api/payments/demo', { plan, duration, currency });
        toast.success(res.data.message);
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de paiement');
    } finally { setLoading(''); }
  };

  // Plan actif info
  const currentPlan = user?.plan || 'gratuit';
  const isPremiumOrAbove = ['premium', 'pro'].includes(currentPlan);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl mb-3">Choisissez votre Plan</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Investissez dans votre education financiere. Tous les nouveaux comptes sont gratuits — passez au Premium ou Pro pour debloquer tout le contenu.
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="text-center">
        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold ${
          currentPlan === 'pro' ? 'bg-emerald/15 text-emerald border border-emerald/30' :
          currentPlan === 'premium' ? 'bg-gold/15 text-gold border border-gold/30' :
          'bg-gray-500/15 text-gray-400 border border-gray-500/30'
        }`}>
          {PLAN_FEATURES[currentPlan]?.emoji} Votre plan actuel : {PLAN_FEATURES[currentPlan]?.label}
        </span>
      </div>

      {/* Duration + Currency Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Duration */}
        <div className="flex items-center gap-2 bg-night-card rounded-xl p-1 border border-night-border">
          <button onClick={() => setDuration('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              duration === 'monthly' ? 'bg-gold/15 text-gold' : 'text-gray-400 hover:text-white'
            }`}>
            Mensuel
          </button>
          <button onClick={() => setDuration('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
              duration === 'yearly' ? 'bg-gold/15 text-gold' : 'text-gray-400 hover:text-white'
            }`}>
            Annuel
            <span className="absolute -top-2 -right-2 text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">-25%</span>
          </button>
        </div>

        {/* Currency */}
        <div className="flex items-center gap-1 bg-night-card rounded-xl p-1 border border-night-border">
          {CURRENCIES.map(cur => (
            <button key={cur.code} onClick={() => setCurrency(cur.code)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                currency === cur.code ? 'bg-gold/15 text-gold' : 'text-gray-400 hover:text-white'
              }`}>
              <span className="text-base">{cur.flag}</span>
              <span className="text-xs">{cur.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CinetPay status */}
      {!cinetpayConfigured && (
        <div className="text-center">
          <span className="text-xs bg-orange-500/15 text-orange-400 px-3 py-1 rounded-full">
            Mode demo — Les paiements sont simules
          </span>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {['gratuit', 'premium', 'pro'].map((planKey) => {
          const info = PLAN_FEATURES[planKey];
          const price = getPrice(planKey);
          const isCurrentPlan = currentPlan === planKey;
          const isPaid = planKey !== 'gratuit';

          return (
            <div key={planKey}
              className={`card p-6 relative transition-all hover:-translate-y-1 ${
                info.popular ? 'border-2 border-gold shadow-lg shadow-gold/10' : 'border border-night-border'
              }`}>
              {info.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-night-DEFAULT text-[11px] font-bold px-4 py-1 rounded-full shadow-lg">POPULAIRE</span>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <p className="text-3xl mb-2">{info.emoji}</p>
                <h3 className="font-serif text-xl mb-1">{info.label}</h3>
                {isPaid ? (
                  <div>
                    <p className="font-serif text-3xl text-gold">{formatPrice(price)}</p>
                    <p className="text-xs text-gray-500">/ {duration === 'monthly' ? 'mois' : 'an'}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-serif text-3xl text-gray-400">0 <span className="text-sm">{getCurrencyInfo().symbol}</span></p>
                    <p className="text-xs text-gray-500">pour toujours</p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 mb-6">
                {info.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400 text-xs">✓</span>
                    <span className="text-gray-300">{f}</span>
                  </div>
                ))}
                {info.notIncluded.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 text-xs">✕</span>
                    <span className="text-gray-600">{f}</span>
                  </div>
                ))}
              </div>

              {isCurrentPlan ? (
                <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                  Plan actuel
                </button>
              ) : planKey === 'gratuit' ? (
                <button disabled className="w-full py-3 rounded-xl text-sm font-semibold bg-night-light text-gray-500 border border-night-border">
                  Plan de base
                </button>
              ) : (
                <button onClick={() => handleSubscribe(planKey)} disabled={loading === planKey}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    info.popular ? 'bg-gradient-to-r from-gold to-gold-dark text-night-DEFAULT hover:shadow-lg hover:shadow-gold/20'
                    : 'bg-emerald/10 text-emerald border border-emerald/30 hover:bg-emerald/20'
                  } disabled:opacity-50`}>
                  {loading === planKey ? 'Chargement...' : `Souscrire ${info.label}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="card p-6 text-center">
        <p className="text-sm text-gray-500 mb-3">Moyens de paiement acceptes</p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {[
            { name: 'Orange Money', emoji: '🟠' },
            { name: 'MTN MoMo', emoji: '🟡' },
            { name: 'Wave', emoji: '🔵' },
            { name: 'Moov Money', emoji: '🟢' },
            { name: 'Visa / Mastercard', emoji: '💳' },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-1.5 text-sm text-gray-400">
              <span>{m.emoji}</span><span>{m.name}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 mt-3">
          Paiements securises par CinetPay — Tarifs affiches en {getCurrencyInfo().symbol}, facturation en FCFA
        </p>
      </div>

      {/* Access Info */}
      <div className="card p-6">
        <h3 className="font-semibold text-sm mb-3">Acces au contenu selon votre plan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-night-border">
                <th className="text-left py-2 text-gray-500 font-medium">Contenu</th>
                <th className="text-center py-2 text-gray-500 font-medium">Gratuit</th>
                <th className="text-center py-2 text-gold font-medium">Premium</th>
                <th className="text-center py-2 text-emerald font-medium">Pro</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {[
                { name: 'Cours marques "gratuit"', g: true, p: true, pr: true },
                { name: 'Tous les cours video', g: false, p: true, pr: true },
                { name: 'Tutoriels gratuits', g: true, p: true, pr: true },
                { name: 'Tutoriels & PDFs premium', g: false, p: true, pr: true },
                { name: 'Quiz avances', g: false, p: true, pr: true },
                { name: 'Portefeuille virtuel', g: true, p: true, pr: true },
                { name: 'Mentorat personnalise', g: false, p: false, pr: true },
                { name: 'Certificats officiels', g: false, p: false, pr: true },
                { name: 'Support prioritaire', g: false, p: false, pr: true },
              ].map((row, i) => (
                <tr key={i} className="border-b border-night-border/30">
                  <td className="py-2 text-gray-400">{row.name}</td>
                  <td className="text-center py-2">{row.g ? <span className="text-green-400">✓</span> : <span className="text-gray-600">✕</span>}</td>
                  <td className="text-center py-2">{row.p ? <span className="text-green-400">✓</span> : <span className="text-gray-600">✕</span>}</td>
                  <td className="text-center py-2">{row.pr ? <span className="text-green-400">✓</span> : <span className="text-gray-600">✕</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      {history.length > 0 && (
        <div className="card p-6">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-sm">Historique des paiements ({history.length})</h3>
            <span className="text-xs text-gold">{showHistory ? 'Masquer' : 'Afficher'}</span>
          </button>
          {showHistory && (
            <div className="mt-4 space-y-2">
              {history.map(p => (
                <div key={p._id} className="flex items-center gap-3 p-3 rounded-xl bg-night-light border border-night-border">
                  <span>{p.status === 'completed' ? '✅' : p.status === 'failed' ? '❌' : '⏳'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.plan?.toUpperCase()} — {new Intl.NumberFormat('fr-FR').format(p.amount)} FCFA</p>
                    <p className="text-[11px] text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString('fr-FR')} • {p.paymentMethod || 'En attente'}
                    </p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'completed' ? 'bg-green-500/15 text-green-400' : p.status === 'failed' ? 'bg-red-500/15 text-red-400' : 'bg-orange-500/15 text-orange-400'
                  }`}>
                    {p.status === 'completed' ? 'Paye' : p.status === 'failed' ? 'Echoue' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
