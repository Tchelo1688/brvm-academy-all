import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlinePlayCircle,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineTrophy,
  HiOutlinePencilSquare,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup,
  HiOutlineCog6Tooth,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';

const navItems = [
  { section: 'Principal' },
  { path: '/', icon: HiOutlineHome, label: 'Tableau de Bord' },
  { path: '/courses', icon: HiOutlinePlayCircle, label: 'Cours Video', badge: 12 },
  { path: '/tutorials', icon: HiOutlineBookOpen, label: 'Tutoriels' },
  { path: '/market', icon: HiOutlineChartBar, label: 'Marche BRVM' },
  { path: '/portfolio', icon: HiOutlineBriefcase, label: 'Portefeuille Virtuel' },
  { section: 'Apprentissage' },
  { path: '/certifications', icon: HiOutlineTrophy, label: 'Certifications' },
  { path: '/quiz', icon: HiOutlinePencilSquare, label: 'Quiz & Examens' },
  { path: '/webinars', icon: HiOutlineCalendarDays, label: 'Webinaires Live', badge: 3 },
  { section: 'Communaute' },
  { path: '/forum', icon: HiOutlineChatBubbleLeftRight, label: 'Forum' },
  { path: '/affiliation', icon: HiOutlineUserGroup, label: 'Affiliation' },
  { path: '/pricing', icon: HiOutlineTrophy, label: 'Plans & Tarifs', highlight: true },
];

const adminNavItems = [
  { section: 'Administration' },
  { path: '/admin', icon: HiOutlineCog6Tooth, label: 'Panel Admin' },
  { path: '/admin/courses', icon: HiOutlinePlayCircle, label: 'Gerer les Cours' },
  { path: '/admin/tutorials', icon: HiOutlineBookOpen, label: 'Gerer les Tutoriels' },
  { path: '/admin/webinars', icon: HiOutlineCalendarDays, label: 'Gerer les Webinaires' },
  { path: '/admin/users', icon: HiOutlineUserGroup, label: 'Gerer les Utilisateurs' },
  { path: '/admin/audit', icon: HiOutlineCog6Tooth, label: 'Journal d\'Audit' },
];

// Lien securite visible pour tous les utilisateurs
const securityNavItem = { path: '/security', icon: HiOutlineCog6Tooth, label: 'Securite & 2FA' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="flex min-h-screen">
      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[260px] bg-night-light border-r border-night-border
        flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-night-border">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center font-serif text-lg font-bold text-night-DEFAULT shadow-lg">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg text-gold leading-tight">BRVM Academy</span>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">Trading Afrique</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navItems.map((item, i) => {
            if (item.section) {
              return (
                <p key={i} className="text-[10px] uppercase tracking-[2px] text-gray-600 font-semibold px-3 pt-4 pb-2">
                  {item.section}
                </p>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all relative
                  ${isActive
                    ? 'bg-gold/10 text-gold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-gold before:rounded-r'
                    : 'text-gray-400 hover:bg-gold/5 hover:text-gray-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Securite — visible pour tous */}
          <p className="text-[10px] uppercase tracking-[2px] text-gray-600 font-semibold px-3 pt-4 pb-2">Compte</p>
          <NavLink
            to={securityNavItem.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all relative
              ${isActive
                ? 'bg-gold/10 text-gold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-gold before:rounded-r'
                : 'text-gray-400 hover:bg-gold/5 hover:text-gray-200'
              }`
            }
          >
            <HiOutlineCog6Tooth className="w-5 h-5 flex-shrink-0" />
            <span>{securityNavItem.label}</span>
          </NavLink>

          {/* Admin Nav — visible pour instructor, moderator, admin */}
          {['instructor', 'moderator', 'admin'].includes(user?.role) && adminNavItems.map((item, i) => {
            if (item.section) {
              return (
                <p key={`admin-${i}`} className="text-[10px] uppercase tracking-[2px] text-orange-400/70 font-semibold px-3 pt-4 pb-2">
                  {item.section}
                </p>
              );
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all relative
                  ${isActive
                    ? 'bg-orange-500/10 text-orange-400 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:bg-orange-500 before:rounded-r'
                    : 'text-gray-400 hover:bg-orange-500/5 hover:text-gray-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-night-border p-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald to-emerald-dark flex items-center justify-center text-sm font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || 'Utilisateur'}</p>
              <p className="text-[11px] text-gray-500">{user?.plan || 'Plan Gratuit'}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors" title="Déconnexion">
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 lg:ml-[260px] flex flex-col">
        {/* TOPBAR */}
        <header className="sticky top-0 h-16 bg-night-DEFAULT/85 backdrop-blur-xl border-b border-night-border flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-night-light border border-night-border rounded-xl px-4 py-2 w-80 focus-within:border-gold transition-colors">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher un cours, action BRVM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none text-sm outline-none w-full text-white placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* BRVM Ticker */}
            <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-green-500/5 border border-green-500/20 rounded-xl mr-2">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-gray-500 font-medium">BRVM-C</span>
                <span className="text-white font-medium">268.42</span>
                <span className="text-green-400 font-semibold">+1.23%</span>
              </div>
            </div>

            <button className="relative w-9 h-9 rounded-xl border border-night-border bg-night-light text-gray-400 flex items-center justify-center hover:border-gold hover:text-gold transition-all">
              <HiOutlineBell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-night-light" />
            </button>
          </div>
        </header>

        {/* PAGE CONTENT — rendered by React Router */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>

        {/* FOOTER COPYRIGHT */}
        <footer className="border-t border-night-border px-6 lg:px-8 py-6 text-xs text-gray-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gold font-bold text-sm">BRVM</span>
              <span className="text-gray-600">|</span>
              <span>&copy; {new Date().getFullYear()} BRVM Academy. Tous droits reserves.</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="/cgu" className="hover:text-gold transition-colors">Conditions Generales</a>
              <a href="/confidentialite" className="hover:text-gold transition-colors">Politique de Confidentialite</a>
              <a href="/mentions-legales" className="hover:text-gold transition-colors">Mentions Legales</a>
              <a href="/contact" className="hover:text-gold transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-night-border/50 text-center text-[10px] text-gray-600">
            BRVM Academy est une plateforme educative independante. Elle n'est pas affiliee a la Bourse Regionale des Valeurs Mobilieres (BRVM).
            Les informations fournies sont a titre educatif uniquement et ne constituent pas des conseils en investissement.
            Toute reproduction, meme partielle, du contenu est interdite sans autorisation ecrite prealable.
          </div>
        </footer>
      </div>
    </div>
  );
}
