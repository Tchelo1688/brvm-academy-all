export default function MentionsLegales() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-serif text-3xl">Mentions Legales</h1>
      <p className="text-xs text-gray-500">Derniere mise a jour : Fevrier 2026</p>

      <div className="card p-6 space-y-5 text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="font-semibold text-lg text-white mb-2">1. Editeur du Site</h2>
          <p><span className="text-gold font-semibold">Raison sociale :</span> BRVM Academy</p>
          <p><span className="text-gold font-semibold">Forme juridique :</span> [A completer]</p>
          <p><span className="text-gold font-semibold">Siege social :</span> [Adresse a completer]</p>
          <p><span className="text-gold font-semibold">Email :</span> contact@brvm-academy.com</p>
          <p><span className="text-gold font-semibold">Directeur de publication :</span> [Nom a completer]</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">2. Hebergement</h2>
          <p><span className="text-gold font-semibold">Frontend :</span> Vercel Inc. — 440 N Baxter St, Los Angeles, CA 90012, USA — vercel.com</p>
          <p><span className="text-gold font-semibold">Backend :</span> Render Services Inc. — San Francisco, CA, USA — render.com</p>
          <p><span className="text-gold font-semibold">Base de donnees :</span> MongoDB Inc. (Atlas) — New York, NY, USA — mongodb.com</p>
          <p><span className="text-gold font-semibold">Fichiers multimedia :</span> Cloudinary Ltd. — Santa Clara, CA, USA — cloudinary.com</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">3. Propriete Intellectuelle</h2>
          <p>L'ensemble du contenu present sur la plateforme BRVM Academy (textes, cours, videos, images, tutoriels, documents PDF, logos, design, code source) est protege par le droit de la propriete intellectuelle.</p>
          <p className="mt-2">Toute reproduction, representation, modification, publication, adaptation, totale ou partielle, des elements du site, quel que soit le moyen ou le procede utilise, est interdite sans autorisation ecrite prealable de BRVM Academy.</p>
          <p className="mt-2">Toute exploitation non autorisee du site ou de ses contenus sera consideree comme constitutive d'une contrefacon et poursuivie conformement aux dispositions du droit OHADA relatif a la propriete intellectuelle.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">4. Marques</h2>
          <p>BRVM Academy et son logo sont des marques de BRVM Academy. La mention "BRVM" fait reference a la Bourse Regionale des Valeurs Mobilieres, qui est une marque de son titulaire. BRVM Academy n'est pas affiliee, approuvee ou sponsorisee par la BRVM.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">5. Avertissement sur les Investissements</h2>
          <p className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300">Les contenus proposes par BRVM Academy sont fournis a titre strictement educatif et informatif. Ils ne constituent en aucun cas des conseils en investissement, des recommandations d'achat ou de vente de valeurs mobilieres, ni une incitation a effectuer des transactions financieres. Les performances passees ne prejugent pas des performances futures. Tout investissement comporte des risques de perte en capital. Consultez un conseiller financier agree avant toute decision d'investissement.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">6. Donnees Personnelles</h2>
          <p>Le traitement des donnees personnelles est detaille dans notre <a href="/confidentialite" className="text-gold hover:underline">Politique de Confidentialite</a>. Conformement a la reglementation en vigueur, vous disposez de droits d'acces, de rectification et de suppression de vos donnees.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">7. Prestataire de Paiement</h2>
          <p><span className="text-gold font-semibold">CinetPay :</span> Les transactions financieres sont traitees par CinetPay, prestataire de paiement agree dans l'espace UEMOA. BRVM Academy ne stocke aucune donnee bancaire ou de compte Mobile Money. Moyens acceptes : Orange Money, MTN Mobile Money, Wave, Moov Money, Visa, Mastercard.</p>
        </section>

        <section>
          <h2 className="font-semibold text-lg text-white mb-2">8. Loi Applicable et Juridiction</h2>
          <p>Les presentes mentions legales sont regies par le droit applicable dans l'espace OHADA. En cas de litige, les parties s'efforceront de trouver une solution amiable. A defaut, le litige sera porte devant les tribunaux competents d'Abidjan, Republique de Cote d'Ivoire.</p>
        </section>
      </div>
    </div>
  );
}
