# 🔍 Détection de Doublons - Documentation

## Vue d'ensemble

Le système de détection de doublons empêche la création de pins identiques ou très similaires, optimisant ainsi votre présence sur Pinterest et évitant le spam.

---

## 🎯 Fonctionnalités

### 1. Détection automatique
✅ **Lors de la génération** : Le système vérifie automatiquement si un pin similaire existe  
✅ **Avant la sauvegarde** : Une vérification finale empêche les doublons exacts  
✅ **Avertissements visuels** : Notifications claires en cas de similarité

### 2. Niveaux de détection

#### 🔴 Doublon exact (100% identique)
- Titre identique (ignor la casse et ponctuation)
- **Action** : Sauvegarde bloquée
- **Solution** : Régénérer ou modifier le titre

#### 🟡 Pin similaire (>75% similaire)
- Titre très proche (>75% de mots communs)
- Description similaire
- **Action** : Avertissement affiché
- **Solution** : Vous pouvez continuer ou régénérer

#### 🟢 Pin unique (<75% similaire)
- Contenu différent
- **Action** : Aucune alerte
- **Solution** : Sauvegarde directe

---

## 🧮 Comment ça marche ?

### Algorithme de similarité

1. **Normalisation** : Suppression de la ponctuation, mise en minuscules
2. **Comparaison par mots** : Coefficient de Jaccard (intersection/union)
3. **Bonus d'ordre** : Les 5 premiers mots dans le même ordre augmentent la similarité
4. **Score** : 0 (différent) à 1 (identique)

```typescript
// Exemple
Titre 1: "10 Astuces Déco Pour Votre Salon"
Titre 2: "10 Astuces Déco Pour Votre Cuisine"
Similarité: ~0.78 (78% similaire) → Avertissement

Titre 1: "Guide Complet Marketing Digital"
Titre 2: "Guide Complet Marketing Digital"
Similarité: 1.0 (100% similaire) → Bloqué
```

---

## 🎨 Interface utilisateur

### Avertissement de doublon

```
⚠️ Contenu similaire détecté

Un pin très similaire existe déjà : "Votre titre" 
(Brouillon, créé le 22/09/2026)

Vous pouvez régénérer pour une variante différente 
ou continuer pour sauvegarder ce contenu.
```

### Actions disponibles

- **Régénérer** : Créer une nouvelle variante unique
- **Continuer** : Sauvegarder malgré la similarité (pins similaires uniquement)
- **Modifier** : Éditer le titre/description avant sauvegarde

---

## 📊 Seuils de détection

| Type | Seuil | Action |
|------|-------|--------|
| Doublon exact | 100% | Bloqué |
| Très similaire | ≥75% | Avertissement |
| Similaire | 50-74% | Aucune alerte |
| Différent | <50% | Aucune alerte |

---

## 🔧 Configuration technique

### Fichiers modifiés

1. **`src/lib/duplicate-detection.ts`** (nouveau)
   - Fonctions de calcul de similarité
   - Détection de doublons
   - Formatage des messages

2. **`src/pages/dashboard/PinGenerator.tsx`**
   - Intégration de la vérification lors de la génération
   - Avertissements visuels
   - Blocage des doublons exacts avant sauvegarde

3. **`src/hooks/usePins.tsx`**
   - Aucune modification (RLS Supabase gère déjà l'isolation des données)

---

## 🎯 Cas d'usage

### Scénario 1 : Génération multiple pour le même business
```
Business : "Boutique de décoration bohème"
Pin 1 : "10 idées déco bohème pour votre salon" ✅
Pin 2 : "10 Idées Déco Bohème Pour Votre Salon" 🔴 Bloqué (doublon exact)
Pin 3 : "15 astuces déco bohème pour petits espaces" ✅
```

### Scénario 2 : Variantes similaires
```
Pin 1 : "Guide complet du marketing Pinterest" ✅
Pin 2 : "Guide Complet du Marketing Pinterest 2026" 🟡 Similaire (avertissement)
Pin 3 : "Stratégies avancées de Pinterest Marketing" ✅
```

---

## 🚀 Avantages

✅ **Qualité** : Évite le spam et améliore votre présence sur Pinterest  
✅ **Créativité** : Force la création de contenu varié et original  
✅ **SEO Pinterest** : Diversité de contenu = meilleur référencement  
✅ **Expérience utilisateur** : Avertissements clairs et informatifs  
✅ **Performance** : Algorithme rapide (calcul local, pas d'API)

---

## 🐛 Dépannage

### "Doublon détecté mais les titres semblent différents"
→ La normalisation supprime la ponctuation et la casse. Les titres peuvent sembler différents visuellement mais être identiques après normalisation.

**Solution** : Modifiez suffisamment le titre (ajoutez des mots uniques, changez l'angle d'approche)

### "Avertissement pour un pin ancien que je veux recréer"
→ Vous pouvez continuer malgré l'avertissement (pins similaires) ou supprimer l'ancien pin d'abord.

**Solution** : Cliquez sur "Sauvegarder" ou "Planifier" pour continuer

### "Aucun doublon détecté mais j'ai déjà ce contenu"
→ Le seuil de similarité est à 75%. Si votre pin est <75% similaire, il passe.

**Solution** : Vérifiez manuellement dans la liste de vos pins

---

## 📈 Améliorations futures

- [ ] Détection par image (hachage perceptuel)
- [ ] Historique des doublons détectés
- [ ] Paramètres utilisateur (ajuster le seuil)
- [ ] Suggestions de modifications pour éviter les doublons
- [ ] Clustering de pins similaires dans le dashboard

---

## 📝 Exemple d'utilisation

```typescript
import { checkForDuplicates } from '@/lib/duplicate-detection';
import { usePins } from '@/hooks/usePins';

const { pins } = usePins();
const newContent = {
  title: "10 Astuces Marketing",
  description: "Découvrez nos meilleures astuces..."
};

const result = checkForDuplicates(newContent, pins);

if (result.isDuplicate) {
  // Bloquer la sauvegarde
  alert('Doublon exact détecté !');
} else if (result.isSimilar) {
  // Afficher un avertissement
  console.warn(result.message);
} else {
  // Continuer normalement
  savePin(newContent);
}
```

---

**Date de création** : 22 septembre 2026  
**Version** : 1.0.0  
**Auteur** : GenX Team
