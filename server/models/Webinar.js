import mongoose from 'mongoose';

const webinarSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructor: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: String, default: '1h' },
  meetingUrl: { type: String, default: '' }, // Zoom, Google Meet, etc.
  status: { type: String, enum: ['upcoming', 'live', 'ended', 'cancelled'], default: 'upcoming' },
  category: { type: String, default: 'general' },
  maxParticipants: { type: Number, default: 100 },
  registrations: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    registeredAt: { type: Date, default: Date.now },
  }],
  messages: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    content: String,
    createdAt: { type: Date, default: Date.now },
  }],
  accessLevel: { type: String, enum: ['gratuit', 'premium', 'pro'], default: 'gratuit' },
  replayUrl: { type: String, default: '' },
  published: { type: Boolean, default: true },
}, { timestamps: true });

webinarSchema.index({ scheduledAt: 1, status: 1 });

export default mongoose.model('Webinar', webinarSchema);
