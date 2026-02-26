import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Webinars() {
  const { user } = useAuth();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');

  useEffect(() => { loadWebinars(); }, []);

  const loadWebinars = async () => {
    try { const r = await api.get('/api/webinars'); setWebinars(r.data); } catch {} finally { setLoading(false); }
  };

  const register = async (id) => {
    try { const r = await api.post(`/api/webinars/${id}/register`); toast.success(r.data.message); loadWebinars(); } catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const openLive = async (webinar) => {
    setSelected(webinar);
    try { const r = await api.get(`/api/webinars/${webinar._id}/messages`); setMessages(r.data); } catch {}
  };

  const sendMsg = async () => {
    if (!msgText.trim() || !selected) return;
    try { const r = await api.post(`/api/webinars/${selected._id}/message`, { content: msgText }); setMessages(r.data); setMsgText(''); } catch {}
  };

  const isRegistered = (w) => w.registrations?.some(r => r.userId === user?._id);
  const getStatus = (w) => {
    const now = new Date();
    const start = new Date(w.scheduledAt);
    if (w.status === 'cancelled') return { label: 'Annule', color: 'bg-gray-500/15 text-gray-400' };
    if (w.status === 'ended' || now > new Date(start.getTime() + 2 * 3600000)) return { label: 'Termine', color: 'bg-gray-500/15 text-gray-400' };
    if (w.status === 'live' || (now >= start && now <= new Date(start.getTime() + 2 * 3600000))) return { label: '🔴 EN DIRECT', color: 'bg-red-500/15 text-red-400' };
    return { label: 'A venir', color: 'bg-blue-500/15 text-blue-400' };
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  if (selected) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gold">← Retour</button>
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatus(selected).color}`}>{getStatus(selected).label}</span>
        </div>
        <h1 className="font-serif text-2xl mb-2">{selected.title}</h1>
        <p className="text-sm text-gray-400 mb-3">{selected.description}</p>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>🎓 {selected.instructor}</span>
          <span>📅 {new Date(selected.scheduledAt).toLocaleString('fr-FR')}</span>
          <span>⏱ {selected.duration}</span>
          <span>👥 {selected.registrations?.length}/{selected.maxParticipants}</span>
        </div>
        {selected.meetingUrl && getStatus(selected).label.includes('DIRECT') && (
          <a href={selected.meetingUrl} target="_blank" rel="noreferrer" className="btn-gold text-sm mt-4 inline-block">Rejoindre le live</a>
        )}
      </div>
      {/* Live Chat */}
      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-3">Chat en direct ({messages.length})</h3>
        <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
          {messages.map((m, i) => (
            <div key={i} className="text-xs"><span className="text-gold font-semibold">{m.userName}</span>: <span className="text-gray-300">{m.content}</span></div>
          ))}
          {messages.length === 0 && <p className="text-xs text-gray-500">Aucun message</p>}
        </div>
        <div className="flex gap-2">
          <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Votre message..." onKeyDown={e => e.key === 'Enter' && sendMsg()}
            className="flex-1 bg-night-light border border-night-border rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-gold" />
          <button onClick={sendMsg} className="btn-gold text-sm px-4">Envoyer</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-1">Webinaires Live</h1>
        <p className="text-gray-500 text-sm">Participez a des sessions en direct avec nos experts</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {webinars.map(w => {
          const status = getStatus(w);
          return (
            <div key={w._id} className="card p-5 hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                {w.accessLevel !== 'gratuit' && <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full">{w.accessLevel}</span>}
              </div>
              <h3 className="font-serif text-lg mb-1">{w.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{w.description}</p>
              <div className="flex gap-3 text-[11px] text-gray-500 mb-3">
                <span>🎓 {w.instructor}</span>
                <span>📅 {new Date(w.scheduledAt).toLocaleDateString('fr-FR')} {new Date(w.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>👥 {w.registrations?.length}/{w.maxParticipants}</span>
              </div>
              <div className="flex gap-2">
                {status.label.includes('DIRECT') && <button onClick={() => openLive(w)} className="btn-gold text-xs">Rejoindre le live</button>}
                {status.label === 'A venir' && !isRegistered(w) && <button onClick={() => register(w._id)} className="btn-gold text-xs">S'inscrire</button>}
                {isRegistered(w) && <span className="text-xs text-green-400">✓ Inscrit</span>}
                <button onClick={() => openLive(w)} className="btn-outline text-xs">Voir le chat</button>
              </div>
            </div>
          );
        })}
        {webinars.length === 0 && <div className="card p-12 text-center text-gray-500 md:col-span-2"><p className="text-3xl mb-2">📺</p><p className="text-sm">Aucun webinaire programme</p></div>}
      </div>
    </div>
  );
}
