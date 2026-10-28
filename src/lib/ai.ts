import { supabase } from './supabase';
import { fetchRuntimeConfig } from './api';
import { hasKnownErrorCode } from './errors';
import {
  buildPinConceptMessages,
  CONCEPT_TEXT_MODEL,
  sanitizeOverlayText,
  sanitizePinTitle as sanitizeTitleShared,
  shortBusinessHook,
} from '../../server/pinConcept';
import { currentDictionary, currentLocale, LANGUAGE_NAMES, dictionaries } from '@/i18n/current';
import { fmt } from '@/i18n/fmt';
import type { AppLocale } from '@/i18n/types';

/** Language of the generated texts; defaults to the UI language. */
function languageName(locale?: AppLocale): string {
  return LANGUAGE_NAMES[locale ?? currentLocale()];
}

function aiDict(locale?: AppLocale) {
  return (locale ? dictionaries[locale] : currentDictionary()).ai;
}

const TEXT_MODEL = CONCEPT_TEXT_MODEL;

/** Titre Pinterest court — jamais la description complète du business. */
export function sanitizePinTitle(raw: string | undefined, business: string): string {
  return sanitizeTitleShared(raw, business, 'Découvrez');
}

export interface AiStatus {
  hasTextAi: boolean;
  hasImageAi: boolean;
}

/** AI availability comes from the server only; no API key ever reaches the browser. */
export async function fetchAiStatus(): Promise<AiStatus> {
  const config = await fetchRuntimeConfig();
  return config.ai;
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
  // Get Supabase session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  // Prod: Vercel function /api/ai/chat
  // Dev: Vite middleware (vite.ai-plugin.ts) répond aussi sur /api/ai/chat
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
    const msg = payload?.error?.message || raw || `Génération indisponible (${res.status})`;
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

  // Keep quota/capacity codes intact so the UI can translate them (see lib/errors.ts).
  if (hasKnownErrorCode(message)) return message;

  const e = currentDictionary().ai.errors;
  const lower = message.toLowerCase();
  if (lower.includes('no endpoints found') || lower.includes('not a valid model')) return e.modelUnavailable;
  if (status === 404 || lower.includes('not_found') || lower.includes('the page could not be found')) return e.unreachable;
  if (status === 402 || lower.includes('credit') || lower.includes('payment required') || lower.includes('insufficient')) {
    return e.insufficientCredit;
  }
  if (status === 401) return e.notEnabled;
  if (status === 429) return e.saturated;
  if (status === 403) return e.forbidden;
  if (/openrouter|grok|\bx\.?ai\b|gemini|ideogram/.test(lower)) {
    return status === 400 ? e.rejected : e.unknown;
  }
  if (status === 400) return message || e.rejected;
  return message || e.unknown;
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
  websiteUrl?: string;
  /** Language of the generated texts (defaults to the UI language). */
  language?: AppLocale;
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
  tone?: string,
  language?: AppLocale
): Promise<GeneratedPinContent> {
  const lang = languageName(language);
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `You are a Pinterest marketing expert creating Pins optimised for engagement.
Write ALL output text (title, description, hashtags, altText) in ${lang}.

Title rules: max 100 characters, catchy, uses numbers or power words, sparks curiosity.
Description rules: 2-3 sentences max, relevant keywords, subtle call to action, max 500 characters.
Hashtag rules: 3-5 relevant hashtags in ${lang}, mix of popular and niche, format #keyword, no spaces.

Respond in JSON with this structure:
{
  "title": "...",
  "description": "...",
  "hashtags": ["#...", "#...", "#..."],
  "altText": "..."
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse this image and generate optimised Pinterest content in ${lang}.${
                niche ? ` Niche: ${niche}.` : ''
              }${tone ? ` Tone: ${tone}.` : ''}`,
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
    const d = aiDict(language);
    return {
      title: parsed.title || d.fallbackTitle,
      description: parsed.description || '',
      hashtags: parsed.hashtags || [],
      altText: parsed.altText || parsed.title || d.fallbackAltText,
    };
  } catch (error) {
    console.error('Error generating pin content:', error);
    const d = aiDict(language);
    return {
      title: d.fallbackTitle,
      description: d.fallbackDescription,
      hashtags: [...d.fallbackHashtags],
      altText: d.fallbackAltText,
    };
  }
}

// Generate pin ideas from topic
export async function generatePinIdeas(topic: string, count: number = 5, language?: AppLocale): Promise<PinIdeas> {
  const lang = languageName(language);
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `You are a Pinterest content expert. Generate creative, engaging Pin ideas written in ${lang}.
Each idea is one catchy line (title + angle).

Respond in JSON with this structure:
{
  "ideas": ["Idea 1", "Idea 2", "Idea 3"]
}`,
        },
        {
          role: 'user',
          content: `Generate ${count} Pin ideas in ${lang} for the topic: "${topic}"`,
        },
      ],
      { responseFormat: 'json_object', maxTokens: 500 }
    );

    const parsed = JSON.parse(content);
    return { ideas: parsed.ideas || [] };
  } catch (error) {
    console.error('Error generating pin ideas:', error);
    return { ideas: aiDict(language).ideaTemplates.map((tpl) => fmt(tpl, { topic })) };
  }
}

