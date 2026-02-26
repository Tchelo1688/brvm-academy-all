import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CourseCard from '../components/CourseCard/CourseCard';
import { SAMPLE_COURSES } from '../utils/sampleData';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Apprenant';

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="relative bg-gradient-to-br from-emerald-deep via-night-DEFAULT to-night-light rounded-2xl p-8 lg:p-10 border border-night-border overflow-hidden">
        <div className="absolute -top-20 -right-10 w-80 h-80 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 w-60 h-60 bg-emerald/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-gold/15 border border-gold/30 text-gold text-[11px] font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            🌍 Nouveau parcours disponible
          </span>
          <h1 className="font-serif text-3xl lg:text-4xl mb-3 max-w-xl">
            Bienvenue, <em className="text-gold">{firstName}</em>
          </h1>
          <p className="text-gray-400 text-base max-w-lg mb-6 leading-relaxed">
            Continuez votre apprentissage du trading sur la BRVM. Vous avez complété 18 leçons cette semaine !
          </p>
          <div className="flex gap-3">
            <Link to="/courses" className="btn-gold text-sm">Continuer l'Apprentissage</Link>
            <Link to="/market" className="btn-outline text-sm">Voir le Marché</Link>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: '📚', value: '18', label: 'Cours Complétés', change: '+3', color: 'gold' },
          { icon: '⏱️', value: '42h', label: "Temps d'Apprentissage", change: '+4.2h', color: 'green' },
          { icon: '🏆', value: '4,250', label: 'Points XP', change: '+850', color: 'blue' },
          { icon: '📈', value: '+18.3%', label: 'Rendement Virtuel', change: '+12.5%', color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-green-500/10 text-green-400">
                {stat.change}
              </span>
            </div>
            <p className="font-serif text-2xl">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* POPULAR COURSES */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Cours Populaires</h2>
          <Link to="/courses" className="text-sm text-gold font-semibold hover:opacity-80 transition-opacity">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {SAMPLE_COURSES.slice(0, 3).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* CONTINUE LEARNING */}
      <div>
        <h2 className="section-title mb-5">Continuer l'Apprentissage</h2>
        <div className="card divide-y divide-night-border">
          {[
            { cat: 'Analyse Technique', title: 'Leçon 6 : Les Moyennes Mobiles', progress: 40, emoji: '📈' },
            { cat: 'Fondamentaux', title: 'Leçon 10 : Comprendre le PER', progress: 65, emoji: '💰' },
            { cat: 'Pratique', title: 'Leçon 3 : Ordre à cours limité', progress: 20, emoji: '🔍' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 hover:bg-white/[0.02] cursor-pointer transition-colors">
              <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-emerald-deep to-night-light flex items-center justify-center text-2xl flex-shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-gold font-semibold uppercase tracking-wide">{item.cat}</p>
                <p className="text-sm font-semibold mt-0.5 mb-2">{item.title}</p>
                <div className="w-full h-1 bg-night-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
