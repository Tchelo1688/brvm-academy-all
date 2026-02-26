import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'tous', label: 'Tous', emoji: '🌐' },
  { value: 'general', label: 'General', emoji: '💬' },
  { value: 'analyse', label: 'Analyse', emoji: '📊' },
  { value: 'strategie', label: 'Strategie', emoji: '🎯' },
  { value: 'debutant', label: 'Debutant', emoji: '🎓' },
  { value: 'actualite', label: 'Actualite', emoji: '📰' },
  { value: 'technique', label: 'Technique', emoji: '⚙️' },
];

const ROLE_BADGES = {
  admin: { label: 'Admin', color: 'bg-red-500/15 text-red-400' },
  moderator: { label: 'Mod', color: 'bg-orange-500/15 text-orange-400' },
  instructor: { label: 'Instructeur', color: 'bg-blue-500/15 text-blue-400' },
};

export default function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('tous');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [replyText, setReplyText] = useState('');

  useEffect(() => { loadPosts(); }, [cat]);

  const loadPosts = async () => {
    try {
      const res = await api.get(`/api/forum?category=${cat}`);
      setPosts(res.data.posts || []);
    } catch { } finally { setLoading(false); }
  };

  const loadPost = async (id) => {
    try {
      const res = await api.get(`/api/forum/${id}`);
      setSelected(res.data);
    } catch { toast.error('Erreur'); }
  };

  const createPost = async () => {
    if (!newPost.title || !newPost.content) return toast.error('Titre et contenu requis');
    try {
      await api.post('/api/forum', newPost);
      toast.success('Post cree !');
      setShowNew(false);
      setNewPost({ title: '', content: '', category: 'general' });
      loadPosts();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      const res = await api.post(`/api/forum/${selected._id}/reply`, { content: replyText });
      setSelected(res.data);
      setReplyText('');
    } catch (err) { toast.error('Erreur'); }
  };

  const likePost = async (id) => {
    try {
      await api.post(`/api/forum/${id}/like`);
      if (selected?._id === id) loadPost(id);
      loadPosts();
    } catch { }
  };

  const ic = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

  // Detail view
  if (selected) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gold">← Retour</button>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full">{selected.category}</span>
            {selected.isPinned && <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">📌 Epingle</span>}
          </div>
          <h1 className="font-serif text-2xl mb-2">{selected.title}</h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <span className="font-semibold text-gray-300">{selected.authorName}</span>
            {ROLE_BADGES[selected.authorRole] && <span className={`px-1.5 py-0.5 rounded text-[10px] ${ROLE_BADGES[selected.authorRole].color}`}>{ROLE_BADGES[selected.authorRole].label}</span>}
            <span>• {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</span>
            <span>• {selected.views} vues</span>
            <span>• ❤️ {selected.likes?.length || 0}</span>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{selected.content}</div>
          <button onClick={() => likePost(selected._id)} className="text-xs px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-all">
            ❤️ {selected.likes?.includes(user?._id) ? 'Unlike' : 'Like'} ({selected.likes?.length || 0})
          </button>
        </div>

        {/* Replies */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-sm">{selected.replies?.length || 0} Reponses</h3>
          {selected.replies?.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-night-light border border-night-border">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                <span className="font-semibold text-gray-300">{r.authorName}</span>
                {ROLE_BADGES[r.authorRole] && <span className={`px-1.5 py-0.5 rounded text-[10px] ${ROLE_BADGES[r.authorRole].color}`}>{ROLE_BADGES[r.authorRole].label}</span>}
                <span>• {new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
          {user && !selected.isClosed && (
            <div className="flex gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Votre reponse..." className={`${ic} flex-1`} onKeyDown={(e) => e.key === 'Enter' && sendReply()} />
              <button onClick={sendReply} className="btn-gold text-sm px-6">Envoyer</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl mb-1">Forum Communautaire</h1>
          <p className="text-gray-500 text-sm">Echangez avec la communaute BRVM Academy</p>
        </div>
        {user && <button onClick={() => setShowNew(!showNew)} className="btn-gold text-sm">+ Nouveau Sujet</button>}
      </div>

      {showNew && (
        <div className="card p-5 space-y-3 border border-gold/20">
          <input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} placeholder="Titre du sujet" className={ic} />
          <textarea value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })} rows={4} placeholder="Votre message..." className={ic} />
          <div className="flex gap-3">
            <select value={newPost.category} onChange={(e) => setNewPost({ ...newPost, category: e.target.value })} className={`${ic} w-auto`}>
              {CATEGORIES.filter(c => c.value !== 'tous').map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
            </select>
            <button onClick={createPost} className="btn-gold text-sm">Publier</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setCat(c.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${cat === c.value ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-night-card border border-night-border text-gray-400'}`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gold text-center py-10">Chargement...</p> : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post._id} onClick={() => loadPost(post._id)} className="card p-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {post.isPinned && <span className="text-yellow-400 text-xs">📌</span>}
                    <h3 className="font-semibold text-sm">{post.title}</h3>
                  </div>
                  <div className="flex gap-3 text-[11px] text-gray-500">
                    <span>{post.authorName}</span>
                    <span className="text-gold">{post.category}</span>
                    <span>💬 {post.replies?.length || 0}</span>
                    <span>❤️ {post.likes?.length || 0}</span>
                    <span>👁 {post.views}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="card p-12 text-center text-gray-500"><p className="text-3xl mb-2">💬</p><p className="text-sm">Aucun sujet. Soyez le premier a poster !</p></div>}
        </div>
      )}
    </div>
  );
}
