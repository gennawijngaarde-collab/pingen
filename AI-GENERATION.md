# AI Pin Generation Guide

Ce document explique comment fonctionne la génération de contenu Pinterest par IA dans PinGen.

## 🤖 Vue d'Ensemble

PinGen utilise **OpenAI GPT-4 Vision** pour analyser les images et générer du contenu optimisé pour Pinterest:
- Titres accrocheurs
- Descriptions SEO-friendly
- Hashtags pertinents
- Textes alternatifs

## 🔧 Configuration

### 1. Obtenir une Clé API OpenAI

1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Créez un compte ou connectez-vous
3. Générez une clé API dans "API Keys"
4. Ajoutez-la dans votre `.env`:

```env
VITE_OPENAI_API_KEY=sk-your-api-key
```

### 2. Vérifier les Limites

| Modèle | Coût par 1K tokens | Contexte |
|--------|-------------------|----------|
| GPT-4 Vision | $0.01 (input) / $0.03 (output) | 128K tokens |

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

Si vous n'avez pas de clé API OpenAI, PinGen fonctionne en mode démo avec des contenus générés aléatoirement:

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
- Vérifiez que `VITE_OPENAI_API_KEY` est correctement défini
- Assurez-vous que la clé commence par `sk-`

### Erreur: "Rate limit exceeded"
- Vous avez dépassé les limites de l'API
- Attendez quelques secondes avant de réessayer
- Considérez la mise à niveau vers un plan payant

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
3. **Utilisez GPT-3.5 pour les tâches simples**
4. **Implémentez une file d'attente pour les générations**

## 🔮 Fonctionnalités Futures

- [ ] Génération d'images avec DALL-E
- [ ] Analyse de performance des Pins
- [ ] Suggestions basées sur les tendances
- [ ] Traduction automatique
- [ ] A/B testing de contenu

## 📚 Ressources

- [Documentation OpenAI](https://platform.openai.com/docs/)
- [GPT-4 Vision Guide](https://platform.openai.com/docs/guides/vision)
- [Pricing OpenAI](https://openai.com/pricing)
