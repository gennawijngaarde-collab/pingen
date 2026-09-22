import type { Pin } from './supabase';

/**
 * Normalise un texte pour la comparaison (supprime ponctuation, espaces, lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Supprime la ponctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcule la similarité entre deux textes (0 = différent, 1 = identique)
 * Utilise la comparaison par mots-clés et longueur
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);

  // Exact match
  if (norm1 === norm2) return 1.0;

  // Si l'un est vide
  if (!norm1 || !norm2) return 0;

  // Comparaison par mots
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  // Coefficient de Jaccard
  const jaccard = intersection.size / union.size;

  // Bonus si les mots sont dans le même ordre (pour les 5 premiers mots)
  const start1 = norm1.split(' ').slice(0, 5).join(' ');
  const start2 = norm2.split(' ').slice(0, 5).join(' ');
  const orderBonus = start1 === start2 ? 0.2 : 0;

  return Math.min(jaccard + orderBonus, 1.0);
}

/**
 * Détecte si un pin est similaire à un pin existant
 * @param newPin - Le nouveau pin à vérifier
 * @param existingPins - La liste des pins existants
 * @param threshold - Seuil de similarité (0.7 par défaut = 70% similaire)
 * @returns Le pin similaire trouvé, ou null
 */
export function findSimilarPin(
  newPin: { title: string; description?: string },
  existingPins: Pin[],
  threshold: number = 0.7
): Pin | null {
  for (const existingPin of existingPins) {
    // Vérifier la similarité du titre
    const titleSimilarity = calculateTextSimilarity(
      newPin.title,
      existingPin.title
    );

    if (titleSimilarity >= threshold) {
      return existingPin;
    }

    // Vérifier la similarité de la description (si disponible)
    if (newPin.description && existingPin.description) {
      const descriptionSimilarity = calculateTextSimilarity(
        newPin.description,
        existingPin.description
      );

      // Si titre ET description sont similaires
      if (titleSimilarity >= 0.5 && descriptionSimilarity >= threshold) {
        return existingPin;
      }
    }
  }

  return null;
}

/**
 * Détecte les doublons exacts (titre identique)
 */
export function findExactDuplicate(
  newPin: { title: string },
  existingPins: Pin[]
): Pin | null {
  const normalizedTitle = normalizeText(newPin.title);
  
  for (const existingPin of existingPins) {
    const existingTitle = normalizeText(existingPin.title);
    if (normalizedTitle === existingTitle) {
      return existingPin;
    }
  }

  return null;
}

/**
 * Formate un message d'alerte pour l'utilisateur
 */
export function formatDuplicateWarning(
  similarPin: Pin,
  similarity: 'exact' | 'similar'
): string {
  const date = new Date(similarPin.created_at).toLocaleDateString('fr-FR');
  const statusLabel: Record<string, string> = {
    draft: 'Brouillon',
    scheduled: 'Planifié',
    published: 'Publié',
    failed: 'Échec',
  };

  const status = statusLabel[similarPin.status] || similarPin.status;

  if (similarity === 'exact') {
    return `Un pin identique existe déjà : "${similarPin.title}" (${status}, créé le ${date})`;
  }

  return `Un pin très similaire existe déjà : "${similarPin.title}" (${status}, créé le ${date})`;
}

/**
 * Vérifie si un contenu généré est un doublon et retourne un message d'avertissement
 */
export function checkForDuplicates(
  newContent: { title: string; description?: string },
  existingPins: Pin[]
): {
  isDuplicate: boolean;
  isSimilar: boolean;
  message: string | null;
  similarPin: Pin | null;
} {
  // 1. Vérifier les doublons exacts
  const exactDuplicate = findExactDuplicate(newContent, existingPins);
  if (exactDuplicate) {
    return {
      isDuplicate: true,
      isSimilar: false,
      message: formatDuplicateWarning(exactDuplicate, 'exact'),
      similarPin: exactDuplicate,
    };
  }

  // 2. Vérifier les pins similaires
  const similarPin = findSimilarPin(newContent, existingPins, 0.75);
  if (similarPin) {
    return {
      isDuplicate: false,
      isSimilar: true,
      message: formatDuplicateWarning(similarPin, 'similar'),
      similarPin,
    };
  }

  return {
    isDuplicate: false,
    isSimilar: false,
    message: null,
    similarPin: null,
  };
}
