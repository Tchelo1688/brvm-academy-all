import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function PaymentResult({ type = 'success' }) {
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const txId = searchParams.get('tx');

  useEffect(() => {
    if (txId) verifyPayment();
    else setLoading(false);
  }, [txId]);

  const verifyPayment = async () => {
    try {
      const res = await api.get(`/api/payments/verify/${txId}`);
      setPayment(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <div className="text-center py-20 text-gold">Verification du paiement...</div>;

  const isSuccess = type === 'success' && payment?.status === 'completed';

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className="card p-8 space-y-4">
        <p className="text-6xl">{isSuccess ? '🎉' : type === 'cancel' ? '😔' : '⏳'}</p>
        
        <h1 className="font-serif text-2xl">
          {isSuccess ? 'Paiement Reussi !' : type === 'cancel' ? 'Paiement Annule' : 'Paiement en cours de verification'}
        </h1>

        <p className="text-gray-500 text-sm">
          {isSuccess
            ? `Votre plan ${payment.plan?.toUpperCase()} est maintenant actif. Profitez de tous les cours !`
            : type === 'cancel'
            ? 'Le paiement a ete annule. Vous pouvez reessayer a tout moment.'
            : 'Le paiement est en cours de traitement. Il sera active sous quelques minutes.'}
        </p>

        {payment && (
          <div className="p-4 rounded-xl bg-night-light border border-night-border text-left text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-semibold">{payment.plan?.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Montant</span><span className="font-semibold">{new Intl.NumberFormat('fr-FR').format(payment.amount)} FCFA</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Statut</span>
              <span className={`font-semibold ${payment.status === 'completed' ? 'text-green-400' : 'text-orange-400'}`}>
                {payment.status === 'completed' ? 'Confirme' : 'En attente'}
              </span>
            </div>
            {payment.expiresAt && (
              <div className="flex justify-between"><span className="text-gray-500">Expire le</span><span>{new Date(payment.expiresAt).toLocaleDateString('fr-FR')}</span></div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center pt-4">
          <Link to="/courses" className="btn-gold text-sm">Voir les cours</Link>
          <Link to="/pricing" className="btn-outline text-sm">Retour aux plans</Link>
        </div>
      </div>
    </div>
  );
}
