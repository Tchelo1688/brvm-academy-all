import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseTitle: { type: String, required: true },
  courseCategory: { type: String, default: '' },
  courseLevel: { type: String, default: '' },
  instructor: { type: String, default: '' },
  quizScore: { type: Number, default: 0 }, // pourcentage
  certificateNumber: { type: String, unique: true, required: true },
  earnedAt: { type: Date, default: Date.now },
}, { timestamps: true });

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
