import mongoose from 'mongoose';
import crypto from 'crypto';

const affiliationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code: { type: String, unique: true, required: true },
  referrals: [{
    referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    registeredAt: { type: Date, default: Date.now },
    hasPaid: { type: Boolean, default: false },
    commission: { type: Number, default: 0 },
  }],
  totalEarnings: { type: Number, default: 0 },
  pendingEarnings: { type: Number, default: 0 },
  paidEarnings: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 20 }, // 20%
}, { timestamps: true });

affiliationSchema.index({ code: 1 });

// Generer un code unique
affiliationSchema.statics.generateCode = function(userName) {
  const base = userName.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${base}-${rand}`;
};

export default mongoose.model('Affiliation', affiliationSchema);
