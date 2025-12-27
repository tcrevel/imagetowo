# 🚴 ImageToWo

> Transformez vos images de workout vélo en fichiers .zwo importables dans Zwift, Intervals.icu et TrainingPeaks.

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

## ✨ Fonctionnalités

- 📷 **Upload d'images** - Glissez-déposez ou prenez une photo de votre workout
- 🤖 **Analyse IA** - GPT-4 Vision extrait automatiquement la structure du workout
- ✏️ **Éditeur interactif** - Modifiez les étapes, puissances et durées
- 📊 **Visualisation graphique** - Aperçu du workout avec zones de puissance colorées
- 🔄 **Drag & Drop** - Réorganisez les étapes par glisser-déposer
- 📥 **Export ZWO** - Téléchargez au format .zwo compatible Zwift
- 🌐 **Bilingue** - Interface en français et anglais
- 🔒 **Rate Limiting** - Protection contre les abus avec quota journalier (Redis/mémoire)

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Clé API OpenAI avec accès GPT-4 Vision

### Installation

```bash
# Cloner le repository
git clone https://github.com/tcrevel/imagetowo.git
cd imagetowo

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec votre clé API OpenAI

# Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## ⚙️ Configuration

Créez un fichier `.env.local` à la racine du projet :

```env
# Required: Clé API OpenAI pour GPT-4 Vision
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Taille max des fichiers (défaut: 10MB)
MAX_FILE_SIZE=10485760

# Optional: Formats d'images autorisés
ALLOWED_IMAGE_FORMATS=image/jpeg,image/png,image/webp,image/heic

# Optional: Origines autorisées en dev (tunnels, codespaces)
ALLOWED_DEV_ORIGINS=127.0.0.1,localhost

# Optional: CORS en production (* pour toutes les origines)
# ALLOWED_PROD_ORIGINS=*
```

## 📖 Comment importer votre workout

### Intervals.icu
1. Connectez-vous à [intervals.icu](https://intervals.icu)
2. Allez dans **Library** → **Workouts**
3. Cliquez sur **+ Add** → **Import from File**
4. Sélectionnez votre fichier `.zwo`

### TrainingPeaks
1. Connectez-vous à [trainingpeaks.com](https://trainingpeaks.com)
2. Allez dans **Workout Library**
3. Cliquez sur **Import Workouts** → **Import from File**
4. Sélectionnez votre fichier `.zwo`

### Zwift
1. Copiez le fichier `.zwo` dans :
   - **Windows**: `Documents\Zwift\Workouts\[votre ID]`
   - **Mac**: `Documents/Zwift/Workouts/[votre ID]`
2. Lancez Zwift → **Training** → **Custom Workouts**

## 🏗️ Architecture

```
imagetowo/
├── app/
│   ├── api/
│   │   └── workouts/
│   │       ├── parse/          # POST - Analyse d'image avec GPT-4 Vision
│   │       ├── quota/          # GET - Vérification du quota restant
│   │       └── export/zwo/     # POST - Génération du fichier ZWO
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── uploader.tsx            # Upload drag & drop + camera
│   ├── workout-editor.tsx      # Éditeur de workout complet
│   ├── workout-chart.tsx       # Visualisation graphique
│   ├── step-editor.tsx         # Éditeur d'étape individuelle
│   ├── quota-badge.tsx         # Affichage du quota restant
│   └── language-switcher.tsx   # Sélecteur de langue
├── lib/
│   ├── hooks/                  # React hooks (useQuota)
│   ├── i18n/                   # Internationalisation EN/FR
│   ├── schemas/                # Schémas Zod (workout, step, API)
│   └── services/
│       ├── openai.ts           # Intégration GPT-4 Vision
│       ├── rate-limit.ts       # Service de rate limiting
│       ├── redis.ts            # Client Redis singleton
│       └── zwo.ts              # Génération XML ZWO
└── __tests__/                  # Tests Vitest
```

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

## 📦 Build & Déploiement

```bash
# Build de production
npm run build

# Lancer en production
npm start
```

### Déploiement sur Vercel

1. Connectez votre repository GitHub à Vercel
2. Ajoutez les variables d'environnement :
   - `OPENAI_API_KEY` (requis)
   - `REDIS_URL` (optionnel, recommandé pour le rate limiting distribué)
   - `DAILY_PARSE_LIMIT` (optionnel, défaut: 5)
3. Déployez !

> 💡 **Astuce** : Utilisez [Upstash](https://upstash.com/) pour un Redis gratuit compatible Vercel.

## � Rate Limiting

ImageToWo inclut un système de limitation de requêtes pour contrôler les coûts API et prévenir les abus.

### Fonctionnement

- **Identification** : Combinaison IP + fingerprint navigateur
- **Quota** : 5 analyses par utilisateur par jour (configurable)
- **Stockage** : Redis (recommandé) ou mémoire (fallback automatique)

### Configuration

```bash
# Activer/désactiver le rate limiting (défaut: true)
RATE_LIMIT_ENABLED=true

# Nombre d'analyses par jour par utilisateur (défaut: 5)
DAILY_PARSE_LIMIT=5

# URL Redis pour le stockage distribué (optionnel)
# Sans Redis, utilise le stockage en mémoire (instance unique)
REDIS_URL=redis://localhost:6379
```

### Providers Redis recommandés

| Provider | Tier gratuit | URL |
|----------|--------------|-----|
| [Upstash](https://upstash.com/) | 10k requêtes/jour | `rediss://...@xxx.upstash.io:6379` |
| [Redis Cloud](https://redis.com/try-free/) | 30MB | `redis://...@xxx.redislabs.com:port` |
| [Railway](https://railway.app/) | $5 crédit | Variable `REDIS_URL` fournie |
| [Render](https://render.com/) | 25MB | Variable `REDIS_URL` fournie |

### Headers de réponse

Les endpoints renvoient des headers informatifs :

```
X-RateLimit-Limit: 5          # Quota total
X-RateLimit-Remaining: 3      # Requêtes restantes
X-RateLimit-Reset: 1234567890 # Timestamp de réinitialisation
```

## 🛠️ Technologies

- **Framework**: [Next.js 16](https://nextjs.org/) avec App Router
- **Langage**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod v4](https://zod.dev/)
- **IA**: [OpenAI GPT-4 Vision](https://openai.com/)
- **Cache**: [Redis](https://redis.io/) (optionnel, pour rate limiting distribué)
- **Tests**: [Vitest](https://vitest.dev/)

## 📄 Format ZWO

Le format `.zwo` est un fichier XML utilisé par Zwift pour décrire les workouts structurés. ImageToWo génère des fichiers ZWO compatibles avec :

- Zwift
- Intervals.icu
- TrainingPeaks
- TrainerRoad (import manuel)

## 📝 License

MIT © [tcrevel](https://github.com/tcrevel)

---

<p align="center">
  Made with ❤️ for cyclists who hate typing workout structures manually
</p>
