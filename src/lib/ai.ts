const TEXT_MODEL = 'google/gemini-2.0-flash-001';

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

const viteOpenRouterKey = ((import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) || '').trim();
const viteIdeogramKey = ((import.meta.env.VITE_IDEOGRAM_API_KEY as string | undefined) || '').trim();

/** Texte / vision via OpenRouter (clé VITE_ ou proxy Vite). */
export const hasOpenRouterKey = isConfiguredKey(viteOpenRouterKey);
/** Images via Ideogram. */
export const hasIdeogramKey = isConfiguredKey(viteIdeogramKey);

export interface AiStatus {
  hasTextAi: boolean;
  hasImageAi: boolean;
}

export async function fetchAiStatus(): Promise<AiStatus> {
  try {
    const response = await fetch('/api/ai/status', {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const data = (await response.json()) as Partial<AiStatus>;
      return {
        hasTextAi: Boolean(data.hasTextAi),
        hasImageAi: Boolean(data.hasImageAi),
      };
    }
  } catch {
    // Proxy Vite indisponible (build statique) : on se rabat sur les clés VITE_.
  }
  return {
    hasTextAi: hasOpenRouterKey,
    hasImageAi: hasIdeogramKey,
  };
}

type OpenRouterTextPart = { type: 'text'; text: string };
type OpenRouterImagePart = { type: 'image_url'; image_url: { url: string } };
type OpenRouterUserContent = string | Array<OpenRouterTextPart | OpenRouterImagePart>;

type OpenRouterMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: OpenRouterUserContent }
  | { role: 'assistant'; content: string };

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function openRouterChatJson(
  messages: OpenRouterMessage[],
  options: {
    maxTokens: number;
    responseFormat?: 'json_object' | 'text';
    temperature?: number;
  }
): Promise<string> {
  // Prod: Vercel function /api/ai/openrouter/* (proxy OpenRouter)
  // Dev: Vite middleware (vite.ai-plugin.ts) répond aussi sur /api/ai/openrouter/*
  const res = await fetch('/api/ai/openrouter/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages,
      response_format:
        options.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    }),
  });

  const raw = (await res.text()).trim();
  let payload: OpenRouterChatResponse | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as OpenRouterChatResponse) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const msg = payload?.error?.message || raw || `Erreur OpenRouter (${res.status})`;
    throw new HttpError(res.status, msg);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Aucune réponse du modèle.');
  }
  return content;
}

/** Message d'erreur lisible pour l'UI */
export function formatAiError(error: unknown): string {
  const status =
    typeof error === 'object' && error && 'status' in error && typeof (error as { status: unknown }).status === 'number'
      ? (error as { status: number }).status
      : null;
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  if (status === 401) {
    return 'Clé OpenRouter invalide ou absente. Vérifiez OPENROUTER_API_KEY sur Vercel.';
  }
  if (status === 429) {
    return 'Quota OpenRouter dépassé ou trop de requêtes. Réessayez dans un instant.';
  }
  if (status === 400) {
    return message || 'Requête refusée par OpenRouter (prompt ou paramètres).';
  }
  if (status === 403) {
    return 'Accès refusé. Vérifiez les crédits OpenRouter et le modèle autorisé.';
  }
  return message || 'Erreur inconnue pendant la génération.';
}

export interface GeneratedPinContent {
  title: string;
  description: string;
  hashtags: string[];
  altText: string;
}

export interface PinIdeas {
  ideas: string[];
}

export interface BusinessPinInput {
  business: string;
  niche?: string;
  tone?: string;
  productOrOffer?: string;
  audience?: string;
}

export interface GeneratedBusinessPin extends GeneratedPinContent {
  imageUrl: string;
  imagePrompt: string;
}

export interface PinConcept {
  imagePrompt: string;
  overlayText: string;
  title: string;
  description: string;
  hashtags: string[];
  altText: string;
}

// Generate pin content from image
export async function generatePinContent(
  imageUrl: string,
  niche?: string,
  tone?: string
): Promise<GeneratedPinContent> {
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `Tu es un expert en marketing Pinterest. Tu crées des Pins optimisés pour maximiser l'engagement.
          
Règles pour les titres:
- Maximum 100 caractères
- Accrocheur et engageant
- Utilise des chiffres et des mots puissants
- Pose une question ou crée de la curiosité

Règles pour les descriptions:
- 2-3 phrases maximum
- Inclut des mots-clés pertinents
- Appel à l'action subtil
- Maximum 500 caractères

Règles pour les hashtags:
- 3-5 hashtags pertinents
- Mélange de hashtags populaires et de niche
- Format: #motclé

Réponds en JSON avec cette structure:
{
  "title": "Titre accrocheur",
  "description": "Description optimisée SEO",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "altText": "Texte alternatif descriptif"
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse cette image et génère du contenu Pinterest optimisé.${
                niche ? ` Niche: ${niche}.` : ''
              }${tone ? ` Ton: ${tone}.` : ''}`,
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      { responseFormat: 'json_object', maxTokens: 500 }
    );

    const parsed = JSON.parse(content);
    
    return {
      title: parsed.title || 'Nouveau Pin',
      description: parsed.description || '',
      hashtags: parsed.hashtags || [],
      altText: parsed.altText || parsed.title || 'Pin image',
    };
  } catch (error) {
    console.error('Error generating pin content:', error);
    // Return fallback content
    return {
      title: 'Découvrez cette idée inspirante',
      description: 'Une idée géniale à essayer dès maintenant. Parfait pour votre prochain projet!',
      hashtags: ['#inspiration', '#idée', '#créatif'],
      altText: 'Image inspirante pour Pinterest',
    };
  }
}

