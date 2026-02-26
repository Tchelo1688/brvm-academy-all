import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const COUNTRIES = {
  CI: '🇨🇮 Cote d\'Ivoire', SN: '🇸🇳 Senegal', BF: '🇧🇫 Burkina Faso',
  ML: '🇲🇱 Mali', TG: '🇹🇬 Togo', BJ: '🇧🇯 Benin', NE: '🇳🇪 Niger', GW: '🇬🇼 Guinee-Bissau',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, field, value) => {
    try {
      const res = await api.put(`/api/admin/users/${id}`, { [field]: value });
      setUsers(users.map(u => u._id === id ? res.data : u));
      toast.success('Utilisateur mis a jour');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Supprimer l'utilisateur "${name}" ? Cette action est irreversible.`)) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('Utilisateur supprime');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Gestion des Utilisateurs</h1>
        <p className="text-gray-500 mt-1">{users.length} utilisateurs inscrits</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-border">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Utilisateur</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Pays</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">XP</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Plan</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Role</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Inscrit le</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
                const dateStr = new Date(user.createdAt).toLocaleDateString('fr-FR');
                return (
                  <tr key={user._id} className="border-b border-night-border/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">{COUNTRIES[user.country] || user.country || '-'}</td>
                    <td className="px-5 py-4 text-sm font-mono text-gold">{user.xp || 0}</td>
                    <td className="px-5 py-4">
                      <select
                        value={user.plan || 'gratuit'}
                        onChange={(e) => updateUser(user._id, 'plan', e.target.value)}
                        className="bg-night-light border border-night-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-gold"
                      >
                        <option value="gratuit">Gratuit</option>
                        <option value="premium">Premium</option>
                        <option value="pro">Pro</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => updateUser(user._id, 'role', e.target.value)}
                        className="bg-night-light border border-night-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-gold"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="instructor">Instructeur</option>
                        <option value="moderator">Moderateur</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{dateStr}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteUser(user._id, user.name)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
