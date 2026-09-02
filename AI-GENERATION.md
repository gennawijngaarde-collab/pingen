# AI Pin Generation Guide

Ce document explique comment fonctionne la génération de contenu Pinterest par IA dans PinGen.

## 🤖 Vue d'Ensemble

PinGen utilise :
- **OpenRouter** (texte + vision) pour générer titres, descriptions, hashtags et alt text
- **Ideogram** pour générer les images de Pins (format vertical 2:3)

Les clés ne sont **jamais** exposées côté navigateur en production : PinGen appelle des endpoints `/api/ai/*`.

## 🔧 Configuration

### 1. OpenRouter (texte / vision)

1. Créez une clé sur [OpenRouter](https://openrouter.ai/keys)
2. Ajoutez-la sur Vercel (ou en local dans `.env`) :

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### 2. Ideogram (images)

1. Créez une clé sur [Ideogram](https://developer.ideogram.ai)
2. Ajoutez-la sur Vercel (ou en local dans `.env`) :

```env
IDEOGRAM_API_KEY=...
```

## 🧪 Vérification

- `GET /api/ai/status` doit renvoyer `hasTextAi=true` et `hasImageAi=true`
- Le générateur d’images appelle `POST /api/ai/image`
- Le texte / vision appelle `POST /api/ai/openrouter/chat/completions`

## 📝 Utilisation

### Génération Basique

```typescript
import { generatePinContent } from '@/lib/ai';

const content = await generatePinContent('https://example.com/image.jpg');

console.log(content.title);
console.log(content.description);
console.log(content.hashtags);
console.log(content.altText);
```

### Avec Options

```typescript
const content = await generatePinContent(
  'https://example.com/image.jpg',
  'Décoration',      // Niche
  'inspiring'        // Ton
);
```

### Générer des Idées de Pins

```typescript
import { generatePinIdeas } from '@/lib/ai';

const ideas = await generatePinIdeas('Décoration intérieure', 5);
console.log(ideas.ideas);
// [
//   "10 Idées pour un Salon Scandinave",
//   "Comment Choisir ses Couleurs de Peinture",
//   ...
// ]
```

### Générer des Hashtags

```typescript
import { generateHashtags } from '@/lib/ai';

const hashtags = await generateHashtags(['décoration', 'salon', 'scandinave']);
console.log(hashtags);
// ['#décoration', '#salon', '#scandinave', '#homedecor', '#interiordesign']
```

### Optimiser du Contenu Existant

```typescript
import { optimizePinContent } from '@/lib/ai';

const optimized = await optimizePinContent(
  'Mon Pin',
  'Une description basique'
);

console.log(optimized.title);        // Titre amélioré
console.log(optimized.description);  // Description optimisée
```

## 🎨 Personnalisation

### Niches Disponibles

- Décoration
- Mode
- Cuisine
- Voyage
- Fitness
- DIY
- Technologie
- Business
- Art
- Photographie

### Tons Disponibles

- `professional` - Professionnel
- `casual` - Décontracté
- `inspiring` - Inspirant
- `educational` - Éducatif
- `funny` - Humoristique

## 🔄 Mode Démo (Sans API Key)

Si vous n'avez pas de clés OpenRouter / Ideogram, PinGen fonctionne en mode démo avec des contenus générés aléatoirement:

```typescript
import { mockGeneratePinContent } from '@/lib/ai';

const content = mockGeneratePinContent();
// Retourne un contenu aléatoire parmi des templates prédéfinis
```

## 💡 Prompts Utilisés

### Prompt de Génération de Titre

```
Règles pour les titres:
- Maximum 100 caractères
- Accrocheur et engageant
- Utilise des chiffres et des mots puissants
- Pose une question ou crée de la curiosité
```

### Prompt de Génération de Description

```
Règles pour les descriptions:
- 2-3 phrases maximum
- Inclut des mots-clés pertinents
- Appel à l'action subtil
- Maximum 500 caractères
```

### Prompt de Génération de Hashtags

```
Règles pour les hashtags:
- 3-5 hashtags pertinents
- Mélange de hashtags populaires et de niche
- Format: #motclé
```

## 📊 Performance

### Temps de Réponse Moyen

| Opération | Temps |
|-----------|-------|
| Génération complète | 2-4 secondes |
| Génération de titres | 1-2 secondes |
| Génération de hashtags | 1-2 secondes |

### Optimisations

- **Mise en cache**: Les résultats sont stockés localement
- **Retry automatique**: 3 tentatives en cas d'échec
- **Fallback**: Contenu par défaut si l'API échoue

## 🐛 Dépannage

### Erreur: "API key invalid"
- Vérifiez que `OPENROUTER_API_KEY` et/ou `IDEOGRAM_API_KEY` sont configurées sur Vercel
- Vérifiez que vous n’avez pas dépassé vos crédits

### Erreur: "Rate limit exceeded"
- Vous avez dépassé les limites du provider (OpenRouter / Ideogram)
- Attendez quelques secondes avant de réessayer
- Considérez une offre/quotas plus élevés côté provider

### Erreur: "Content policy violation"
- L'image peut contenir du contenu inapproprié
- Essayez avec une autre image

### Réponses de mauvaise qualité
- Spécifiez une niche plus précise
- Essayez un ton différent
- Fournissez une image de meilleure qualité

## 💰 Coûts

### Estimation Mensuelle

| Usage | Coût estimé |
|-------|-------------|
| 100 générations | ~$0.50 |
| 1,000 générations | ~$5.00 |
| 10,000 générations | ~$50.00 |

### Conseils pour Réduire les Coûts

1. **Mettez en cache les résultats**
2. **Limitez la longueur des réponses**
3. **Choisissez un modèle plus rapide/économique sur OpenRouter**
4. **Implémentez une file d'attente pour les générations**

## 🔮 Fonctionnalités Futures

- [ ] Génération d'images alternative (fallback)
- [ ] Analyse de performance des Pins
- [ ] Suggestions basées sur les tendances
- [ ] Traduction automatique
- [ ] A/B testing de contenu

## 📚 Ressources

- [OpenRouter](https://openrouter.ai)
- [Ideogram](https://developer.ideogram.ai)
