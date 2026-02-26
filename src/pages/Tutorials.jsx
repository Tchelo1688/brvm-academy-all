import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_TUTORIALS } from '../utils/sampleData';

const CATEGORIES = ['Tous', 'Guide Pratique', 'Analyse', 'Strategie', 'Reglementation', 'Outils', 'Debutant'];

export default function Tutorials() {
  const { user } = useAuth();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('Tous');
  const [selectedTut, setSelectedTut] = useState(null);

  useEffect(() => { loadTutorials(); }, []);

  const loadTutorials = async () => {
    try {
      const res = await api.get('/api/tutorials');
      if (res.data?.length > 0) {
        setTutorials(res.data);
      } else {
        setTutorials(SAMPLE_TUTORIALS);
      }
    } catch {
      setTutorials(SAMPLE_TUTORIALS);
    } finally { setLoading(false); }
  };

  const loadDetail = async (id) => {
    try {
      const res = await api.get(`/api/tutorials/${id}`);
      setSelectedTut(res.data);
    } catch {
      const tut = tutorials.find(t => (t._id || t.id) === id);
      setSelectedTut(tut);
    }
  };

  const canAccess = (accessLevel) => {
    if (accessLevel === 'gratuit') return true;
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'moderator') return true;
    if (accessLevel === 'premium') return ['premium', 'pro'].includes(user.plan);
    if (accessLevel === 'pro') return user.plan === 'pro';
    return false;
  };

  const filtered = tutorials.filter(t => {
    if (catFilter !== 'Tous' && t.category !== catFilter) return false;
    return true;
  });

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  // Detail view
  if (selectedTut) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={() => setSelectedTut(null)} className="text-sm text-gray-500 hover:text-gold transition-colors">
          ← Retour aux tutoriels
        </button>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${selectedTut.color || 'bg-blue-500/15'}`}>
              {selectedTut.icon || '📘'}
            </div>
            <div>
              <h1 className="font-serif text-2xl">{selectedTut.title}</h1>
              <div className="flex gap-3 text-[11px] text-gray-500 mt-1">
                <span>📂 {selectedTut.category}</span>
                <span>⏱ {selectedTut.readTime}</span>
                <span>👁 {selectedTut.views} vues</span>
                {selectedTut.authorName && <span>Par {selectedTut.authorName}</span>}
              </div>
            </div>
          </div>

          <p className="text-gray-400 leading-relaxed mb-6">{selectedTut.description}</p>

          {/* Contenu texte */}
          {selectedTut.content && (
            <div className="prose prose-invert max-w-none mb-6">
              <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedTut.content}
              </div>
            </div>
          )}

          {/* PDFs */}
          {selectedTut.pdfFiles?.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg border-b border-night-border pb-2">Documents PDF ({selectedTut.pdfFiles.length})</h2>
              
              {selectedTut.pdfFiles.map((pdf, i) => {
                const accessible = canAccess(selectedTut.accessLevel);
                return (
                  <div key={pdf._id || i} className="rounded-xl border border-night-border overflow-hidden">
                    {/* PDF Header */}
                    <div className="flex items-center gap-3 p-4 bg-night-light">
                      <span className="text-2xl">📄</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{pdf.name}</p>
                        <p className="text-[11px] text-gray-500">{(pdf.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      {accessible ? (
                        <div className="flex gap-2">
                          <a href={pdf.url} target="_blank" rel="noreferrer"
                            className="text-xs px-4 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-all font-semibold">
                            Ouvrir le PDF
                          </a>
                          <a href={pdf.url} download={pdf.name}
                            className="text-xs px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all font-semibold">
                            Telecharger
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 font-semibold">
                          🔒 Acces {selectedTut.accessLevel}
                        </span>
                      )}
                    </div>

                    {/* PDF Preview (embedded) */}
                    {accessible && pdf.url && !pdf.url.startsWith('data:') && (
                      <div className="w-full h-[600px] bg-white">
                        <iframe
                          src={pdf.url}
                          className="w-full h-full"
                          title={pdf.name}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {selectedTut.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-night-border">
              {selectedTut.tags.map((tag, i) => (
                <span key={i} className="text-[11px] bg-night-light text-gray-400 px-3 py-1 rounded-full border border-night-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-2">Tutoriels Pratiques</h1>
        <p className="text-gray-500">Guides PDF et articles pour maitriser le trading BRVM</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              catFilter === c ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-night-card border border-night-border text-gray-400 hover:text-white'
            }`}>
            {c}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500">{filtered.length} tutoriels</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((tut) => {
          const id = tut._id || tut.id;
          const pdfCount = tut.pdfFiles?.length || 0;
          const accessible = canAccess(tut.accessLevel);

          return (
            <div key={id}
              onClick={() => tut._id ? loadDetail(tut._id) : setSelectedTut(tut)}
              className="card p-5 flex gap-4 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${tut.color || 'bg-blue-500/15'}`}>
                {tut.icon || '📘'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[15px] leading-snug">{tut.title}</h3>
                  {!accessible && <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">🔒 {tut.accessLevel}</span>}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed mb-2">{tut.description}</p>
                <div className="flex gap-4 text-[11px] text-gray-600">
                  <span>⏱ {tut.readTime || '5 min'}</span>
                  <span>👁 {tut.views || 0} vues</span>
                  {pdfCount > 0 && <span className="text-red-400">📄 {pdfCount} PDF{pdfCount > 1 ? 's' : ''}</span>}
                  {tut.category && <span>📂 {tut.category}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📘</p>
          <p>Aucun tutoriel dans cette categorie</p>
        </div>
      )}
    </div>
  );
}
