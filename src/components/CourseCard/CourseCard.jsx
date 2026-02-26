import { Link } from 'react-router-dom';
import { HiOutlinePlayCircle } from 'react-icons/hi2';

const levelStyles = {
  debutant: 'bg-green-500/80 text-white',
  intermediaire: 'bg-orange-500/80 text-white',
  avance: 'bg-red-500/80 text-white',
};

const levelLabels = {
  debutant: 'Debutant',
  intermediaire: 'Intermediaire',
  avance: 'Avance',
};

export default function CourseCard({ course }) {
  const courseId = course._id || course.id;
  const videoCount = course.lessons?.length || course.videoCount || 0;

  return (
    <Link to={`/courses/${courseId}`} className="card group overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl">
      {/* Thumbnail */}
      <div className="relative w-full h-44 overflow-hidden">
        <div className={`w-full h-full flex items-center justify-center text-5xl ${course.thumbClass || 'bg-gradient-to-br from-emerald-deep to-night-DEFAULT'}`}>
          {course.emoji || '📚'}
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-gold/90 rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
            <HiOutlinePlayCircle className="w-6 h-6 text-night-DEFAULT" />
          </div>
        </div>

        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded font-mono">
          {course.duration}
        </span>

        <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-md ${levelStyles[course.level] || ''}`}>
          {levelLabels[course.level] || course.level}
        </span>

        {course.isFree && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-md">
            GRATUIT
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <p className="text-[11px] text-gold font-semibold uppercase tracking-wider mb-1.5">{course.category}</p>
        <h3 className="text-[15px] font-bold leading-snug mb-2">{course.title}</h3>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-4 line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-night-border text-[12px] text-gray-500">
          <div className="flex items-center gap-3">
            <span>📹 {videoCount} lecons</span>
            <span>⭐ {course.rating || '-'}</span>
          </div>
          <span>👥 {course.studentCount || course.students || 0}</span>
        </div>
      </div>
    </Link>
  );
}
