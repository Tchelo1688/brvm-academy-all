import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('portfolio'); // portfolio, market, history
  const [tradeModal, setTradeModal] = useState(null); // {stock, type:'buy'|'sell'}
  const [quantity, setQuantity] = useState(1);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [p, s] = await Promise.all([api.get('/api/portfolio'), api.get('/api/portfolio/stocks')]);
      setPortfolio(p.data);
      setStocks(s.data);
    } catch {} finally { setLoading(false); }
  };

  const executeTrade = async () => {
    if (!tradeModal || quantity <= 0) return;
    try {
      const res = await api.post(`/api/portfolio/${tradeModal.type}`, { symbol: tradeModal.stock.symbol, quantity });
      toast.success(res.data.message);
      setPortfolio(res.data.portfolio);
      setTradeModal(null);
      setQuantity(1);
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const resetPortfolio = async () => {
    if (!confirm('Reinitialiser le portefeuille ? Vous perdrez tout.')) return;
    try {
      const res = await api.post('/api/portfolio/reset');
      toast.success(res.data.message);
      setPortfolio(res.data.portfolio);
    } catch { toast.error('Erreur'); }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl mb-1">Portefeuille Virtuel</h1>
          <p className="text-gray-500 text-sm">Apprenez a investir avec 10 000 000 FCFA virtuels</p>
        </div>
        <button onClick={resetPortfolio} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">Reinitialiser</button>
      </div>

      {/* Stats */}
      {portfolio && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Valeur Totale', val: `${fmt(portfolio.totalValue)} F`, color: 'text-white' },
            { label: 'Solde Disponible', val: `${fmt(portfolio.balance)} F`, color: 'text-blue-400' },
            { label: 'P&L Total', val: `${portfolio.profitLoss >= 0 ? '+' : ''}${fmt(portfolio.profitLoss)} F`, color: portfolio.profitLoss >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: 'Rendement', val: `${portfolio.profitLossPercent >= 0 ? '+' : ''}${portfolio.profitLossPercent}%`, color: portfolio.profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400' },
          ].map((s, i) => (
            <div key={i} className="card p-4">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className={`font-serif text-lg font-bold ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ k: 'portfolio', l: '💼 Mes Actions' }, { k: 'market', l: '📊 Marche BRVM' }, { k: 'history', l: '📋 Historique' }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.k ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-night-card border border-night-border text-gray-400'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Holdings */}
      {tab === 'portfolio' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-night-border text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Action</th><th className="text-right px-4 py-3">Qte</th>
              <th className="text-right px-4 py-3">Prix moy.</th><th className="text-right px-4 py-3">Prix actuel</th>
              <th className="text-right px-4 py-3">P&L</th><th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {portfolio?.holdings?.length > 0 ? portfolio.holdings.map(h => {
                const pl = (h.currentPrice - h.avgBuyPrice) * h.quantity;
                const plPct = ((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice * 100).toFixed(1);
                return (
                  <tr key={h.symbol} className="border-b border-night-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3"><span className="font-bold">{h.symbol}</span><br/><span className="text-[11px] text-gray-500">{h.companyName}</span></td>
                    <td className="text-right px-4 py-3">{h.quantity}</td>
                    <td className="text-right px-4 py-3">{fmt(h.avgBuyPrice)}</td>
                    <td className="text-right px-4 py-3">{fmt(h.currentPrice)}</td>
                    <td className={`text-right px-4 py-3 font-bold ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pl >= 0 ? '+' : ''}{fmt(pl)} ({plPct}%)</td>
                    <td className="text-right px-4 py-3">
                      <button onClick={() => { const s = stocks.find(st => st.symbol === h.symbol); if(s) setTradeModal({ stock: s, type: 'sell' }); }}
                        className="text-[11px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Vendre</button>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={6} className="text-center py-8 text-gray-500 text-sm">Aucune action. Allez au marche pour acheter !</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Market */}
      {tab === 'market' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-night-border text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Secteur</th>
              <th className="text-right px-4 py-3">Prix (FCFA)</th><th className="text-right px-4 py-3">Variation</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s.symbol} className="border-b border-night-border/30 hover:bg-white/[0.02]">
                  <td className="px-4 py-3"><span className="font-bold">{s.symbol}</span><br/><span className="text-[11px] text-gray-500">{s.name} ({s.country})</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{s.sector}</td>
                  <td className="text-right px-4 py-3 font-mono">{fmt(s.price)}</td>
                  <td className={`text-right px-4 py-3 font-bold ${s.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{s.change >= 0 ? '+' : ''}{s.change}%</td>
                  <td className="text-right px-4 py-3">
                    <button onClick={() => setTradeModal({ stock: s, type: 'buy' })} className="text-[11px] px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 mr-1">Acheter</button>
                    <button onClick={() => setTradeModal({ stock: s, type: 'sell' })} className="text-[11px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20">Vendre</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-night-border text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Action</th><th className="text-right px-4 py-3">Qte</th>
              <th className="text-right px-4 py-3">Prix</th><th className="text-right px-4 py-3">Total</th>
            </tr></thead>
            <tbody>
              {portfolio?.transactions?.length > 0 ? [...portfolio.transactions].reverse().slice(0, 50).map((t, i) => (
                <tr key={i} className="border-b border-night-border/30">
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(t.executedAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${t.type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{t.type === 'buy' ? 'ACHAT' : 'VENTE'}</span></td>
                  <td className="px-4 py-3 font-semibold">{t.symbol}</td>
                  <td className="text-right px-4 py-3">{t.quantity}</td>
                  <td className="text-right px-4 py-3 font-mono">{fmt(t.price)}</td>
                  <td className="text-right px-4 py-3 font-mono">{fmt(t.total)}</td>
                </tr>
              )) : <tr><td colSpan={6} className="text-center py-8 text-gray-500">Aucune transaction</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Trade Modal */}
      {tradeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTradeModal(null)}>
          <div className="card p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-lg">{tradeModal.type === 'buy' ? '🟢 Acheter' : '🔴 Vendre'} {tradeModal.stock.symbol}</h3>
            <p className="text-sm text-gray-400">{tradeModal.stock.name} — {fmt(tradeModal.stock.price)} FCFA</p>
            <div>
              <label className="text-xs text-gray-500">Quantite</label>
              <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold mt-1" />
            </div>
            <p className="text-sm text-gray-400">Total: <span className="text-gold font-bold">{fmt(tradeModal.stock.price * quantity)} FCFA</span> + frais 0.5%</p>
            <div className="flex gap-3">
              <button onClick={executeTrade}
                className={`flex-1 py-3 rounded-xl text-sm font-bold ${tradeModal.type === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                {tradeModal.type === 'buy' ? 'Confirmer l\'achat' : 'Confirmer la vente'}
              </button>
              <button onClick={() => setTradeModal(null)} className="btn-outline text-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
