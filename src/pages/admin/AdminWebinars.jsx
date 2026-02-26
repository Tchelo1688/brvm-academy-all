import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const inputClass = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

export default function AdminWebinars() {
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', instructor: '', scheduledAt: '',
    duration: '1h', meetingUrl: '', maxParticipants: 100,
    category: 'general', accessLevel: 'gratuit', published: true,
  });

  useEffect(() => { loadWebinars(); }, []);

  const loadWebinars = async () => {
    try { const r = await api.get('/api/webinars'); setWebinars(r.data); }
    catch {} finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', instructor: '', scheduledAt: '', duration: '1h', meetingUrl: '', maxParticipants: 100, category: 'general', accessLevel: 'gratuit', published: true });
    setEditingId(null);
    setShowForm(false);
  };

  const editWebinar = (w) => {
    setForm({
      title: w.title, description: w.description, instructor: w.instructor,
      scheduledAt: w.scheduledAt ? new Date(w.scheduledAt).toISOString().slice(0, 16) : '',
      duration: w.duration, meetingUrl: w.meetingUrl || '', maxParticipants: w.maxParticipants,
      category: w.category, accessLevel: w.accessLevel, published: w.published,
    });
    setEditingId(w._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.instructor || !form.scheduledAt) {
      return toast.error('Titre, description, instructeur et date requis');
    }
    setSaving(true);
    try {
      const payload = { ...form, maxParticipants: Number(form.maxParticipants) };
      if (editingId) {
        await api.put(`/api/webinars/${editingId}`, payload);
        toast.success('Webinaire mis a jour');
      } else {
        await api.post('/api/webinars', payload);
        toast.success('Webinaire cree !');
      }
      resetForm();
      loadWebinars();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const deleteWebinar = async (id) => {
    if (!confirm('Supprimer ce webinaire ?')) return;
    try { await api.delete(`/api/webinars/${id}`); toast.success('Supprime'); loadWebinars(); }
    catch { toast.error('Erreur'); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/api/webinars/${id}`, { status }); toast.success(`Statut: ${status}`); loadWebinars(); }
    catch { toast.error('Erreur'); }
  };

  const getStatusBadge = (w) => {
    const now = new Date();
    const start = new Date(w.scheduledAt);
    if (w.status === 'cancelled') return { label: 'Annule', color: 'bg-gray-500/15 text-gray-400' };
    if (w.status === 'ended') return { label: 'Termine', color: 'bg-gray-500/15 text-gray-400' };
    if (w.status === 'live' || (now >= start && now <= new Date(start.getTime() + 2 * 3600000))) return { label: 'EN DIRECT', color: 'bg-red-500/15 text-red-400' };
    return { label: 'A venir', color: 'bg-blue-500/15 text-blue-400' };
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Gerer les Webinaires</h1>
          <p className="text-gray-500 mt-1">{webinars.length} webinaires</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-gold text-sm">+ Nouveau Webinaire</button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card p-6 space-y-4 border-2 border-gold/20">
          <h2 className="font-semibold text-lg">{editingId ? 'Modifier le Webinaire' : 'Nouveau Webinaire'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Analyse technique des actions BRVM" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Decrivez le contenu du webinaire..." className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Instructeur *</label>
              <input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="Nom de l'animateur" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date et heure *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Duree</label>
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="1h" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Places max</label>
              <input type="number" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Lien de reunion (Zoom, Google Meet, etc.)</label>
              <input value={form.meetingUrl} onChange={e => setForm({ ...form, meetingUrl: e.target.value })} placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/abc-defg-hij" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Acces requis</label>
              <select value={form.accessLevel} onChange={e => setForm({ ...form, accessLevel: e.target.value })} className={inputClass}>
                <option value="gratuit">Gratuit (tous)</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-green-500" />
                <span className="text-sm text-gray-300">Publie (visible par les etudiants)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-gold text-sm">{saving ? 'Sauvegarde...' : editingId ? 'Mettre a jour' : 'Creer le Webinaire'}</button>
            <button onClick={resetForm} className="btn-outline text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {webinars.map(w => {
          const status = getStatusBadge(w);
          return (
            <div key={w._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    {w.accessLevel !== 'gratuit' && <span className="text-[11px] bg-gold/15 text-gold px-2 py-0.5 rounded-full">{w.accessLevel}</span>}
                  </div>
                  <h3 className="font-bold text-[15px] mb-1">{w.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{w.description}</p>
                  <div className="flex gap-4 text-[11px] text-gray-500">
                    <span>🎓 {w.instructor}</span>
                    <span>📅 {new Date(w.scheduledAt).toLocaleString('fr-FR')}</span>
                    <span>⏱ {w.duration}</span>
                    <span>👥 {w.registrations?.length || 0}/{w.maxParticipants} inscrits</span>
                    {w.meetingUrl && <span className="text-blue-400">🔗 Lien configure</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  {status.label === 'A venir' && (
                    <button onClick={() => updateStatus(w._id, 'live')} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">Demarrer le live</button>
                  )}
                  {status.label === 'EN DIRECT' && (
                    <button onClick={() => updateStatus(w._id, 'ended')} className="text-xs px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20">Terminer</button>
                  )}
                  <button onClick={() => editWebinar(w)} className="text-xs px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20">Modifier</button>
                  <button onClick={() => deleteWebinar(w._id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">Supprimer</button>
                </div>
              </div>
            </div>
          );
        })}
        {webinars.length === 0 && (
          <div className="card p-12 text-center text-gray-500">
            <p className="text-3xl mb-2">📺</p>
            <p className="text-sm">Aucun webinaire. Cliquez "+ Nouveau Webinaire" pour en creer un.</p>
          </div>
        )}
      </div>
    </div>
  );
}