// Generate optimized hashtags
export async function generateHashtags(keywords: string[], language?: AppLocale): Promise<string[]> {
  const lang = languageName(language);
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `Generate optimised Pinterest hashtags in ${lang} from the provided keywords.

Rules:
- 5-10 relevant hashtags
- Mix of popular (1M+ posts) and niche hashtags
- Format: #keyword in lowercase, no spaces, no accents in the hashtag itself

Respond in JSON: { "hashtags": ["#...", "#..."] }`,
        },
        {
          role: 'user',
          content: `Keywords: ${keywords.join(', ')}`,
        },
      ],
      { responseFormat: 'json_object', maxTokens: 200 }
    );

    const parsed = JSON.parse(content);
    return parsed.hashtags || parsed;
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return ['#pinterest', ...aiDict(language).fallbackHashtags];
  }
}

// Optimize existing pin content
export async function optimizePinContent(
  title: string,
  description: string,
  language?: AppLocale
): Promise<GeneratedPinContent> {
  const lang = languageName(language);
  try {
    const content = await openRouterChatJson(
      [
        {
          role: 'system',
          content: `Optimise this Pinterest content for maximum engagement. Write everything in ${lang}.

Rules:
- Title: max 100 characters, catchy
- Description: 2-3 sentences, SEO-friendly, call to action
- Hashtags: 3-5 relevant, in ${lang}

Respond in JSON:
{
  "title": "...",
  "description": "...",
  "hashtags": ["#tag1", "#tag2"],
  "altText": "..."
}`,
        },
        {
          role: 'user',
          content: `Current title: "${title}"\nCurrent description: "${description}"`,
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
      hashtags: ['#pinterest', ...aiDict(language).fallbackHashtags.slice(0, 1)],
      altText: title,
    };
  }
}

export async function generatePinConcept(input: BusinessPinInput): Promise<PinConcept> {
  const lang = languageName(input.language);
  const content = await openRouterChatJson(
    buildPinConceptMessages(
      {
        business: input.business,
        productOrOffer: input.productOrOffer,
        audience: input.audience,
        niche: input.niche,
        tone: input.tone,
        websiteUrl: input.websiteUrl,
      },
      lang
    ),
    { responseFormat: 'json_object', maxTokens: 700 }
  );

  const parsed = JSON.parse(content) as Partial<PinConcept>;
  const title = sanitizePinTitle(parsed.title, input.business);
  const d = aiDict(input.language);
  return {
    imagePrompt:
      parsed.imagePrompt ||
      `Vertical Pinterest-style lifestyle photo related to ${shortBusinessHook(input.business)}, bright lighting, professional marketing aesthetic`,
    overlayText: sanitizeOverlayText(parsed.overlayText, title),
    title,
    description: parsed.description || fmt(d.businessDescription, { business: shortBusinessHook(input.business) }),
    hashtags: parsed.hashtags || ['#pinterest', ...d.fallbackHashtags.slice(0, 2)],
    altText: parsed.altText || title,
  };
}

/** Génère une image Pin verticale, puis superpose le titre. */
export async function generatePinImage(
  prompt: string,
  overlayText?: string
): Promise<string> {
  // Get Supabase session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  const { composePinOverlay } = await import('@/lib/pinImage');
  const response = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
    throw new HttpError(
      response.status || 502,
      payload.error || 'La génération de l’image a échoué. Réessayez.'
    );
  }

  try {
    return await composePinOverlay(payload.url, overlayText);
  } catch {
    return payload.url;
  }
}

/**
 * Génère un Pin complet (image + texte) à partir de la description du business.
 * Chaque appel produit une variante différente (concept + visuel).
 */
export async function generateBusinessPin(
  input: BusinessPinInput
): Promise<GeneratedBusinessPin> {
  try {
    const concept = await generatePinConcept(input);
    const imageUrl = await generatePinImage(
      concept.imagePrompt,
      concept.overlayText || concept.title
    );

    return {
      imageUrl,
      imagePrompt: concept.imagePrompt,
      title: sanitizePinTitle(concept.title, input.business),
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
  const hook = shortBusinessHook(business);
  const seed = encodeURIComponent(hook || 'pin') + Date.now();
  return {
    ...content,
    title: sanitizePinTitle(content.title, business),
    description: `${content.description} Idéal pour ${hook}.`,
    imageUrl: `https://picsum.photos/seed/${seed}/768/1344`,
    imagePrompt: `Demo placeholder for ${hook}`,
  };
}
