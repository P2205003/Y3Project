// server/utils/languageHelper.js

// Define supported languages centrally
export const SUPPORTED_LANGUAGES = ['en', 'zh']; // Add more as needed (e.g., 'fr', 'es')
export const DEFAULT_LANGUAGE = 'en';

export function getPreferredLanguage(req) {
    // 1. Check explicit query parameter first (e.g., ?lang=zh)
    const queryLang = req.query.lang;
    if (queryLang && SUPPORTED_LANGUAGES.includes(queryLang)) {
        return queryLang;
    }

    // 2. Check Accept-Language header
    const acceptLanguageHeader = req.headers['accept-language'];
    if (acceptLanguageHeader) {
        // Basic parsing: extract language codes and quality factors
        const languages = acceptLanguageHeader.split(',').map(langPart => {
            const parts = langPart.trim().split(';');
            const code = parts[0].split('-')[0].toLowerCase(); // Use base language code (e.g., 'en' from 'en-US')
            const quality = parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0;
            return { code, quality };
        }).sort((a, b) => b.quality - a.quality); // Sort by quality descending

        // Find the first supported language in the preferred list
        for (const lang of languages) {
            if (SUPPORTED_LANGUAGES.includes(lang.code)) {
                return lang.code;
            }
        }
    }

    // 3. Fallback to default language
    return DEFAULT_LANGUAGE;
}