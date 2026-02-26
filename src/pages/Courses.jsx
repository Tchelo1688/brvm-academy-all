import { useState, useEffect } from 'react';
import CourseCard from '../components/CourseCard/CourseCard';
import api from '../api/axios';
import { SAMPLE_COURSES } from '../utils/sampleData';

const FILTERS = ['Tous', 'Debutant', 'Intermediaire', 'Avance'];
const CATEGORIES = ['Tous', 'Fondamentaux', 'Analyse Technique', 'Strategies', 'Obligations', 'Analyse Fondamentale', 'Pratique'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('Tous');
  const [catFilter, setCatFilter] = useState('Tous');

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      // Charger depuis l'API (MongoDB)
      const res = await api.get('/api/courses');
      if (res.data && res.data.length > 0) {
        setCourses(res.data);
      } else {
        // Fallback vers les donnees locales
        setCourses(SAMPLE_COURSES);
      }
    } catch (err) {
      // Si le backend ne repond pas, utiliser les donnees locales
      console.log('API indisponible, utilisation des donnees locales');
      setCourses(SAMPLE_COURSES);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter((c) => {
    const levelMap = { 'Debutant': 'debutant', 'Intermediaire': 'intermediaire', 'Avance': 'avance' };
    if (levelFilter !== 'Tous' && c.level !== levelMap[levelFilter]) return false;
    if (catFilter !== 'Tous' && c.category !== catFilter) return false;
    // Ne montrer que les cours publies (ou tous si pas de champ published)
    if (c.published === false) return false;
    return true;
  });

  if (loading) return <div className="text-center py-20 text-gold">Chargement des cours...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-2">Cours Video</h1>
        <p className="text-gray-500">Apprenez le trading BRVM a votre rythme avec nos cours en video</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Niveau</p>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setLevelFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  levelFilter === f ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-night-card border border-night-border text-gray-400 hover:text-white'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Categorie</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  catFilter === c ? 'bg-gold/15 text-gold border border-gold/30' : 'bg-night-card border border-night-border text-gray-400 hover:text-white'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} cours trouves</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((course) => (
          <CourseCard key={course._id || course.id} course={course} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg font-semibold">Aucun cours trouve</p>
          <p className="text-sm">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
}
