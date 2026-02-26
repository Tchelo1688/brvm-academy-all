import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Guide Pratique', 'Analyse', 'Strategie', 'Reglementation', 'Outils', 'Debutant'];
const ICONS = ['📘', '📊', '📈', '⚖️', '🛠️', '🎓', '💡', '📋', '🔍', '🏦'];
const ACCESS_LEVELS = [
  { value: 'gratuit', label: 'Gratuit' },
  { value: 'premium', label: 'Premium' },
  { value: 'pro', label: 'Pro' },
];

const inputClass = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

export default function AdminTutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState('');
  const pdfInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', content: '', category: 'Guide Pratique',
    icon: '📘', color: 'bg-blue-500/15', accessLevel: 'gratuit',
    readTime: '5 min', tags: '', published: true,
  });

  useEffect(() => { loadTutorials(); }, []);

  const loadTutorials = async () => {
    try {
      const res = await api.get('/api/tutorials/admin/all');
      setTutorials(res.data);
    } catch (err) {
      toast.error('Erreur chargement tutoriels');
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', description: '', content: '', category: 'Guide Pratique', icon: '📘', color: 'bg-blue-500/15', accessLevel: 'gratuit', readTime: '5 min', tags: '', published: true });
    setEditingId(null);
    setShowForm(false);
  };

  const editTutorial = (tut) => {
    setForm({
      title: tut.title, description: tut.description, content: tut.content || '',
      category: tut.category, icon: tut.icon, color: tut.color,
      accessLevel: tut.accessLevel, readTime: tut.readTime,
      tags: (tut.tags || []).join(', '), published: tut.published,
    });
    setEditingId(tut._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.description) return toast.error('Titre et description requis');
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editingId) {
        await api.put(`/api/tutorials/${editingId}`, payload);
        toast.success('Tutoriel mis a jour');
      } else {
        await api.post('/api/tutorials', payload);
        toast.success('Tutoriel cree');
      }
      resetForm();
      loadTutorials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const deleteTutorial = async (id) => {
    if (!confirm('Supprimer ce tutoriel et ses PDFs ?')) return;
    try {
      await api.delete(`/api/tutorials/${id}`);
      toast.success('Tutoriel supprime');
      loadTutorials();
    } catch (err) { toast.error('Erreur'); }
  };

  const uploadPdf = async (tutorialId, file) => {
    if (!file || file.type !== 'application/pdf') return toast.error('Fichier PDF requis');
    if (file.size > 50 * 1024 * 1024) return toast.error('Max 50 MB');

    setUploadingPdf(tutorialId);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      await api.post(`/api/tutorials/${tutorialId}/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`PDF "${file.name}" uploade !`);
      loadTutorials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload PDF');
    } finally { setUploadingPdf(''); }
  };

  const deletePdf = async (tutorialId, pdfId) => {
    if (!confirm('Supprimer ce PDF ?')) return;
    try {
      await api.delete(`/api/tutorials/${tutorialId}/pdf/${pdfId}`);
      toast.success('PDF supprime');
      loadTutorials();
    } catch (err) { toast.error('Erreur'); }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Gerer les Tutoriels</h1>
          <p className="text-gray-500 mt-1">{tutorials.length} tutoriels • Ajoutez des guides PDF</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-gold text-sm">
          + Nouveau Tutoriel
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 space-y-4 border-2 border-gold/20">
          <h2 className="font-semibold text-lg">{editingId ? 'Modifier le Tutoriel' : 'Nouveau Tutoriel'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Comment ouvrir un compte titre BRVM" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Resume du tutoriel..." className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Contenu (Markdown)</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} placeholder="# Introduction&#10;&#10;Ecrivez le contenu ici en Markdown..." className={`${inputClass} font-mono text-xs`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Categorie</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Acces requis</label>
              <select value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: e.target.value })} className={inputClass}>
                {ACCESS_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Temps de lecture</label>
              <input value={form.readTime} onChange={(e) => setForm({ ...form, readTime: e.target.value })} placeholder="5 min" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags (separes par virgule)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="brvm, debutant, compte titre" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Icone</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(e => (
                  <button key={e} type="button" onClick={() => setForm({ ...form, icon: e })}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === e ? 'bg-gold/20 border-2 border-gold' : 'bg-night-light border border-night-border'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-green-500" />
                <span className="text-sm text-gray-300">Publie</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-gold text-sm">
              {saving ? 'Sauvegarde...' : editingId ? 'Mettre a jour' : 'Creer'}
            </button>
            <button onClick={resetForm} className="btn-outline text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Tutorial List */}
      <div className="space-y-3">
        {tutorials.map((tut) => (
          <div key={tut._id} className="card p-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${tut.color}`}>
                {tut.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[15px]">{tut.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tut.published ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    {tut.published ? 'Publie' : 'Brouillon'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    tut.accessLevel === 'pro' ? 'bg-purple-500/15 text-purple-400' :
                    tut.accessLevel === 'premium' ? 'bg-gold/15 text-gold' : 'bg-green-500/15 text-green-400'
                  }`}>
                    {tut.accessLevel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{tut.description}</p>

                {/* PDF files */}
                {tut.pdfFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tut.pdfFiles.map((pdf) => (
                      <div key={pdf._id} className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg">
                        <span className="text-red-400 text-sm">📄</span>
                        <a href={pdf.url} target="_blank" rel="noreferrer" className="text-xs text-red-300 hover:underline">
                          {pdf.name} ({(pdf.size / 1024 / 1024).toFixed(1)} MB)
                        </a>
                        <button onClick={() => deletePdf(tut._id, pdf._id)} className="text-red-500 hover:text-red-300 text-xs ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 text-[11px] text-gray-600">
                  <span>📄 {tut.pdfFiles?.length || 0} PDFs</span>
                  <span>👁 {tut.views} vues</span>
                  <span>⏱ {tut.readTime}</span>
                  <span>Par {tut.authorName}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {/* Upload PDF button */}
                <label className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-all ${
                  uploadingPdf === tut._id ? 'bg-gold/20 text-gold' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}>
                  {uploadingPdf === tut._id ? '⏳ Upload...' : '📄 + PDF'}
                  <input type="file" accept=".pdf" className="hidden"
                    onChange={(e) => { if (e.target.files[0]) uploadPdf(tut._id, e.target.files[0]); e.target.value = ''; }}
                  />
                </label>
                <button onClick={() => editTutorial(tut)} className="text-xs px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-all">Modifier</button>
                <button onClick={() => deleteTutorial(tut._id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        ))}

        {tutorials.length === 0 && (
          <div className="card p-12 text-center text-gray-500">
            <p className="text-3xl mb-2">📘</p>
            <p className="text-sm">Aucun tutoriel. Cliquez "+ Nouveau Tutoriel" pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
}
