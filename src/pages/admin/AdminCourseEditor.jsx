import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Fondamentaux', 'Analyse Technique', 'Analyse Fondamentale', 'Strategies', 'Obligations', 'Pratique'];
const LEVELS = [
  { value: 'debutant', label: 'Debutant' },
  { value: 'intermediaire', label: 'Intermediaire' },
  { value: 'avance', label: 'Avance' },
];
const EMOJIS = ['📈', '📊', '💰', '🏦', '🔍', '🌐', '📋', '⚡', '🎯', '💎'];

const inputClass = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

// =============================================
// Composant Upload Video
// =============================================
function VideoUploader({ onUpload, currentUrl }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cloudinaryStatus, setCloudinaryStatus] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { checkCloudinary(); }, []);

  const checkCloudinary = async () => {
    try {
      const res = await api.get('/api/upload/status');
      setCloudinaryStatus(res.data);
    } catch { setCloudinaryStatus({ configured: false }); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation cote client
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('Fichier trop volumineux (max 500 MB)');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporte. Utilisez MP4, WebM ou MOV.');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await api.post('/api/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress(pct);
        },
      });

      onUpload(res.data.url);
      toast.success(`Video uploadee ! (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur upload');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-sm font-medium text-gray-300">Video</label>
        {cloudinaryStatus?.configured && (
          <span className="text-[10px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Cloudinary connecte</span>
        )}
        {cloudinaryStatus && !cloudinaryStatus.configured && (
          <span className="text-[10px] bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full">Cloudinary non configure</span>
        )}
      </div>

      {/* Preview video actuelle */}
      {currentUrl && (
        <div className="p-3 rounded-xl bg-night-light border border-night-border">
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-lg">🎬</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-400 font-semibold">Video actuelle</p>
              <p className="text-[11px] text-gray-500 truncate">{currentUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* Zone d'upload ou URL manuelle */}
      <div className="grid grid-cols-1 gap-3">
        {/* Upload Cloudinary */}
        {cloudinaryStatus?.configured && (
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
              ${uploading ? 'border-gold/50 bg-gold/5' : 'border-night-border hover:border-gold/30 hover:bg-gold/5'}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
                  <svg className="animate-spin w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
                <p className="text-sm text-gold font-semibold">Upload en cours... {progress}%</p>
                <div className="w-full bg-night-border rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-gold to-gold-dark h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-gray-500">Ne fermez pas cette page</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center text-2xl">📤</div>
                <p className="text-sm font-semibold text-gray-300">Cliquez pour uploader une video</p>
                <p className="text-[11px] text-gray-500">MP4, WebM, MOV — Max 500 MB</p>
                <p className="text-[11px] text-gray-600">Upload vers Cloudinary ({cloudinaryStatus.cloudName})</p>
              </div>
            )}
          </div>
        )}

        {/* Separateur */}
        {cloudinaryStatus?.configured && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-night-border"></div>
            <span className="text-[11px] text-gray-500">ou collez une URL</span>
            <div className="flex-1 h-px bg-night-border"></div>
          </div>
        )}

        {/* URL manuelle (YouTube, Vimeo, etc.) */}
        <input
          value={currentUrl || ''}
          onChange={(e) => onUpload(e.target.value)}
          placeholder="URL video (YouTube, Vimeo, Cloudinary, MP4...)"
          className={inputClass}
        />

        {!cloudinaryStatus?.configured && (
          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <p className="text-xs text-orange-400 font-semibold mb-1">Cloudinary non configure</p>
            <p className="text-[11px] text-gray-500">
              Pour activer l'upload video, ajoutez dans .env :<br/>
              <code className="text-orange-400">CLOUDINARY_CLOUD_NAME=votre_nom</code><br/>
              <code className="text-orange-400">CLOUDINARY_API_KEY=votre_cle</code><br/>
              <code className="text-orange-400">CLOUDINARY_API_SECRET=votre_secret</code><br/>
              En attendant, collez directement une URL YouTube ou Vimeo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// Page Editeur de Cours
// =============================================
export default function AdminCourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Fondamentaux', level: 'debutant',
    emoji: '📈', duration: '', instructor: '', isFree: false, published: false,
  });

  const [lessons, setLessons] = useState([]);
  const [newLesson, setNewLesson] = useState({ title: '', duration: '', videoUrl: '', isFree: false });
  const [editingLesson, setEditingLesson] = useState(null);

  useEffect(() => { if (isEditing) loadCourse(); }, [id]);

  const loadCourse = async () => {
    try {
      const res = await api.get('/api/admin/courses');
      const course = res.data.find(c => c._id === id);
      if (course) {
        setForm({
          title: course.title || '', description: course.description || '',
          category: course.category || 'Fondamentaux', level: course.level || 'debutant',
          emoji: course.emoji || '📈', duration: course.duration || '',
          instructor: course.instructor || '', isFree: course.isFree || false,
          published: course.published || false,
        });
        setLessons(course.lessons || []);
      }
    } catch (err) {
      toast.error('Cours introuvable');
      navigate('/admin/courses');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSave = async () => {
    if (!form.title || !form.description) return toast.error('Titre et description requis');
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/api/admin/courses/${id}`, form);
        toast.success('Cours mis a jour !');
      } else {
        const res = await api.post('/api/admin/courses', { ...form, lessons: [] });
        toast.success('Cours cree !');
        navigate(`/admin/courses/${res.data._id}/edit`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const addLesson = async () => {
    if (!newLesson.title) return toast.error('Titre de la lecon requis');
    if (!isEditing) return toast.error('Sauvegardez le cours d\'abord');
    try {
      const res = await api.post(`/api/admin/courses/${id}/lessons`, newLesson);
      setLessons(res.data.lessons);
      setNewLesson({ title: '', duration: '', videoUrl: '', isFree: false });
      toast.success('Lecon ajoutee !');
    } catch (err) { toast.error('Erreur'); }
  };

  const updateLesson = async (lessonId, updates) => {
    try {
      const res = await api.put(`/api/admin/courses/${id}/lessons/${lessonId}`, updates);
      setLessons(res.data.lessons);
      setEditingLesson(null);
      toast.success('Lecon mise a jour !');
    } catch (err) { toast.error('Erreur'); }
  };

  const deleteLesson = async (lessonId) => {
    if (!confirm('Supprimer cette lecon ?')) return;
    try {
      const res = await api.delete(`/api/admin/courses/${id}/lessons/${lessonId}`);
      setLessons(res.data.lessons);
      toast.success('Lecon supprimee');
    } catch (err) { toast.error('Erreur'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin/courses')} className="text-sm text-gray-500 hover:text-gold transition-colors mb-2 inline-block">
            ← Retour aux cours
          </button>
          <h1 className="font-serif text-3xl">{isEditing ? 'Modifier le Cours' : 'Nouveau Cours'}</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-gold text-sm disabled:opacity-50">
          {saving ? 'Sauvegarde...' : isEditing ? 'Sauvegarder' : 'Creer le Cours'}
        </button>
      </div>

      {/* Course Form */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-lg border-b border-night-border pb-3">Informations du Cours</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre du cours *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Ex: Introduction a la BRVM" className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Decrivez le contenu du cours..." className={inputClass} style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Categorie</label>
            <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Niveau</label>
            <select name="level" value={form.level} onChange={handleChange} className={inputClass}>
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Instructeur</label>
            <input name="instructor" value={form.instructor} onChange={handleChange} placeholder="Nom de l'instructeur" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Duree totale</label>
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="Ex: 2h 45min" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm({ ...form, emoji: e })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    form.emoji === e ? 'bg-gold/20 border-2 border-gold' : 'bg-night-light border border-night-border hover:border-gray-500'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} className="w-4 h-4 accent-gold" />
              <span className="text-sm text-gray-300">Cours gratuit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="published" checked={form.published} onChange={handleChange} className="w-4 h-4 accent-green-500" />
              <span className="text-sm text-gray-300">Publie</span>
            </label>
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      {isEditing && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-night-border pb-3">
            <h2 className="font-semibold text-lg">Lecons ({lessons.length})</h2>
          </div>

          {/* Existing Lessons */}
          {lessons.length > 0 && (
            <div className="space-y-2">
              {lessons.map((lesson, i) => (
                <div key={lesson._id} className="rounded-xl bg-night-light border border-night-border">
                  <div className="flex items-center gap-3 p-3">
                    <span className="text-sm font-mono text-gray-500 w-8">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{lesson.title}</p>
                      <div className="flex gap-3 text-[11px] text-gray-500 mt-0.5">
                        {lesson.duration && <span>⏱ {lesson.duration}</span>}
                        {lesson.isFree && <span className="text-green-400">Gratuit</span>}
                        {lesson.videoUrl ? <span className="text-blue-400">🎬 Video ✓</span> : <span className="text-orange-400">Pas de video</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingLesson(editingLesson === lesson._id ? null : lesson._id)}
                        className="text-xs px-2 py-1 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-all">
                        {editingLesson === lesson._id ? 'Fermer' : 'Video'}
                      </button>
                      <button onClick={() => deleteLesson(lesson._id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Expandable video editor */}
                  {editingLesson === lesson._id && (
                    <div className="border-t border-night-border p-4">
                      <VideoUploader
                        currentUrl={lesson.videoUrl}
                        onUpload={(url) => updateLesson(lesson._id, { videoUrl: url })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Lesson Form */}
          <div className="border-t border-night-border pt-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Ajouter une lecon</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Titre de la lecon *" className={inputClass} />
              <input value={newLesson.duration} onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                placeholder="Duree (ex: 12:30)" className={inputClass} />
              
              <div className="md:col-span-2">
                <VideoUploader
                  currentUrl={newLesson.videoUrl}
                  onUpload={(url) => setNewLesson({ ...newLesson, videoUrl: url })}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newLesson.isFree} onChange={(e) => setNewLesson({ ...newLesson, isFree: e.target.checked })}
                  className="w-4 h-4 accent-gold" />
                <span className="text-sm text-gray-300">Lecon gratuite (apercu)</span>
              </label>
            </div>
            <button onClick={addLesson} className="btn-gold text-sm mt-4">+ Ajouter la Lecon</button>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="card p-6 text-center text-gray-500">
          <p className="text-sm">Sauvegardez le cours d'abord, puis vous pourrez ajouter des lecons avec des videos.</p>
        </div>
      )}
    </div>
  );
}
