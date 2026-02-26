# 🏦 BRVM Academy — Plateforme E-Learning Trading Afrique de l'Ouest

## 📋 Description

BRVM Academy est une plateforme e-learning complète dédiée à l'apprentissage du trading sur la Bourse Régionale des Valeurs Mobilières (BRVM) couvrant les 8 pays de l'UEMOA.

## 🏗️ Architecture du Projet

```
brvm-academy/
├── public/                  # Fichiers statiques
│   └── index.html
├── src/                     # Frontend React
│   ├── components/          # Composants réutilisables
│   │   ├── Layout/
│   │   ├── CourseCard/
│   │   ├── VideoPlayer/
│   │   ├── MarketTicker/
│   │   └── ...
│   ├── pages/               # Pages de l'application
│   │   ├── Dashboard.jsx
│   │   ├── Courses.jsx
│   │   ├── CourseDetail.jsx
│   │   ├── VideoPlayer.jsx
│   │   ├── Tutorials.jsx
│   │   ├── Market.jsx
│   │   ├── Portfolio.jsx
│   │   ├── Quiz.jsx
│   │   ├── Certifications.jsx
│   │   ├── Forum.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── context/             # État global (Auth, Cours, etc.)
│   ├── hooks/               # Hooks personnalisés
│   ├── utils/               # Fonctions utilitaires
│   ├── api/                 # Appels API
│   ├── styles/              # Styles globaux
│   ├── App.jsx
│   └── main.jsx
├── server/                  # Backend Node.js/Express
│   ├── routes/              # Routes API
│   ├── models/              # Modèles MongoDB
│   ├── middleware/           # Auth, upload, etc.
│   └── config/              # Configuration DB, etc.
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example
└── README.md
```

## 🚀 Installation & Lancement

### Prérequis
- **Node.js** v18+ → https://nodejs.org
- **MongoDB** → https://mongodb.com/try/download/community (ou MongoDB Atlas gratuit)
- **VS Code** → https://code.visualstudio.com
- **Git** → https://git-scm.com

### Étape 1 : Cloner et installer

```bash
# Créer le dossier et y aller
cd brvm-academy

# Installer les dépendances
npm install
```

### Étape 2 : Configurer l'environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Modifier .env avec vos clés (voir .env.example pour les détails)
```

### Étape 3 : Lancer le projet

```bash
# Lancer le frontend + backend en même temps
npm run dev

# Ou séparément :
npm run dev:client    # Frontend sur http://localhost:5173
npm run dev:server    # Backend sur http://localhost:5000
```

### Étape 4 : Ouvrir dans VS Code

```bash
code .
```

## 🧩 Extensions VS Code Recommandées

- **ES7+ React/Redux Snippets** — Snippets rapides
- **Tailwind CSS IntelliSense** — Auto-complétion CSS
- **Thunder Client** — Tester les API
- **MongoDB for VS Code** — Voir la base de données
- **Prettier** — Formater le code
- **ESLint** — Détection d'erreurs

## 🛠️ Technologies Utilisées

| Couche       | Technologie             | Rôle                          |
|-------------|------------------------|-------------------------------|
| Frontend    | React 18 + Vite        | Interface utilisateur         |
| Styles      | Tailwind CSS           | Design responsive             |
| Routing     | React Router v6        | Navigation SPA                |
| État        | Context API + useReducer| Gestion d'état global         |
| Backend     | Express.js             | API REST                      |
| Base données| MongoDB + Mongoose     | Stockage des données          |
| Auth        | JWT + bcrypt           | Authentification sécurisée    |
| Vidéos      | Cloudinary / AWS S3    | Hébergement des vidéos        |
| Paiement    | CinetPay / Wave        | Paiement mobile FCFA          |
| Email       | Nodemailer             | Notifications                 |
| Déploiement | Vercel + Railway       | Hébergement gratuit           |

## 📱 Fonctionnalités

### ✅ Phase 1 — MVP (Ce projet)
- [x] Tableau de bord étudiant
- [x] Catalogue de cours vidéo
- [x] Lecteur vidéo avec progression
- [x] Tutoriels écrits
- [x] Aperçu marché BRVM
- [x] Système d'authentification
- [x] Profil utilisateur
- [x] Système de progression (XP)

### 🔜 Phase 2 — Extension
- [ ] Quiz interactifs après chaque leçon
- [ ] Portefeuille virtuel de trading
- [ ] Forum communautaire
- [ ] Webinaires en direct (WebSocket)
- [ ] Paiement mobile (CinetPay/Wave)
- [ ] Certifications PDF
- [ ] Application mobile (React Native)

### 🔮 Phase 3 — Avancé
- [ ] Données BRVM en temps réel (API)
- [ ] Signaux de trading
- [ ] Mentorat 1-on-1
- [ ] Programme d'affiliation
- [ ] Multi-langue (Français, Anglais, Wolof, Bambara)

## 📞 Contact
Créé avec ❤️ pour l'Afrique de l'Ouest
