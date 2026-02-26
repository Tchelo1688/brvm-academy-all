import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Erreur stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  const statCards = [
    { label: 'Utilisateurs', value: stats?.totalUsers || 0, icon: '👥', color: 'from-blue-500/20 to-blue-600/5', textColor: 'text-blue-400' },
    { label: 'Cours Total', value: stats?.totalCourses || 0, icon: '📚', color: 'from-gold/20 to-gold/5', textColor: 'text-gold' },
    { label: 'Cours Publies', value: stats?.publishedCourses || 0, icon: '✅', color: 'from-green-500/20 to-green-600/5', textColor: 'text-green-400' },
    { label: 'Lecons Total', value: stats?.totalLessons || 0, icon: '🎬', color: 'from-purple-500/20 to-purple-600/5', textColor: 'text-purple-400' },
    { label: 'Utilisateurs Premium', value: stats?.premiumUsers || 0, icon: '⭐', color: 'from-orange-500/20 to-orange-600/5', textColor: 'text-orange-400' },
    { label: 'Nouveaux (7j)', value: stats?.newUsers || 0, icon: '🆕', color: 'from-emerald/20 to-emerald/5', textColor: 'text-emerald' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Panel Administration</h1>
          <p className="text-gray-500 mt-1">Gerez vos cours, lecons et utilisateurs</p>
        </div>
        <Link to="/admin/courses/new" className="btn-gold text-sm">+ Nouveau Cours</Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={`card p-5 bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className={`font-serif text-3xl ${s.textColor}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/courses" className="card p-6 hover:-translate-y-1 hover:shadow-xl transition-all group">
          <span className="text-3xl mb-3 block">📚</span>
          <h3 className="font-bold text-lg mb-1 group-hover:text-gold transition-colors">Gerer les Cours</h3>
          <p className="text-sm text-gray-500">Creer, modifier, publier vos cours et lecons</p>
        </Link>
        <Link to="/admin/users" className="card p-6 hover:-translate-y-1 hover:shadow-xl transition-all group">
          <span className="text-3xl mb-3 block">👥</span>
          <h3 className="font-bold text-lg mb-1 group-hover:text-gold transition-colors">Gerer les Utilisateurs</h3>
          <p className="text-sm text-gray-500">Voir les inscrits, modifier les roles et plans</p>
        </Link>
        <Link to="/admin/courses/new" className="card p-6 hover:-translate-y-1 hover:shadow-xl transition-all group border-dashed border-gold/30">
          <span className="text-3xl mb-3 block">➕</span>
          <h3 className="font-bold text-lg mb-1 group-hover:text-gold transition-colors">Ajouter un Cours</h3>
          <p className="text-sm text-gray-500">Creer un nouveau cours avec des lecons</p>
        </Link>
      </div>
    </div>
  );
}
