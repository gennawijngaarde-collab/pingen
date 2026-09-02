# PinGen - Pinterest Automation SaaS

**PinGen** est une plateforme d'automatisation Pinterest complète qui permet de créer, planifier et analyser du contenu Pinterest à grande échelle.

🚀 **Live Demo**: https://opfzg5vxw4phk.ok.kimi.link

---

## ✨ Fonctionnalités

### 🎯 Landing Page
- Design moderne et responsive
- Sections: Hero, Features, How it Works, Pricing, Testimonials, FAQ, CTA
- Animations et effets visuels
- Optimisé pour la conversion

### 🔐 Authentification
- Inscription / Connexion par email
- Authentification sociale (Google, GitHub)
- Gestion de profil utilisateur
- Protection des routes

### 📊 Dashboard
- Vue d'ensemble des statistiques
- Pins récents avec statut
- Utilisation du plan
- Actions rapides

### 🤖 Générateur de Pins IA
- Upload d'image ou URL
- Génération automatique de:
  - Titres accrocheurs
  - Descriptions SEO
  - Hashtags pertinents
  - Texte alternatif
- Prévisualisation du Pin
- Sauvegarde et planification

### 📅 Planification
- Calendrier visuel
- Gestion des Pins planifiés
- Brouillons
- Pins publiés
- Actions (éditer, supprimer, planifier)

### 📈 Analytics
- Statistiques en temps réel
- Impressions, Saves, Clics, Engagement
- Graphiques de performance
- Top Pins
- Performance par tableau

### ⚙️ Paramètres
- Profil utilisateur
- Connexion Pinterest
- Changement de mot de passe
- Préférences de notification
- Gestion de l'abonnement

---

## 🛠️ Stack Technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth & Database**: Supabase
- **AI**: OpenRouter (texte) + Ideogram (images)
- **Payments**: Stripe (prêt à intégrer)
- **Routing**: React Router DOM
- **Icons**: Lucide React

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone https://github.com/yourusername/pingen.git
cd pingen
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (texte / vision)
OPENROUTER_API_KEY=sk-or-v1-your-key

# Ideogram (images de Pins)
IDEOGRAM_API_KEY=your-ideogram-key

# Pinterest API
VITE_PINTEREST_APP_ID=your-app-id
VITE_PINTEREST_APP_SECRET=your-app-secret

# Stripe (pour les paiements)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
```

### 4. Lancer en développement

```bash
npm run dev
```

### 5. Build pour production

```bash
npm run build
```

---

## 📁 Structure du Projet

```
src/
├── components/
│   ├── landing/          # Sections de la landing page
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Pricing.tsx
│   │   ├── Testimonials.tsx
│   │   ├── FAQ.tsx
│   │   ├── CTA.tsx
│   │   └── Footer.tsx
│   └── ui/               # Composants shadcn/ui
├── hooks/
│   ├── useAuth.tsx       # Contexte d'authentification
│   ├── usePins.tsx       # Gestion des Pins
│   └── use-toast.ts      # Notifications
├── lib/
│   ├── supabase.ts       # Client Supabase + fonctions
│   ├── ai.ts             # Service de génération IA
│   └── pinterest.ts      # Service API Pinterest
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   └── dashboard/
│       ├── DashboardLayout.tsx
│       ├── Dashboard.tsx
│       ├── PinGenerator.tsx
│       ├── Schedule.tsx
│       ├── Analytics.tsx
│       └── Settings.tsx
├── App.tsx               # Router principal
└── main.tsx              # Point d'entrée
```

---

## 🔌 Configuration des API

### Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Activer l'authentification par email
3. Créer les tables:

```sql
-- Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'starter',
  pins_created_this_month INTEGER DEFAULT 0,
  pinterest_accounts_connected INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pins
CREATE TABLE pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  board_id TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  pinterest_pin_id TEXT,
  hashtags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pinterest Accounts
CREATE TABLE pinterest_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  pinterest_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  boards JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### OpenRouter + Ideogram

1. Créer une clé sur [OpenRouter](https://openrouter.ai/keys) (texte, titres, descriptions)
2. Créer une clé sur [Ideogram](https://developer.ideogram.ai) (images de Pins avec typo)
3. Les ajouter dans `.env` (`OPENROUTER_API_KEY` et `IDEOGRAM_API_KEY`)
4. Redémarrer `npm run dev`

### Pinterest API

1. Créer une app sur [Pinterest Developers](https://developers.pinterest.com)
2. Configurer les OAuth redirect URIs
3. Récupérer l'App ID et App Secret

---

## 💳 Intégration Stripe (Optionnel)

Pour activer les paiements:

1. Créer un compte [Stripe](https://stripe.com)
2. Configurer les produits et prix
3. Ajouter la clé publishable dans `.env`
4. Décommenter le code Stripe dans `Settings.tsx`

---

## 🎯 Plans et Limitations

| Plan | Pins/mois | Comptes Pinterest | Prix |
|------|-----------|-------------------|------|
| Starter | 10 | 1 | Gratuit |
| Pro | 100 | 3 | 19€/mois |
| Business | Illimité | 10 | 49€/mois |

---

## 📝 Fonctionnalités à venir

- [ ] Publication automatique sur Pinterest
- [ ] Templates de Pins personnalisables
- [ ] Analytics avancés avec export
- [ ] Collaboration d'équipe
- [ ] API publique
- [ ] Webhooks
- [ ] Mobile app

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit vos changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👨‍💻 Auteur

**PinGen Team** - contact@pingenx.io

---

## 🙏 Remerciements

- [shadcn/ui](https://ui.shadcn.com) pour les composants UI
- [Supabase](https://supabase.com) pour l'authentification et la BDD
- [OpenRouter](https://openrouter.ai) pour le texte et la vision
- [Ideogram](https://ideogram.ai) pour les images de Pins
- [Pinterest](https://developers.pinterest.com) pour l'API
