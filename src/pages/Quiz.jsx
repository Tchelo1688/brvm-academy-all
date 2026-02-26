import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Quiz() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => { if (courseId) loadCourse(); else loadCertificates(); }, [courseId]);

  const loadCourse = async () => { try { const r = await api.get(`/api/courses/${courseId}`); setCourse(r.data); } catch {} setLoading(false); };
  const loadCertificates = async () => { try { const r = await api.get('/api/quiz/certificates'); setCertificates(r.data); } catch {} setLoading(false); };

  const selectAnswer = (qi, option) => { setAnswers([...answers.filter(a => a.questionIndex !== qi), { questionIndex: qi, selectedOption: option }]); };

  const submitQuiz = async () => {
    if (answers.length < course.quizQuestions.length) return toast.error('Repondez a toutes les questions');
    try { const r = await api.post(`/api/quiz/${courseId}/submit`, { answers }); setResult(r.data); setSubmitted(true); }
    catch (e) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  if (loading) return <div className="text-center py-20 text-gold">Chargement...</div>;

  if (!courseId) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-serif text-3xl">Mes Certificats</h1>
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map(c => (
            <div key={c._id} className="card p-5 border border-gold/20 text-center">
              <p className="text-3xl mb-1">🏆</p>
              <h3 className="font-serif text-lg">{c.courseTitle}</h3>
              <p className="text-xs text-gray-500 mb-2">{c.courseCategory} • Score: {c.quizScore}%</p>
              <p className="text-[11px] font-mono text-gold">{c.certificateNumber}</p>
              <p className="text-[11px] text-gray-500">{new Date(c.earnedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-500">
          <p className="text-4xl mb-2">🏆</p><p className="text-sm">Aucun certificat. Terminez un quiz avec 70% pour en obtenir !</p>
          <Link to="/courses" className="text-gold text-sm mt-2 inline-block">Voir les cours →</Link>
        </div>
      )}
    </div>
  );

  if (!course?.quizQuestions?.length) return (
    <div className="max-w-2xl mx-auto text-center py-20 card p-8">
      <p className="text-4xl mb-3">📝</p><h2 className="font-serif text-xl mb-2">Pas de quiz disponible</h2>
      <Link to="/courses" className="text-gold text-sm">← Retour aux cours</Link>
    </div>
  );

  if (submitted && result) return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`card p-8 text-center border-2 ${result.passed ? 'border-green-500/30' : 'border-red-500/30'}`}>
        <p className="text-5xl mb-3">{result.passed ? '🎉' : '😔'}</p>
        <h2 className="font-serif text-2xl mb-2">{result.passed ? 'Felicitations !' : 'Pas encore...'}</h2>
        <p className="text-4xl font-bold mb-1" style={{ color: result.passed ? '#22c55e' : '#ef4444' }}>{result.score}%</p>
        <p className="text-gray-500 text-sm">{result.correct}/{result.total} bonnes reponses • +{result.xpEarned} XP</p>
        {result.certificate && (
          <div className="mt-4 p-3 rounded-xl bg-gold/10 border border-gold/20">
            <p className="text-gold font-semibold text-sm">🏆 Certificat obtenu !</p>
            <p className="text-xs text-gray-400 font-mono">{result.certificate.certificateNumber}</p>
          </div>
        )}
        {!result.passed && <p className="text-xs text-gray-500 mt-3">Il faut 70% minimum. Reessayez !</p>}
      </div>
      <div className="card p-6 space-y-3">
        <h3 className="font-semibold text-sm">Detail</h3>
        {result.results.map((r, i) => (
          <div key={i} className={`p-3 rounded-xl border ${r.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <p className="text-sm font-semibold">{r.isCorrect ? '✅' : '❌'} {r.question}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setSubmitted(false); setAnswers([]); setCurrentQ(0); setResult(null); }} className="btn-gold text-sm">Reessayer</button>
        <Link to="/courses" className="btn-outline text-sm">Retour</Link>
      </div>
    </div>
  );

  const q = course.quizQuestions[currentQ];
  const sel = answers.find(a => a.questionIndex === currentQ)?.selectedOption;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to={`/courses/${courseId}`} className="text-sm text-gray-500 hover:text-gold">← {course.title}</Link>
        <span className="text-sm text-gray-500">{answers.length}/{course.quizQuestions.length}</span>
      </div>
      <div className="w-full h-2 bg-night-border rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${((currentQ + 1) / course.quizQuestions.length) * 100}%` }} />
      </div>
      <div className="card p-6">
        <p className="text-xs text-gold font-semibold mb-2">Question {currentQ + 1} / {course.quizQuestions.length}</p>
        <h2 className="font-serif text-xl mb-5">{q.question}</h2>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => selectAnswer(currentQ, i)}
              className={`w-full text-left p-4 rounded-xl text-sm transition-all border ${sel === i ? 'bg-gold/15 border-gold text-gold font-semibold' : 'bg-night-light border-night-border text-gray-300 hover:border-gray-500'}`}>
              <span className="mr-3 font-mono text-xs">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="btn-outline text-sm disabled:opacity-30">← Precedent</button>
        {currentQ < course.quizQuestions.length - 1
          ? <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-gold text-sm">Suivant →</button>
          : <button onClick={submitQuiz} className="bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-6 py-2.5 rounded-xl">✅ Terminer</button>}
      </div>
    </div>
  );
}
