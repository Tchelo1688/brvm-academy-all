export default function Confidentialite() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-serif text-3xl">Politique de Confidentialite</h1>
      <p className="text-xs text-gray-500">Derniere mise a jour : Fevrier 2026</p>

      <div className="card p-6 space-y-5 text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="font-semibold text-lg text-white mb-2">1. Introduction</h2>
          <p>BRVM Academy s'engage a proteger la vie privee de ses utilisateurs. Cette politique decrit les donnees que nous collectons, comment nous les utilisons et les mesures de securite mises en place.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">2. Donnees Collectees</h2>
          <p>Nous collectons les donnees suivantes :</p>
          <p className="mt-2"><span className="text-gold font-semibold">Donnees d'inscription :</span> nom complet, adresse email, mot de passe (chiffre), pays de residence.</p>
          <p className="mt-1"><span className="text-gold font-semibold">Donnees d'utilisation :</span> progression dans les cours, scores de quiz, historique de transactions du portefeuille virtuel, publications sur le forum.</p>
          <p className="mt-1"><span className="text-gold font-semibold">Donnees de paiement :</span> informations de transaction traitees par CinetPay (nous ne stockons pas les numeros de carte ou de compte Mobile Money).</p>
          <p className="mt-1"><span className="text-gold font-semibold">Donnees techniques :</span> adresse IP, type de navigateur, horodatage de connexion (journaux d'audit).</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">3. Utilisation des Donnees</h2>
          <p>Vos donnees sont utilisees exclusivement pour : fournir et ameliorer les services de la plateforme, personnaliser votre experience d'apprentissage, traiter les paiements et gerer les abonnements, assurer la securite de la plateforme (detection de fraude, journal d'audit), et communiquer avec vous sur votre compte et les services.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">4. Securite des Donnees</h2>
          <p>Nous mettons en oeuvre des mesures de securite conformes aux standards OWASP Top 10 :</p>
          <p className="mt-2">Les mots de passe sont chiffres avec bcrypt (12 rounds). L'authentification a deux facteurs (2FA) via TOTP est disponible. Les sessions sont gerees par JWT avec expiration. La limitation de debit previent les attaques par force brute (5 tentatives max). Les entrees utilisateur sont assainies contre les injections NoSQL. Les journaux d'audit tracent toutes les actions sensibles avec retention de 90 jours.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">5. Partage des Donnees</h2>
          <p>Nous ne vendons jamais vos donnees personnelles. Vos donnees peuvent etre partagees uniquement avec : CinetPay pour le traitement des paiements, Cloudinary pour l'hebergement des fichiers multimedia, MongoDB Atlas pour le stockage des donnees (serveurs securises). Ces prestataires sont lies par des accords de confidentialite.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">6. Cookies</h2>
          <p>La plateforme utilise des tokens JWT stockes localement pour maintenir votre session. Nous n'utilisons pas de cookies de tracage publicitaire.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">7. Vos Droits</h2>
          <p>Conformement a la reglementation applicable, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees personnelles. Pour exercer ces droits, contactez-nous a : contact@brvm-academy.com. Nous repondrons dans un delai de 30 jours.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">8. Conservation des Donnees</h2>
          <p>Vos donnees sont conservees tant que votre compte est actif. Les journaux d'audit sont conserves 90 jours. En cas de suppression de compte, vos donnees personnelles sont supprimees sous 30 jours, a l'exception des donnees de facturation conservees selon les obligations legales.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">9. Contact</h2>
          <p>Pour toute question relative a la protection de vos donnees : contact@brvm-academy.com</p>
        </section>
      </div>
    </div>
  );
}
