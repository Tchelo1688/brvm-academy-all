import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Affiliation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAff(); }, []);

  const loadAff = async () => {
    try { const r = await api.get('/api/affiliation'); setData(r.data); } catch {} finally { setLoading(false); }
  };

  const copyCode = () => {
    const url = `${window.location.origin}/register?ref=${data.code}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Lien copie !')).catch(() => toast.error('Erreur'));
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-1">Programme d'Affiliation</h1>
        <p className="text-gray-500 text-sm">Parrainez des amis et gagnez {data?.commissionRate || 20}% de commission sur leurs paiements</p>
      </div>

      {/* Code */}
      <div className="card p-6 text-center border border-gold/20">
        <p className="text-xs text-gray-500 mb-2">Votre code parrain</p>
        <p className="font-mono text-3xl text-gold font-bold mb-3">{data?.code}</p>
        <button onClick={copyCode} className="btn-gold text-sm">📋 Copier le lien d'invitation</button>
        <p className="text-[11px] text-gray-500 mt-2">Partagez ce lien : {window.location.origin}/register?ref={data?.code}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gold">{data?.referrals?.length || 0}</p>
          <p className="text-xs text-gray-500">Filleuls</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{fmt(data?.totalEarnings || 0)} F</p>
          <p className="text-xs text-gray-500">Gains totaux</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{fmt(data?.pendingEarnings || 0)} F</p>
          <p className="text-xs text-gray-500">En attente</p>
        </div>
      </div>

      {/* How it works */}
      <div className="card p-6">
        <h3 className="font-semibold text-sm mb-3">Comment ca marche</h3>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Partagez votre lien', desc: 'Envoyez votre lien d\'invitation a vos amis' },
            { step: '2', title: 'Ils s\'inscrivent', desc: 'Vos amis creent un compte avec votre code' },
            { step: '3', title: 'Ils souscrivent', desc: 'Quand ils passent a Premium ou Pro' },
            { step: '4', title: 'Vous gagnez', desc: `Recevez ${data?.commissionRate || 20}% du montant de leur abonnement` },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referrals list */}
      {data?.referrals?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-sm mb-3">Vos filleuls ({data.referrals.length})</h3>
          <div className="space-y-2">
            {data.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-night-light border border-night-border">
                <div>
                  <p className="text-sm font-semibold">{r.userName}</p>
                  <p className="text-[11px] text-gray-500">{new Date(r.registeredAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.hasPaid ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
                  {r.hasPaid ? `+${fmt(r.commission)} F` : 'Gratuit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
