import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Utilisateur
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, default: '' },

  // Plan achete
  plan: { type: String, enum: ['premium', 'pro'], required: true },
  planDuration: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },

  // Montant
  amount: { type: Number, required: true }, // en FCFA
  currency: { type: String, default: 'XOF' },

  // CinetPay
  transactionId: { type: String, unique: true, required: true },
  paymentToken: { type: String, default: '' },
  paymentUrl: { type: String, default: '' },
  paymentMethod: { type: String, default: '' }, // MOBILE_MONEY, CREDIT_CARD, WAVE

  // Statut
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },

  // Dates
  paidAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null }, // Fin de l'abonnement

  // Metadata CinetPay
  cinetpayData: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Infos client
  ip: { type: String, default: '' },
  country: { type: String, default: '' },

}, { timestamps: true });

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
