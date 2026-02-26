import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Market() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('Tous');

  useEffect(() => { loadStocks(); const i = setInterval(loadStocks, 30000); return () => clearInterval(i); }, []);

  const loadStocks = async () => {
    try { const r = await api.get('/api/portfolio/stocks'); setStocks(r.data); } catch {} finally { setLoading(false); }
  };

  const sectors = ['Tous', ...new Set(stocks.map(s => s.sector))];
  const filtered = sectorFilter === 'Tous' ? stocks : stocks.filter(s => s.sector === sectorFilter);
  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  const gainers = [...stocks].sort((a, b) => b.change - a.change).slice(0, 5);
  const losers = [...stocks].sort((a, b) => a.change - b.change).slice(0, 5);

  if (loading) return <div className="text-center py-20 text-gold">Chargement du marche...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-1">Marche BRVM</h1>
        <p className="text-gray-500 text-sm">Donnees des actions cotees a la Bourse Regionale • Rafraichi toutes les 30s</p>
      </div>

      {/* Top Gainers / Losers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-green-400 mb-3">📈 Top Hausse</h3>
          {gainers.map(s => (
            <div key={s.symbol} className="flex justify-between py-1.5 border-b border-night-border/30 last:border-0">
              <span className="text-sm"><span className="font-bold">{s.symbol}</span> <span className="text-gray-500 text-xs">{s.name}</span></span>
              <span className="text-green-400 text-sm font-bold">+{s.change}%</span>
            </div>
          ))}
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-3">📉 Top Baisse</h3>
          {losers.map(s => (
            <div key={s.symbol} className="flex justify-between py-1.5 border-b border-night-border/30 last:border-0">
              <span className="text-sm"><span className="font-bold">{s.symbol}</span> <span className="text-gray-500 text-xs">{s.name}</span></span>
              <span className="text-red-400 text-sm font-bold">{s.change}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sector Filter */}
      <div className="flex gap-2 flex-wrap">
        {sectors.map(s => (
          <button key={s} onClick={() => setSectorFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${sectorFilter === s ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-night-card border border-night-border text-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Stocks Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-night-border text-xs text-gray-500 uppercase">
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Pays</th>
              <th className="text-left px-4 py-3">Secteur</th>
              <th className="text-right px-4 py-3">Prix (FCFA)</th>
              <th className="text-right px-4 py-3">Variation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.symbol} className="border-b border-night-border/30 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <span className="font-bold">{s.symbol}</span><br/>
                  <span className="text-[11px] text-gray-500">{s.name}</span>
                </td>
                <td className="px-4 py-3 text-xs">{s.country}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{s.sector}</td>
                <td className="text-right px-4 py-3 font-mono font-semibold">{fmt(s.price)}</td>
                <td className={`text-right px-4 py-3 font-bold ${s.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {s.change >= 0 ? '▲' : '▼'} {Math.abs(s.change)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
