import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const inputClass = 'w-full bg-night-light border border-night-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-gold transition-colors';

export default function SecuritySettings() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [twoFA, setTwoFA] = useState({ enabled: user?.twoFactorEnabled || false, setupData: null, code: '', loading: false });
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '', loading: false });
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const res = await api.get('/api/auth/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) { /* ignore en mode demo */ }
  };

  // ===== 2FA =====
  const setup2FA = async () => {
    setTwoFA(s => ({ ...s, loading: true }));
    try {
      const res = await api.post('/api/auth/2fa/setup');
      setTwoFA(s => ({ ...s, setupData: res.data, loading: false }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
      setTwoFA(s => ({ ...s, loading: false }));
    }
  };

  const verify2FA = async () => {
    if (!twoFA.code || twoFA.code.length < 6) return toast.error('Entrez le code a 6 chiffres');
    try {
      await api.post('/api/auth/2fa/verify', { code: twoFA.code });
      setTwoFA({ enabled: true, setupData: null, code: '', loading: false });
      toast.success('2FA activee avec succes !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Code invalide');
    }
  };

  const disable2FA = async () => {
    if (!disablePassword) return toast.error('Mot de passe requis');
    try {
      await api.post('/api/auth/2fa/disable', { password: disablePassword });
      setTwoFA({ enabled: false, setupData: null, code: '', loading: false });
      setDisablePassword('');
      toast.success('2FA desactivee');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  // ===== Change Password =====
  const changePassword = async () => {
    if (pwd.newPwd !== pwd.confirm) return toast.error('Les mots de passe ne correspondent pas');
    if (pwd.newPwd.length < 8) return toast.error('Minimum 8 caracteres');
    setPwd(s => ({ ...s, loading: true }));
    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword: pwd.current,
        password: pwd.newPwd,
      });
      localStorage.setItem('brvm_token', res.data.token);
      setPwd({ current: '', newPwd: '', confirm: '', loading: false });
      toast.success('Mot de passe change ! Toutes les autres sessions sont fermees.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
      setPwd(s => ({ ...s, loading: false }));
    }
  };

  // ===== Revoke Sessions =====
  const revokeAll = async () => {
    if (!confirm('Fermer toutes les sessions ? Vous devrez vous reconnecter.')) return;
    try {
      await api.post('/api/auth/sessions/revoke-all');
      toast.success('Toutes les sessions fermees. Reconnectez-vous.');
      localStorage.removeItem('brvm_token');
      window.location.href = '/login';
    } catch (err) {
      toast.error('Erreur');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Securite du Compte</h1>
        <p className="text-gray-500 mt-1">Protegez votre compte avec la 2FA et gerez vos sessions</p>
      </div>

      {/* ===== 2FA Section ===== */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Authentification a Deux Facteurs (2FA)</h2>
            <p className="text-sm text-gray-500 mt-1">Ajoutez une couche de securite supplementaire avec Google Authenticator ou Authy</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${twoFA.enabled ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
            {twoFA.enabled ? 'Activee' : 'Desactivee'}
          </span>
        </div>

        {!twoFA.enabled && !twoFA.setupData && (
          <button onClick={setup2FA} disabled={twoFA.loading} className="btn-gold text-sm">
            {twoFA.loading ? 'Chargement...' : 'Activer la 2FA'}
          </button>
        )}

        {/* Setup Flow */}
        {twoFA.setupData && (
          <div className="space-y-4 p-4 rounded-xl bg-night-light border border-night-border">
            <div>
              <h3 className="font-semibold text-sm mb-2">1. Scannez ce code avec votre app</h3>
              <p className="text-xs text-gray-500 mb-3">Ouvrez Google Authenticator ou Authy, puis scannez le QR code ou entrez la cle manuellement.</p>
              
              {/* QR Code via API Google Charts */}
              <div className="flex items-center gap-4">
                <img
                  src={`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(twoFA.setupData.otpAuthUrl)}`}
                  alt="QR Code 2FA"
                  className="rounded-xl border border-night-border"
                  width="160" height="160"
                />
                <div>
                  <p className="text-[11px] text-gray-500 mb-1">Cle manuelle :</p>
                  <code className="text-sm font-mono text-gold bg-night-card px-3 py-2 rounded-lg block break-all">
                    {twoFA.setupData.secret}
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">2. Entrez le code a 6 chiffres</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={twoFA.code}
                  onChange={(e) => setTwoFA(s => ({ ...s, code: e.target.value.replace(/\D/g, '').substring(0, 6) }))}
                  placeholder="000000"
                  maxLength={6}
                  className={`${inputClass} w-40 text-center text-lg tracking-widest font-mono`}
                />
                <button onClick={verify2FA} className="btn-gold text-sm">Verifier et Activer</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2 text-orange-400">3. Sauvegardez vos codes de secours</h3>
              <p className="text-xs text-gray-500 mb-2">Ces codes vous permettent de vous connecter si vous perdez votre telephone. Gardez-les en lieu sur.</p>
              <div className="grid grid-cols-4 gap-2">
                {twoFA.setupData.backupCodes?.map((code, i) => (
                  <code key={i} className="text-xs font-mono text-center bg-night-card px-2 py-1.5 rounded-lg border border-night-border">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Disable 2FA */}
        {twoFA.enabled && (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
            <p className="text-sm text-red-400">Desactiver la 2FA (deconseille)</p>
            <div className="flex gap-3">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Votre mot de passe"
                className={`${inputClass} w-64`}
              />
              <button onClick={disable2FA} className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                Desactiver
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Change Password ===== */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-lg">Changer le Mot de Passe</h2>
        <p className="text-sm text-gray-500">Minimum 8 caracteres, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractere special</p>

        <div className="space-y-3">
          <input type="password" value={pwd.current} onChange={(e) => setPwd(s => ({ ...s, current: e.target.value }))} placeholder="Mot de passe actuel" className={inputClass} />
          <input type="password" value={pwd.newPwd} onChange={(e) => setPwd(s => ({ ...s, newPwd: e.target.value }))} placeholder="Nouveau mot de passe" className={inputClass} />
          <input type="password" value={pwd.confirm} onChange={(e) => setPwd(s => ({ ...s, confirm: e.target.value }))} placeholder="Confirmer le nouveau mot de passe" className={inputClass} />
          
          {/* Password strength indicator */}
          {pwd.newPwd && (
            <div className="space-y-1">
              <div className="flex gap-1.5">
                {[/[a-z]/, /[A-Z]/, /\d/, /[!@#$%^&*()_\-+=]/, /.{8,}/].map((regex, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${regex.test(pwd.newPwd) ? 'bg-green-500' : 'bg-night-border'}`} />
                ))}
              </div>
              <div className="flex gap-3 text-[10px]">
                <span className={/[a-z]/.test(pwd.newPwd) ? 'text-green-400' : 'text-gray-600'}>minuscule</span>
                <span className={/[A-Z]/.test(pwd.newPwd) ? 'text-green-400' : 'text-gray-600'}>MAJUSCULE</span>
                <span className={/\d/.test(pwd.newPwd) ? 'text-green-400' : 'text-gray-600'}>chiffre</span>
                <span className={/[!@#$%^&*()_\-+=]/.test(pwd.newPwd) ? 'text-green-400' : 'text-gray-600'}>special</span>
                <span className={pwd.newPwd.length >= 8 ? 'text-green-400' : 'text-gray-600'}>8+ chars</span>
              </div>
            </div>
          )}

          <button onClick={changePassword} disabled={pwd.loading} className="btn-gold text-sm">
            {pwd.loading ? 'En cours...' : 'Changer le mot de passe'}
          </button>
        </div>
      </div>

      {/* ===== Active Sessions ===== */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Sessions Actives</h2>
          <button onClick={revokeAll} className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
            Fermer toutes les sessions
          </button>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-night-light border border-night-border">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm">
                  {s.userAgent?.includes('Mobile') ? '📱' : '💻'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.userAgent?.substring(0, 60) || 'Navigateur inconnu'}...</p>
                  <div className="flex gap-3 text-[11px] text-gray-500 mt-0.5">
                    <span>IP: {s.ip}</span>
                    <span>Depuis: {new Date(s.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>Expire: {new Date(s.expiresAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune session active (mode demo ou backend non connecte)</p>
        )}
      </div>

      {/* ===== OWASP Compliance Info ===== */}
      <div className="card p-6 space-y-3">
        <h2 className="font-semibold text-lg">Conformite OWASP</h2>
        <p className="text-sm text-gray-500">Cette plateforme implemente les protections suivantes :</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { code: 'A01', label: 'Broken Access Control', status: 'Roles + middleware admin' },
            { code: 'A02', label: 'Cryptographic Failures', status: 'bcrypt 12 rounds + JWT' },
            { code: 'A03', label: 'Injection', status: 'Mongo Sanitize + validation' },
            { code: 'A04', label: 'Insecure Design', status: 'Rate limiting + lockout' },
            { code: 'A05', label: 'Security Misconfiguration', status: 'Helmet + CORS strict' },
            { code: 'A06', label: 'Vulnerable Components', status: 'npm audit regulier' },
            { code: 'A07', label: 'Auth Failures', status: '2FA + password policy + sessions' },
            { code: 'A08', label: 'Data Integrity', status: 'Validation + sanitization' },
            { code: 'A09', label: 'Logging Failures', status: 'Audit trail complet' },
            { code: 'A10', label: 'SSRF', status: 'Pas de requetes sortantes dynamiques' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-night-light border border-night-border">
              <span className="text-green-400 text-xs">✓</span>
              <span className="text-[11px] font-mono text-gold">{item.code}</span>
              <span className="text-xs text-gray-400 flex-1">{item.label}</span>
              <span className="text-[10px] text-gray-500">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
