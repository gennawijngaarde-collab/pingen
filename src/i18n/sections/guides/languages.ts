/** Languages that currently have guide copy in this section. Add a language here only after its pack exists. */
export const PUBLISHED_GUIDE_LANGUAGES = ['en'] as const;

export type PublishedGuideLanguage = (typeof PUBLISHED_GUIDE_LANGUAGES)[number];
