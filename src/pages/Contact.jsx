import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return toast.error('Remplissez tous les champs obligatoires');
    toast.success('Message envoye ! Nous vous repondrons sous 48h.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const ic = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-serif text-3xl">Contactez-nous</h1>
      <p className="text-gray-500 text-sm">Une question, une suggestion ou un probleme ? Ecrivez-nous.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '📧', title: 'Email', info: 'contact@brvm-academy.com' },
          { icon: '💬', title: 'Forum', info: 'Posez votre question sur le forum communautaire' },
          { icon: '⏱', title: 'Delai de reponse', info: 'Sous 48 heures ouvrables' },
        ].map((c, i) => (
          <div key={i} className="card p-4 text-center">
            <p className="text-2xl mb-1">{c.icon}</p>
            <p className="text-sm font-semibold text-white">{c.title}</p>
            <p className="text-xs text-gray-500 mt-1">{c.info}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom complet *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Votre nom" className={ic} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" className={ic} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Sujet</label>
          <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Probleme de paiement, suggestion..." className={ic} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Message *</label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Decrivez votre demande..." className={ic} />
        </div>
        <button type="submit" className="btn-gold text-sm">Envoyer le message</button>
      </form>

      <div className="card p-4 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} BRVM Academy. Tous droits reserves.</p>
        <p className="mt-1">Plateforme educative independante — Non affiliee a la BRVM.</p>
      </div>
    </div>
  );
}
