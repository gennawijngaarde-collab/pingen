/**
 * Prompt construction shared by the browser (`src/lib/ai.ts`) and the server-side
 * autopilot (`server/autopilot.ts`). Pure functions only: no DOM, no Node APIs.
 */

export type ConceptLocale = 'fr' | 'en' | 'es' | 'de';

export const CONCEPT_LANGUAGE_NAMES: Record<ConceptLocale, string> = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  de: 'German',
};

export const CONCEPT_TEXT_MODEL = 'google/gemini-2.5-flash';
export const CONCEPT_MAX_TOKENS = 700;

export interface PinConceptInput {
  business: string;
  productOrOffer?: string;
  audience?: string;
  niche?: string;
  tone?: string;
  websiteUrl?: string;
}

export interface PinConcept {
  imagePrompt: string;
  overlayText: string;
  title: string;
  description: string;
  hashtags: string[];
  altText: string;
}

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const TITLE_MAX = 80;

function firstPhrase(text: string): string {
  return text.split(/[,.;:!?]/)[0]?.replace(/\s+/g, ' ').trim() || text.trim();
}

export function shortBusinessHook(business: string): string {
  const words = firstPhrase(business).split(/\s+/).filter(Boolean).slice(0, 4);
  return words.length ? words.join(' ') : 'Pinterest';
}

/** Short Pinterest title; never the full business description. */
export function sanitizePinTitle(raw: string | undefined, business: string, fallbackPrefix = 'Discover'): string {
  const title = (raw || '').replace(/\s+/g, ' ').trim();
  const fullBusiness = business.replace(/\s+/g, ' ').trim();
  const looksLikeBusinessDump =
    !title ||
    title === fullBusiness ||
    (fullBusiness.length > 28 && title.includes(fullBusiness)) ||
    title.length > TITLE_MAX + 20;

  const cleaned = looksLikeBusinessDump ? `${fallbackPrefix} ${shortBusinessHook(fullBusiness)}` : title;
  return cleaned.slice(0, TITLE_MAX);
}

export function sanitizeOverlayText(raw: string | undefined, title: string): string {
  const text = (raw || title).replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).slice(0, 7).join(' ').slice(0, 60);
}

export function buildPinConceptMessages(input: PinConceptInput, languageName: string): ChatMessage[] {
  const lang = languageName;
  return [
    {
      role: 'system',
      content: `You are a Pinterest and marketing design expert. From a business description you design a complete Pin.

Image rules (imagePrompt, ALWAYS in English for the image model):
- Vertical Pinterest format, sharp marketing photo
- The visual MUST clearly show the product / trade / niche (e.g. sneakers for a sneaker shop). Generic nature photos unrelated to the business are forbidden
- Describe subject, objects, mood, colours and composition
- No brand logos, no realistic celebrity faces
- Strong visual variation on every generation
- Keep the lower third simple: a title will be overlaid later

overlayText rules:
- 3 to 7 words max, written in ${lang}, perfectly spelled
- Pinterest hook (number, promise, curiosity)
- This is the text THAT APPEARS INSIDE the image

Text rules (title, description, hashtags, altText: ALL in ${lang}):
- title: Pinterest hook of 4 to 10 words, max 80 characters. NEVER copy the business description
- description: 2-3 sentences, SEO, subtle CTA, max 500 characters${
        input.websiteUrl ? `, ending with a short invitation to visit ${input.websiteUrl}` : ''
      }
- hashtags: 3-5 relevant to the business, in ${lang}
- altText: SEO description of the image, not the raw business description

Respond in JSON:
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
${input.productOrOffer ? `Offer / product: ${input.productOrOffer}` : ''}
${input.audience ? `Audience: ${input.audience}` : ''}
${input.niche ? `Niche: ${input.niche}` : ''}
${input.tone ? `Tone: ${input.tone}` : ''}
Output language: ${lang}

Generate a unique, different Pin every time. The image must be visually recognisable as this business, not generic stock imagery.`,
    },
  ];
}

/** Extracts the JSON object from a model answer that may be wrapped in prose or code fences. */
export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  return start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
}

/** Final prompt sent to the image model (xAI Grok). */
export function buildGrokPrompt(visualPrompt: string, overlayText?: string): string {
  const text = overlayText?.trim();
  const visual = visualPrompt.trim();
  const parts = [
    'Professional vertical Pinterest pin, 2:3 portrait composition, high-end marketing graphic.',
    'The photograph MUST clearly depict the actual business, product or niche described. No generic nature stock unless the business is about nature.',
    visual,
    text
      ? 'Leave a clean dark area in the lower third for a headline. Do not invent extra slogans.'
      : 'Clean composition without extra captions or UI chrome.',
    'Crisp details, no watermarks, no UI chrome, no logos of real brands, no celebrity faces.',
  ];
  return parts.join(' ').slice(0, 3900);
}
