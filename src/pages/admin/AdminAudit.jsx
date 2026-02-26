import { useState, useEffect } from 'react';
import api from '../../api/axios';

const ACTION_LABELS = {
  LOGIN_SUCCESS: { label: 'Connexion', color: 'text-green-400 bg-green-500/10' },
  LOGIN_FAILED: { label: 'Echec connexion', color: 'text-red-400 bg-red-500/10' },
  LOGIN_LOCKED: { label: 'Compte verrouille', color: 'text-red-400 bg-red-500/15' },
  REGISTER: { label: 'Inscription', color: 'text-blue-400 bg-blue-500/10' },
  LOGOUT: { label: 'Deconnexion', color: 'text-gray-400 bg-gray-500/10' },
  PASSWORD_CHANGE: { label: 'Changement MDP', color: 'text-orange-400 bg-orange-500/10' },
  '2FA_ENABLED': { label: '2FA activee', color: 'text-green-400 bg-green-500/10' },
  '2FA_DISABLED': { label: '2FA desactivee', color: 'text-orange-400 bg-orange-500/10' },
  '2FA_FAILED': { label: '2FA echouee', color: 'text-red-400 bg-red-500/10' },
  ADMIN_COURSE_CREATE: { label: 'Cours cree', color: 'text-gold bg-gold/10' },
  ADMIN_COURSE_UPDATE: { label: 'Cours modifie', color: 'text-gold bg-gold/10' },
  ADMIN_COURSE_DELETE: { label: 'Cours supprime', color: 'text-red-400 bg-red-500/10' },
  ADMIN_USER_UPDATE: { label: 'User modifie', color: 'text-gold bg-gold/10' },
  ADMIN_USER_DELETE: { label: 'User supprime', color: 'text-red-400 bg-red-500/10' },
  SESSION_REVOKE_ALL: { label: 'Sessions revoquees', color: 'text-orange-400 bg-orange-500/10' },
};

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get(`/api/admin/audit?page=${page}&limit=30${filter ? `&action=${filter}` : ''}`),
        api.get('/api/admin/audit/stats'),
      ]);
      setLogs(logsRes.data.logs);
      setTotalPages(logsRes.data.pages);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Journal d'Audit & Securite</h1>
        <p className="text-gray-500 mt-1">OWASP A09:2021 — Surveillance et detection d'intrusion</p>
      </div>

      {/* Security Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-3xl font-serif text-red-400">{stats.failedLogins24h}</p>
            <p className="text-sm text-gray-500 mt-1">Echecs connexion (24h)</p>
          </div>
          <div className="card p-5">
            <p className="text-3xl font-serif text-orange-400">{stats.failedLoginsWeek}</p>
            <p className="text-sm text-gray-500 mt-1">Echecs connexion (7j)</p>
          </div>
          <div className="card p-5">
            <p className="text-3xl font-serif text-red-400">{stats.lockedAccounts}</p>
            <p className="text-sm text-gray-500 mt-1">Comptes verrouilles (7j)</p>
          </div>
          <div className="card p-5">
            <p className="text-3xl font-serif text-gray-400">{stats.totalLogs}</p>
            <p className="text-sm text-gray-500 mt-1">Total evenements</p>
          </div>
        </div>
      )}

      {/* Suspicious IPs */}
      {stats?.suspiciousIps?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-3 text-red-400">IPs suspectes (echecs 24h)</h3>
          <div className="flex flex-wrap gap-2">
            {stats.suspiciousIps.map((ip, i) => (
              <span key={i} className="text-xs font-mono bg-red-500/10 text-red-400 px-3 py-1 rounded-lg">
                {ip._id} ({ip.count} echecs)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="bg-night-light border border-night-border rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
        >
          <option value="">Toutes les actions</option>
          <option value="LOGIN_SUCCESS">Connexions reussies</option>
          <option value="LOGIN_FAILED">Echecs de connexion</option>
          <option value="LOGIN_LOCKED">Comptes verrouilles</option>
          <option value="REGISTER">Inscriptions</option>
          <option value="PASSWORD_CHANGE">Changements MDP</option>
          <option value="2FA_ENABLED">2FA activee</option>
          <option value="ADMIN_COURSE_CREATE">Cours crees</option>
          <option value="ADMIN_USER_UPDATE">Users modifies</option>
        </select>
        <span className="text-sm text-gray-500">Page {page}/{totalPages}</span>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-border">
                {['Date', 'Action', 'Utilisateur', 'IP', 'Description', 'Statut'].map(h => (
                  <th key={h} className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'text-gray-400 bg-gray-500/10' };
                const date = new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <tr key={i} className="border-b border-night-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{log.userEmail || '-'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{log.ip}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{log.description}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase ${log.status === 'failure' ? 'text-red-400' : log.status === 'warning' ? 'text-orange-400' : 'text-green-400'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-2xl mb-2">🔒</p>
            <p className="text-sm">Aucun evenement enregistre</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg text-sm bg-night-card border border-night-border disabled:opacity-30 hover:border-gold transition-all">Precedent</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg text-sm bg-night-card border border-night-border disabled:opacity-30 hover:border-gold transition-all">Suivant</button>
        </div>
      )}
    </div>
  );
}
