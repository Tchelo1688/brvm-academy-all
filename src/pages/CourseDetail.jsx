import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { HiOutlinePlayCircle, HiOutlineCheckCircle, HiOutlineLockClosed } from 'react-icons/hi2';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_COURSES } from '../utils/sampleData';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(0);

  useEffect(() => { loadCourse(); }, [id]);

  const loadCourse = async () => {
    try {
      // Essayer de charger depuis l'API
      const res = await api.get(`/api/courses/${id}`);
      setCourse(res.data);
    } catch (err) {
      // Fallback : chercher dans les donnees locales
      const local = SAMPLE_COURSES.find(c => c.id === id || c._id === id);
      setCourse(local || null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement du cours...</div>;

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">😕</p>
        <h2 className="font-serif text-2xl mb-2">Cours introuvable</h2>
        <Link to="/courses" className="text-gold hover:underline">← Retour aux cours</Link>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const currentLesson = lessons[activeLesson];
  const completedCount = user?.progress?.[course._id || course.id] || 0;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // Verifier l'acces selon le plan
  const canAccessCourse = () => {
    if (course.isFree) return true;
    if (!user) return false;
    if (['admin', 'moderator', 'instructor'].includes(user.role)) return true;
    if (['premium', 'pro'].includes(user.plan)) return true;
    return false;
  };

  const canAccessLesson = (lesson) => {
    if (lesson?.isFree) return true;
    return canAccessCourse();
  };

  const hasAccess = canAccessLesson(currentLesson);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/courses" className="hover:text-gold transition-colors">Cours</Link>
        <span>/</span>
        <span className="text-gray-300">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* VIDEO PLAYER */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="aspect-video bg-black relative flex items-center justify-center">
              {!hasAccess ? (
                <div className="text-center p-8">
                  <p className="text-5xl mb-4">🔒</p>
                  <h3 className="font-serif text-xl text-white mb-2">Contenu Premium</h3>
                  <p className="text-gray-400 text-sm mb-4">Passez au plan Premium ou Pro pour acceder a ce cours</p>
                  <Link to="/pricing" className="inline-block bg-gradient-to-r from-gold to-gold-dark text-night-DEFAULT text-sm font-bold px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-gold/20 transition-all">
                    Voir les plans
                  </Link>
                </div>
              ) : currentLesson?.videoUrl ? (
                <ReactPlayer
                  url={currentLesson.videoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  config={{
                    youtube: { playerVars: { modestbranding: 1, rel: 0 } },
                  }}
                />
              ) : (
                <div className="text-center">
                  <p className="text-6xl mb-4">{course.emoji || '📚'}</p>
                  <p className="text-gray-400 text-sm">Aucune video pour cette lecon</p>
                  <p className="text-gray-600 text-xs mt-2">L'administrateur peut ajouter une video depuis le panel admin</p>
                </div>
              )}
            </div>

            {/* Lesson Info */}
            <div className="p-6">
              <p className="text-[11px] text-gold font-semibold uppercase tracking-wider mb-1">{course.category}</p>
              <h1 className="font-serif text-2xl mb-2">
                {currentLesson?.title || course.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>🎓 {course.instructor}</span>
                <span>⏱️ {currentLesson?.duration || course.duration}</span>
                {course.rating && <span>⭐ {course.rating}</span>}
              </div>
              <p className="text-gray-400 leading-relaxed">{course.description}</p>
            </div>
          </div>

          {/* Description Tab */}
          <div className="card p-6">
            <h3 className="font-semibold text-sm border-b border-night-border pb-3 mb-4">A propos de ce cours</h3>
            <div className="text-sm text-gray-400 leading-relaxed space-y-3">
              <p>{course.description}</p>
              <p className="text-gold font-medium mt-4">
                {course.quizQuestions?.length > 0
                  ? `Ce cours contient un quiz de ${course.quizQuestions.length} questions. Obtenez 70% pour recevoir votre certificat !`
                  : 'Completez toutes les lecons pour progresser.'}
              </p>
            </div>
          </div>
        </div>

        {/* LESSON LIST (SIDEBAR) */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-serif text-lg mb-1">Progression</h3>
            <p className="text-sm text-gray-500 mb-3">{completedCount}/{lessons.length} lecons completees</p>
            <div className="w-full h-2 bg-night-border rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-right text-xs text-gray-500">{progressPct}%</p>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-night-border">
              <h3 className="font-semibold text-sm">Contenu du Cours</h3>
              <p className="text-xs text-gray-500 mt-0.5">{lessons.length} lecons • {course.duration}</p>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {lessons.length > 0 ? (
                lessons.map((lesson, i) => {
                  const isCompleted = i < completedCount;
                  const isActive = i === activeLesson;
                  const hasVideo = !!lesson.videoUrl;
                  const lessonLocked = !canAccessLesson(lesson);

                  return (
                    <button
                      key={lesson._id || i}
                      onClick={() => !lessonLocked && setActiveLesson(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-night-border/50 last:border-0
                        ${lessonLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                        ${isActive ? 'bg-gold/10' : 'hover:bg-white/[0.02]'}`}
                    >
                      <div className="flex-shrink-0">
                        {lessonLocked ? (
                          <HiOutlineLockClosed className="w-5 h-5 text-orange-400" />
                        ) : isCompleted ? (
                          <HiOutlineCheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <HiOutlinePlayCircle className={`w-5 h-5 ${isActive ? 'text-gold' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'text-gold font-semibold' : isCompleted ? 'text-gray-300' : 'text-gray-400'}`}>
                          {lesson.title}
                        </p>
                        <div className="flex gap-2 text-[11px] text-gray-600">
                          {lesson.duration && <span className="font-mono">{lesson.duration}</span>}
                          {hasVideo && <span className="text-blue-400">🎬</span>}
                          {!hasVideo && <span className="text-gray-600">Pas de video</span>}
                          {lesson.isFree && <span className="text-green-400">Gratuit</span>}
                          {lessonLocked && <span className="text-orange-400">Premium</span>}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <p>Les lecons seront bientot disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Quiz CTA */}
          {course.quizQuestions?.length > 0 && (
            <Link
              to={`/quiz/${course._id || course.id}`}
              className="btn-gold w-full flex items-center justify-center gap-2 text-sm"
            >
              📝 Passer le Quiz ({course.quizQuestions.length} questions)
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
