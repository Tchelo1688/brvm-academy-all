import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const levelLabels = { debutant: 'Debutant', intermediaire: 'Intermediaire', avance: 'Avance' };
const levelColors = { debutant: 'bg-green-500/15 text-green-400', intermediaire: 'bg-orange-500/15 text-orange-400', avance: 'bg-red-500/15 text-red-400' };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/api/admin/courses');
      setCourses(res.data);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id) => {
    try {
      const res = await api.put(`/api/admin/courses/${id}/publish`);
      setCourses(courses.map(c => c._id === id ? res.data : c));
      toast.success(res.data.published ? 'Cours publie !' : 'Cours depublie');
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const deleteCourse = async (id, title) => {
    if (!confirm(`Supprimer le cours "${title}" ? Cette action est irreversible.`)) return;
    try {
      await api.delete(`/api/admin/courses/${id}`);
      setCourses(courses.filter(c => c._id !== id));
      toast.success('Cours supprime');
    } catch (err) {
      toast.error('Erreur de suppression');
    }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Gestion des Cours</h1>
          <p className="text-gray-500 mt-1">{courses.length} cours au total</p>
        </div>
        <Link to="/admin/courses/new" className="btn-gold text-sm">+ Nouveau Cours</Link>
      </div>

      {/* Courses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-night-border">
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Cours</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Categorie</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Niveau</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Lecons</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Etudiants</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Statut</th>
                <th className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id} className="border-b border-night-border/30 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{course.emoji || '📚'}</span>
                      <div>
                        <p className="font-semibold text-sm">{course.title}</p>
                        <p className="text-xs text-gray-500">{course.instructor}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">{course.category}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-md ${levelColors[course.level] || ''}`}>
                      {levelLabels[course.level] || course.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-400">{course.lessons?.length || 0}</td>
                  <td className="px-5 py-4 text-sm font-mono text-gray-400">{course.studentCount || 0}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => togglePublish(course._id)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${
                        course.published
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-gray-500/15 text-gray-400 hover:bg-gray-500/25'
                      }`}
                    >
                      {course.published ? '✓ Publie' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/courses/${course._id}/edit`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-all"
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => deleteCourse(course._id, course.title)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {courses.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">📚</p>
            <p className="font-semibold">Aucun cours</p>
            <Link to="/admin/courses/new" className="text-gold text-sm hover:underline mt-2 inline-block">Creer votre premier cours</Link>
          </div>
        )}
      </div>
    </div>
  );
}
