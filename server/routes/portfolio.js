import { Router } from 'express';
import VirtualPortfolio from '../models/VirtualPortfolio.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Donnees BRVM simulees (sera remplace par API reel)
const BRVM_STOCKS = [
  { symbol: 'SGBCI', name: 'Societe Generale CI', price: 15200, change: 2.3, sector: 'Finance', country: 'CI' },
  { symbol: 'SOLIBRA', name: 'Solibra', price: 165000, change: -0.5, sector: 'Industrie', country: 'CI' },
  { symbol: 'ONTBF', name: 'Onatel BF', price: 3800, change: 1.1, sector: 'Telecom', country: 'BF' },
  { symbol: 'SONATEL', name: 'Sonatel SN', price: 22500, change: 0.8, sector: 'Telecom', country: 'SN' },
  { symbol: 'BNDA', name: 'BNDA Mali', price: 1250, change: -1.2, sector: 'Finance', country: 'ML' },
  { symbol: 'SOGB', name: 'SOGB CI', price: 4500, change: 3.1, sector: 'Agriculture', country: 'CI' },
  { symbol: 'PALMCI', name: 'Palm CI', price: 7800, change: -0.3, sector: 'Agriculture', country: 'CI' },
  { symbol: 'SIFCA', name: 'SIFCA', price: 4200, change: 0.5, sector: 'Agriculture', country: 'CI' },
  { symbol: 'TOTALCI', name: 'TotalEnergies CI', price: 2850, change: 1.7, sector: 'Energie', country: 'CI' },
  { symbol: 'BICI', name: 'BICI CI', price: 8900, change: -0.8, sector: 'Finance', country: 'CI' },
  { symbol: 'CORIS', name: 'Coris Bank', price: 9500, change: 2.0, sector: 'Finance', country: 'BF' },
  { symbol: 'ECOBANK', name: 'Ecobank CI', price: 5400, change: 0.2, sector: 'Finance', country: 'CI' },
  { symbol: 'BOABF', name: 'BOA Burkina', price: 5100, change: -1.5, sector: 'Finance', country: 'BF' },
  { symbol: 'BOACI', name: 'BOA Cote d\'Ivoire', price: 5800, change: 0.9, sector: 'Finance', country: 'CI' },
  { symbol: 'SAFCA', name: 'SAFCA', price: 780, change: 1.3, sector: 'Finance', country: 'CI' },
  { symbol: 'CIE', name: 'CIE', price: 2100, change: -0.6, sector: 'Services publics', country: 'CI' },
  { symbol: 'SODECI', name: 'SODECI', price: 4300, change: 0.4, sector: 'Services publics', country: 'CI' },
  { symbol: 'FILTISAC', name: 'Filtisac', price: 1500, change: 2.5, sector: 'Industrie', country: 'CI' },
  { symbol: 'NESTLE', name: 'Nestle CI', price: 6800, change: -0.1, sector: 'Consommation', country: 'CI' },
  { symbol: 'UNILEVER', name: 'Unilever CI', price: 5200, change: 0.7, sector: 'Consommation', country: 'CI' },
];

// Ajouter une variation aleatoire realiste au prix
function getMarketPrice(stock) {
  const variation = (Math.random() - 0.5) * 0.02; // +-1%
  return Math.round(stock.price * (1 + variation));
}

// GET /api/portfolio/stocks — Donnees marche BRVM
router.get('/stocks', (req, res) => {
  const stocks = BRVM_STOCKS.map(s => ({
    ...s,
    price: getMarketPrice(s),
    change: +(s.change + (Math.random() - 0.5) * 2).toFixed(2),
  }));
  res.json(stocks);
});

// GET /api/portfolio — Mon portefeuille
router.get('/', protect, async (req, res) => {
  try {
    let portfolio = await VirtualPortfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = await VirtualPortfolio.create({ userId: req.user._id });
    }

    // Mettre a jour les prix actuels des holdings
    for (const holding of portfolio.holdings) {
      const stock = BRVM_STOCKS.find(s => s.symbol === holding.symbol);
      if (stock) holding.currentPrice = getMarketPrice(stock);
    }

    // Calculer la valeur totale
    const holdingsValue = portfolio.holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);
    portfolio.totalValue = portfolio.balance + holdingsValue;
    portfolio.profitLoss = portfolio.totalValue - portfolio.initialBalance;
    portfolio.profitLossPercent = +((portfolio.profitLoss / portfolio.initialBalance) * 100).toFixed(2);
    await portfolio.save();

    res.json(portfolio);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/portfolio/buy — Acheter une action
router.post('/buy', protect, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) return res.status(400).json({ message: 'Symbole et quantite requis' });

    const stock = BRVM_STOCKS.find(s => s.symbol === symbol);
    if (!stock) return res.status(404).json({ message: 'Action introuvable' });

    const price = getMarketPrice(stock);
    const fees = Math.round(price * quantity * 0.005); // 0.5% frais
    const total = price * quantity + fees;

    let portfolio = await VirtualPortfolio.findOne({ userId: req.user._id });
    if (!portfolio) portfolio = await VirtualPortfolio.create({ userId: req.user._id });

    if (portfolio.balance < total) return res.status(400).json({ message: `Solde insuffisant. Besoin: ${total.toLocaleString()} FCFA, Solde: ${portfolio.balance.toLocaleString()} FCFA` });

    // Deduire du solde
    portfolio.balance -= total;
    portfolio.totalInvested += price * quantity;

    // Ajouter ou mettre a jour le holding
    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    if (holding) {
      const newTotal = holding.quantity * holding.avgBuyPrice + quantity * price;
      holding.quantity += quantity;
      holding.avgBuyPrice = Math.round(newTotal / holding.quantity);
      holding.currentPrice = price;
    } else {
      portfolio.holdings.push({ symbol, companyName: stock.name, quantity, avgBuyPrice: price, currentPrice: price, sector: stock.sector });
    }

    portfolio.transactions.push({ symbol, companyName: stock.name, type: 'buy', quantity, price, total: price * quantity, fees });
    await portfolio.save();

    res.json({ message: `Achat de ${quantity} ${symbol} a ${price.toLocaleString()} FCFA`, portfolio });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/portfolio/sell — Vendre
router.post('/sell', protect, async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity <= 0) return res.status(400).json({ message: 'Symbole et quantite requis' });

    const stock = BRVM_STOCKS.find(s => s.symbol === symbol);
    if (!stock) return res.status(404).json({ message: 'Action introuvable' });

    let portfolio = await VirtualPortfolio.findOne({ userId: req.user._id });
    if (!portfolio) return res.status(400).json({ message: 'Portefeuille vide' });

    const holding = portfolio.holdings.find(h => h.symbol === symbol);
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ message: `Vous ne possedez que ${holding?.quantity || 0} ${symbol}` });
    }

    const price = getMarketPrice(stock);
    const fees = Math.round(price * quantity * 0.005);
    const total = price * quantity - fees;

    portfolio.balance += total;
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
    }

    portfolio.transactions.push({ symbol, companyName: stock.name, type: 'sell', quantity, price, total: price * quantity, fees });
    await portfolio.save();

    res.json({ message: `Vente de ${quantity} ${symbol} a ${price.toLocaleString()} FCFA`, portfolio });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/portfolio/reset — Reinitialiser
router.post('/reset', protect, async (req, res) => {
  try {
    await VirtualPortfolio.findOneAndDelete({ userId: req.user._id });
    const portfolio = await VirtualPortfolio.create({ userId: req.user._id });
    res.json({ message: 'Portefeuille reinitialise avec 10 000 000 FCFA', portfolio });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
