import { Router } from 'express';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { audit, getClientIp } from '../middleware/audit.js';

const router = Router();

// =============================================
// CONFIGURATION PRIX MULTI-DEVISES
// =============================================
const PRICES = {
  premium: {
    monthly: { XOF: 5000, EUR: 8, CAD: 12, USD: 9 },
    yearly: { XOF: 45000, EUR: 72, CAD: 108, USD: 81 },
  },
  pro: {
    monthly: { XOF: 15000, EUR: 23, CAD: 35, USD: 26 },
    yearly: { XOF: 135000, EUR: 207, CAD: 315, USD: 234 },
  },
};

const CURRENCY_INFO = {
  XOF: { symbol: 'FCFA', name: 'Franc CFA', locale: 'fr-FR', position: 'after' },
  EUR: { symbol: '€', name: 'Euro', locale: 'fr-FR', position: 'after' },
  CAD: { symbol: '$CA', name: 'Dollar canadien', locale: 'fr-CA', position: 'before' },
  USD: { symbol: '$US', name: 'Dollar US', locale: 'en-US', position: 'before' },
};

const PLAN_DETAILS = {
  premium: { label: 'Premium', description: 'Acces a tous les cours + quiz' },
  pro: { label: 'Pro', description: 'Premium + mentorat + certificats' },
};

// =============================================
// GET /api/payments/plans — Plans avec prix dans toutes les devises
// =============================================
router.get('/plans', (req, res) => {
  res.json({
    prices: PRICES,
    currencies: CURRENCY_INFO,
    details: PLAN_DETAILS,
  });
});

// =============================================
// POST /api/payments/initialize — Creer un paiement CinetPay
// =============================================
router.post('/initialize', protect, async (req, res) => {
  try {
    const { plan, duration = 'monthly', currency = 'XOF' } = req.body;

    // Validation
    if (!PRICES[plan] || !PRICES[plan][duration]) {
      return res.status(400).json({ message: 'Plan invalide' });
    }
    if (!CURRENCY_INFO[currency]) {
      return res.status(400).json({ message: 'Devise invalide' });
    }

    const amount = PRICES[plan][duration][currency];
    // CinetPay fonctionne en XOF — convertir si necessaire
    const amountXOF = PRICES[plan][duration].XOF;
    const planLabel = `${PLAN_DETAILS[plan].label} ${duration === 'yearly' ? 'Annuel' : 'Mensuel'}`;

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    if (!apiKey || !siteId) {
      return res.status(500).json({
        message: 'CinetPay non configure',
        demoMode: true,
      });
    }

    const transactionId = 'BRVM-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

    const payment = await Payment.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      plan,
      planDuration: duration,
      amount: amountXOF, // Toujours stocker en XOF
      currency: 'XOF',
      transactionId,
      ip: getClientIp(req),
      country: req.user.country,
    });

    // Appel API CinetPay pour initialiser le paiement
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';

    const cinetpayPayload = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
      amount: amountXOF,
      currency: 'XOF',
      description: planLabel + ' - BRVM Academy',
      customer_name: req.user.name,
      customer_surname: '',
      customer_email: req.user.email,
      customer_phone_number: '',
      customer_address: '',
      customer_city: '',
      customer_country: req.user.country || 'CI',
      channels: 'ALL',
      notify_url: serverUrl + '/api/payments/webhook',
      return_url: clientUrl + '/payment/success?tx=' + transactionId,
      cancel_url: clientUrl + '/payment/cancel?tx=' + transactionId,
      metadata: JSON.stringify({ userId: req.user._id.toString(), plan, duration }),
    };

    // Appel a l'API CinetPay
    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cinetpayPayload),
    });

    const result = await response.json();

    if (result.code === '201') {
      // Succes — sauvegarder le token et l'URL de paiement
      payment.paymentToken = result.data?.payment_token || '';
      payment.paymentUrl = result.data?.payment_url || '';
      await payment.save();

      await audit(req, 'ADMIN_COURSE_UPDATE', {
        description: `Paiement initie: ${planInfo.label} (${planInfo.amount} FCFA)`,
        metadata: { transactionId, plan, amount: planInfo.amount },
      });

      res.json({
        paymentUrl: result.data.payment_url,
        transactionId,
        amount: planInfo.amount,
        plan: planInfo.label,
      });
    } else {
      // Erreur CinetPay
      payment.status = 'failed';
      payment.cinetpayData = result;
      await payment.save();

      res.status(400).json({
        message: result.message || 'Erreur CinetPay',
        details: result,
      });
    }

  } catch (error) {
    console.error('Payment init error:', error);
    res.status(500).json({ message: 'Erreur d\'initialisation du paiement' });
  }
});

