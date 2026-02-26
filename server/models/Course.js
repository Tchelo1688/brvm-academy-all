import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  order: { type: Number, required: true },
  isFree: { type: Boolean, default: false }, // Première leçon gratuite
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, enum: ['debutant', 'intermediaire', 'avance'], required: true },
  emoji: { type: String, default: '📚' },
  thumbClass: { type: String, default: '' },
  duration: { type: String, default: '' },
  instructor: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  studentCount: { type: Number, default: 0 },
  lessons: [lessonSchema],
  quizQuestions: [{
    question: String,
    options: [String],
    correct: Number,
  }],
  published: { type: Boolean, default: false },
  isFree: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
