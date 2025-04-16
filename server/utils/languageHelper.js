// server/utils/languageHelper.js

// Define supported languages centrally
export const SUPPORTED_LANGUAGES = ['en', 'zh']; // Add more as needed (e.g., 'fr', 'es')
export const DEFAULT_LANGUAGE = 'en';

// Helper to get preferred language
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

// Utility to apply translations (Copied from productRoutes - ensure consistency)
// Takes the raw product data (object, from .lean()) and the target language code
export function applyTranslations(productData, lang) {
    if (!productData) return null; // Handle null input

    // Start with a copy of the base product data
    const output = {
        ...productData,
        // Ensure attributes is copied as a plain object, handle undefined
        attributes: productData.attributes ? { ...productData.attributes } : {},
        // Keep baseAttributes separate if needed by frontend logic
        baseAttributes: productData.attributes ? { ...productData.attributes } : {}
    };

    // Check if translation is needed/possible
    const needsTranslation = lang && lang !== DEFAULT_LANGUAGE && productData.translations && productData.translations[lang];

    if (!needsTranslation) {
        delete output.translations; // Remove raw translations map
        // Add the main image url for consistency in response structure
        output.image = output.images && output.images.length > 0 ? output.images[0] : null;
        return output;
    }

    // --- Apply Translations ---
    const translation = productData.translations[lang];

    if (translation.name) output.name = translation.name;
    if (translation.description) output.description = translation.description;
    if (translation.category) output.category = translation.category;

    // --- Translate Attributes ---
    if (translation.attributes && productData.attributes && typeof productData.attributes === 'object') {
        const translatedAttributesOutput = {};
        const baseAttributes = productData.attributes;
        const translatedAttrKeys = translation.attributes.keys || {};
        const translatedAttrValues = translation.attributes.values || {};

        Object.entries(baseAttributes).forEach(([baseKey, baseValues]) => {
            const translatedKey = translatedAttrKeys[baseKey] || baseKey;
            const defaultValues = Array.isArray(baseValues) ? baseValues : [baseValues].filter(Boolean);
            let finalValues = translatedAttrValues[baseKey] || defaultValues;
            if (!Array.isArray(finalValues)) {
                finalValues = [finalValues].filter(Boolean);
            }
            if (finalValues.length > 0) {
                translatedAttributesOutput[translatedKey] = finalValues;
            }
        });
        output.attributes = translatedAttributesOutput;
    } else {
        output.attributes = productData.attributes ? { ...productData.attributes } : {};
    }

    // --- Clean up ---
    delete output.translations;

    // Add the main image url (same as non-translated path)
    output.image = output.images && output.images.length > 0 ? output.images[0] : null;

    return output;
}