// =============================================
// POST /api/payments/webhook — Callback CinetPay (notification)
// CinetPay envoie ici quand le paiement est confirme
// =============================================
router.post('/webhook', async (req, res) => {
  try {
    const { cpm_trans_id, cpm_site_id } = req.body;

    if (!cpm_trans_id) {
      return res.status(400).json({ message: 'Transaction ID manquant' });
    }

    // Verifier le paiement aupres de CinetPay
    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;

    const verifyResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: apiKey,
        site_id: siteId,
        transaction_id: cpm_trans_id,
      }),
    });

    const verifyResult = await verifyResponse.json();

    // Trouver la transaction en base
    const payment = await Payment.findOne({ transactionId: cpm_trans_id });
    if (!payment) {
      return res.status(404).json({ message: 'Transaction introuvable' });
    }

    // Mettre a jour selon le statut CinetPay
    const cpStatus = verifyResult.data?.status;
    payment.cinetpayData = verifyResult.data || {};
    payment.paymentMethod = verifyResult.data?.payment_method || '';

    if (cpStatus === 'ACCEPTED') {
      payment.status = 'completed';
      payment.paidAt = new Date();

      // Calculer la date d'expiration
      if (payment.planDuration === 'yearly') {
        payment.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      } else {
        payment.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      await payment.save();

      // Mettre a jour le plan de l'utilisateur
      await User.findByIdAndUpdate(payment.userId, { plan: payment.plan });

      console.log(`Paiement confirme: ${payment.userEmail} -> ${payment.plan} (${payment.amount} FCFA)`);

    } else if (cpStatus === 'REFUSED') {
      payment.status = 'failed';
      await payment.save();
    } else {
      // En attente ou autre
      await payment.save();
    }

    res.json({ message: 'OK' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Erreur webhook' });
  }
});

// =============================================
// GET /api/payments/verify/:transactionId — Verifier un paiement
// =============================================
router.get('/verify/:transactionId', protect, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      transactionId: req.params.transactionId,
      userId: req.user._id,
    });

    if (!payment) return res.status(404).json({ message: 'Paiement introuvable' });

    // Si encore pending, re-verifier aupres de CinetPay
    if (payment.status === 'pending' && process.env.CINETPAY_API_KEY) {
      const verifyResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apikey: process.env.CINETPAY_API_KEY,
          site_id: process.env.CINETPAY_SITE_ID,
          transaction_id: req.params.transactionId,
        }),
      });

      const result = await verifyResponse.json();

      if (result.data?.status === 'ACCEPTED') {
        payment.status = 'completed';
        payment.paidAt = new Date();
        payment.paymentMethod = result.data?.payment_method || '';
        payment.cinetpayData = result.data;
        payment.expiresAt = payment.planDuration === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await payment.save();
        await User.findByIdAndUpdate(payment.userId, { plan: payment.plan });
      } else if (result.data?.status === 'REFUSED') {
        payment.status = 'failed';
        await payment.save();
      }
    }

    res.json({
      transactionId: payment.transactionId,
      status: payment.status,
      plan: payment.plan,
      amount: payment.amount,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur de verification' });
  }
});

// =============================================
// GET /api/payments/history — Historique des paiements
// =============================================
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// =============================================
// POST /api/payments/demo — Mode demo (sans CinetPay)
// Simule un paiement reussi pour tester
// =============================================
router.post('/demo', protect, async (req, res) => {
  try {
    const { plan, duration = 'monthly', currency = 'XOF' } = req.body;
    if (!PRICES[plan] || !PRICES[plan][duration]) {
      return res.status(400).json({ message: 'Plan invalide' });
    }

    const amountXOF = PRICES[plan][duration].XOF;
    const transactionId = 'DEMO-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

    const payment = await Payment.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      plan,
      planDuration: duration,
      amount: amountXOF,
      transactionId,
      status: 'completed',
      paidAt: new Date(),
      expiresAt: duration === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethod: 'DEMO',
      ip: getClientIp(req),
    });

    // Mettre a jour le plan
    await User.findByIdAndUpdate(req.user._id, { plan });

    res.json({
      message: `Plan ${plan} active en mode demo !`,
      payment: {
        transactionId: payment.transactionId,
        status: 'completed',
        plan,
        amount: planInfo.amount,
        expiresAt: payment.expiresAt,
      },
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// =============================================
// GET /api/payments/status — Verifier config CinetPay
// =============================================
router.get('/status', protect, async (req, res) => {
  const configured = !!(process.env.CINETPAY_API_KEY && process.env.CINETPAY_SITE_ID);
  res.json({
    configured,
    message: configured ? 'CinetPay configure' : 'CinetPay non configure (mode demo disponible)',
  });
});

export default router;