// Generate pin ideas from topic
export async function generatePinIdeas(topic: string, count: number = 5): Promise<PinIdeas> {
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `Tu es un expert en contenu Pinterest. Génère des idées de Pins créatives et engageantes.
          
Pour chaque idée, donne:
- Un titre accrocheur
- Une brève description du visuel suggéré
- L'angle ou le hook principal

Réponds en JSON avec cette structure:
{
  "ideas": ["Idée 1", "Idée 2", "Idée 3"]
}`,
        },
        {
          role: 'user',
          content: `Génère ${count} idées de Pins pour le sujet: "${topic}"`,
        },
      ],
      { responseFormat: 'json_object', maxTokens: 500 }
    );

    const parsed = JSON.parse(content);
    return { ideas: parsed.ideas || [] };
  } catch (error) {
    console.error('Error generating pin ideas:', error);
    return {
      ideas: [
        `10 conseils pour ${topic}`,
        `Comment réussir en ${topic}`,
        `Les erreurs à éviter en ${topic}`,
        `Guide complet: ${topic}`,
        `Inspiration ${topic} du jour`,
      ],
    };
  }
}

// Generate optimized hashtags
export async function generateHashtags(keywords: string[]): Promise<string[]> {
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `Génère des hashtags Pinterest optimisés basés sur les mots-clés fournis.
          
Règles:
- 5-10 hashtags pertinents
- Mélange de hashtags populaires (1M+ posts) et de niche
- Format: #motclé en minuscules
- Pas d'espaces dans les hashtags

Réponds uniquement avec un tableau JSON de strings.`,
        },
        {
          role: 'user',
          content: `Mots-clés: ${keywords.join(', ')}`,
        },
      ],
      { responseFormat: 'json_object', maxTokens: 200 }
    );

    const parsed = JSON.parse(content);
    return parsed.hashtags || parsed;
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return ['#pinterest', '#inspiration', '#idée', '#créatif', '#diy'];
  }
}

// Optimize existing pin content
export async function optimizePinContent(
  title: string,
  description: string
): Promise<GeneratedPinContent> {
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `Optimise ce contenu Pinterest pour maximiser l'engagement.
          
Règles:
- Titre: maximum 100 caractères, accrocheur
- Description: 2-3 phrases, SEO-friendly, CTA
- Hashtags: 3-5 pertinents

Réponds en JSON:
{
  "title": "Titre optimisé",
  "description": "Description optimisée",
  "hashtags": ["#tag1", "#tag2"],
  "altText": "Texte alternatif"
}`,
        },
        {
          role: 'user',
          content: `Titre actuel: "${title}"\nDescription actuelle: "${description}"`,
        },
      ],
      { responseFormat: 'json_object', maxTokens: 400 }
    );

    const parsed = JSON.parse(content);
    return {
      title: parsed.title || title,
      description: parsed.description || description,
      hashtags: parsed.hashtags || [],
      altText: parsed.altText || parsed.title || title,
    };
  } catch (error) {
    console.error('Error optimizing pin content:', error);
    return {
      title,
      description,
      hashtags: ['#pinterest', '#inspiration'],
      altText: title,
    };
  }
}

