import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  symbol: { type: String, required: true },  // Ex: SGBCI, SOLIBRA, ONTBF
  companyName: { type: String, default: '' },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Prix unitaire en FCFA
  total: { type: Number, required: true }, // quantity * price
  fees: { type: Number, default: 0 },
  executedAt: { type: Date, default: Date.now },
});

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  companyName: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
  avgBuyPrice: { type: Number, default: 0 },
  currentPrice: { type: Number, default: 0 },
  sector: { type: String, default: '' },
});

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 10000000 }, // 10M FCFA de depart
  initialBalance: { type: Number, default: 10000000 },
  holdings: [holdingSchema],
  transactions: [transactionSchema],
  totalInvested: { type: Number, default: 0 },
  totalValue: { type: Number, default: 10000000 },
  profitLoss: { type: Number, default: 0 },
  profitLossPercent: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('VirtualPortfolio', portfolioSchema);