export async function generatePinConcept(input: BusinessPinInput): Promise<PinConcept> {
  const content = await openRouterChatJson(
    [
      {
        role: 'system',
        content: `Tu es un expert Pinterest et design marketing. À partir d'un business, tu conçois un Pin complet.

Règles image (imagePrompt, en anglais pour Ideogram):
- Format vertical Pinterest, style photo ou illustration marketing, net et attractif
- Décrit le sujet, l'ambiance, les couleurs, la composition et le style
- Pas de logos de marques, pas de visages réalistes de célébrités
- Variation visuelle forte à chaque génération
- N'écris PAS "no text" : le titre overlayText sera rendu dans l'image

Règles overlayText:
- 3 à 7 mots maximum, en français, parfaitement orthographiés
- Accroche Pinterest (chiffre, promesse, curiosité)
- C'est le texte QUI APPARAÎT DANS l'image

Règles texte (en français):
- title: max 100 caractères, accrocheur (métadonnée Pinterest)
- description: 2-3 phrases, SEO, CTA subtil, max 500 caractères
- hashtags: 3-5 pertinents au business
- altText: descriptif SEO

Réponds en JSON:
{
  "imagePrompt": "...",
  "overlayText": "...",
  "title": "...",
  "description": "...",
  "hashtags": ["#..."],
  "altText": "..."
}`,
      },
      {
        role: 'user',
        content: `Business: ${input.business}
${input.productOrOffer ? `Offre / produit: ${input.productOrOffer}` : ''}
${input.audience ? `Audience: ${input.audience}` : ''}
${input.niche ? `Niche: ${input.niche}` : ''}
${input.tone ? `Ton: ${input.tone}` : ''}

Génère un Pin unique et différent à chaque fois, adapté à ce business.`,
      },
    ],
    { responseFormat: 'json_object', maxTokens: 700 }
  );

  const parsed = JSON.parse(content) as Partial<PinConcept>;
  const title = parsed.title || `Découvrez ${input.business}`;
  return {
    imagePrompt:
      parsed.imagePrompt ||
      `Vertical Pinterest-style lifestyle photo related to ${input.business}, bright lighting, professional marketing aesthetic`,
    overlayText: (parsed.overlayText || title).split(/\s+/).slice(0, 7).join(' '),
    title,
    description:
      parsed.description ||
      `Une idée inspirante pour ${input.business}. Parfait pour votre audience.`,
    hashtags: parsed.hashtags || ['#pinterest', '#business', '#inspiration'],
    altText: parsed.altText || parsed.title || `Pin pour ${input.business}`,
  };
}

/** Génère une image Pin verticale via Ideogram (typo lisible). */
export async function generatePinImage(
  prompt: string,
  overlayText?: string
): Promise<string> {
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      overlayText: overlayText?.trim() || undefined,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(
      payload.error || `Erreur Ideogram (${response.status || 'inconnu'})`
    );
  }

  return payload.url;
}

/**
 * Génère un Pin complet (image + texte) à partir de la description du business.
 * Chaque appel produit une variante différente (concept + visuel).
 */
export async function generateBusinessPin(
  input: BusinessPinInput
): Promise<GeneratedBusinessPin> {
  const status = await fetchAiStatus();
  if (!status.hasTextAi) {
    throw new Error(
      'Clé OpenRouter absente. Ajoutez OPENROUTER_API_KEY dans .env puis redémarrez npm run dev.'
    );
  }

  try {
    const concept = await generatePinConcept(input);
    if (!status.hasImageAi) {
      throw new Error(
        'Clé Ideogram absente. Ajoutez IDEOGRAM_API_KEY dans .env puis redémarrez npm run dev.'
      );
    }
    const imageUrl = await generatePinImage(
      concept.imagePrompt,
      concept.overlayText || concept.title
    );

    return {
      imageUrl,
      imagePrompt: concept.imagePrompt,
      title: concept.title,
      description: concept.description,
      hashtags: concept.hashtags,
      altText: concept.altText,
    };
  } catch (error) {
    console.error('Error generating business pin:', error);
    throw new Error(formatAiError(error));
  }
}

// Mock AI service for demo (when no API key)
export function mockGeneratePinContent(): GeneratedPinContent {
  const titles = [
    '10 Idées Incroyables pour Transformer Votre Espace',
    'Le Secret Que Tous Les Pros Connaissent',
    'Comment J\'ai Doublé Mes Résultats en 30 Jours',
    'La Méthode Simple Que Personne Ne Vous Dit',
    '15 Astuces Qui Vont Changer Votre Vie',
  ];
  
  const descriptions = [
    'Découvrez ces conseils éprouvés qui ont aidé des milliers de personnes à atteindre leurs objectifs. Parfait pour commencer dès aujourd\'hui!',
    'Une approche unique et créative qui fait toute la différence. Vous ne regarderez plus jamais ça de la même façon.',
    'Le guide complet que vous attendiez. Toutes les étapes expliquées simplement, même pour les débutants.',
  ];
  
  const hashtagSets = [
    ['#inspiration', '#conseils', '#astuces', '#diy', '#créatif'],
    ['#tendance', '#idée', '#découverte', '#musthave', '#essentiel'],
    ['#transformation', '#amélioration', '#progrès', '#motivation', '#succès'],
  ];
  
  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    hashtags: hashtagSets[Math.floor(Math.random() * hashtagSets.length)],
    altText: 'Image inspirante pour Pinterest',
  };
}

/** Mock pin business (image placeholder + texte) pour le mode démo */
export function mockGenerateBusinessPin(business: string): GeneratedBusinessPin {
  const content = mockGeneratePinContent();
  const seed = encodeURIComponent(business.slice(0, 40) || 'pin') + Date.now();
  return {
    ...content,
    title: content.title.includes(business) ? content.title : `${content.title} — ${business}`,
    imageUrl: `https://picsum.photos/seed/${seed}/768/1344`,
    imagePrompt: `Demo placeholder for ${business}`,
  };
}
