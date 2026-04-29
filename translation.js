/**
 * translation.js
 * Language detection and translation to English
 * Uses MyMemory Translation API (free, no API key required)
 */

class TranslationManager {
    constructor() {
        this.apiUrl = 'https://api.mymemory.translated.net/get';
        this.detectedLanguage = null;
        this.translatedText = null;
        this.originalText = null;
    }

    /**
     * Detect language using a simple heuristic approach
     * Checks common keywords in different languages
     */
    async detectLanguage(text) {
        console.log('[TRANSLATE-DEBUG] detectLanguage called with:', text.substring(0, 50));
        
        if (!text || text.trim().length === 0) {
            console.log('[TRANSLATE-DEBUG] Empty text, returning en');
            return 'en';
        }

        // Simple language detection based on common characters and patterns
        const lowerText = text.toLowerCase();

        // Check for non-ASCII characters that indicate specific languages
        if (/[\u4E00-\u9FFF]/.test(text)) {
            console.log('[TRANSLATE-DEBUG] Detected: Chinese');
            return 'zh'; // Chinese
        }
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
            console.log('[TRANSLATE-DEBUG] Detected: Japanese');
            return 'ja'; // Japanese
        }
        if (/[\uAC00-\uD7AF]/.test(text)) {
            console.log('[TRANSLATE-DEBUG] Detected: Korean');
            return 'ko'; // Korean
        }
        if (/[\u0590-\u05FF]/.test(text)) {
            console.log('[TRANSLATE-DEBUG] Detected: Hebrew via Unicode range');
            return 'he'; // Hebrew
        }
        if (/[\u0600-\u06FF]/.test(text)) {
            console.log('[TRANSLATE-DEBUG] Detected: Arabic');
            return 'ar'; // Arabic
        }
        if (/[\u0400-\u04FF]/.test(text)) {
            console.log('[TRANSLATE-DEBUG] Detected: Russian');
            return 'ru'; // Russian
        }

        // Common Spanish words
        if (/(hola|gracias|por favor|qué|cómo|dónde|cuándo)/i.test(lowerText)) {
            return 'es';
        }

        // Common French words
        if (/(bonjour|merci|s'il vous plaît|comment|où|pourquoi)/i.test(lowerText)) {
            return 'fr';
        }

        // Common German words, but avoid false positives for English text
        // Only match if at least 2 German words are present and text is not mostly English
        const germanWords = (lowerText.match(/(hallo|danke|bitte|wie|wo|wann|warum)/gi) || []).length;
        const englishWords = (lowerText.match(/\b(the|and|is|are|what|do|you|i|to|a|of|in|it|that|for|on|with|as|was|at|by|an|be|this|have|from|or|one|had|word|but|not|all|were|we|when|your|can|said|there|use|each|which|she|how|their|if|will|up|other|about|out|many|then|them|these|so|some|her|would|make|like|him|into|time|has|look|two|more|write|go|see|number|no|way|could|people|my|than|first|water|been|call|who|oil|its|now|find|long|down|day|did|get|come|made|may|part)\b/gi) || []).length;
        if (germanWords >= 2 && englishWords < 3) {
            return 'de';
        }

        // Common Italian words
        if (/(ciao|grazie|per favore|come|dove|quando|perché)/i.test(lowerText)) {
            return 'it';
        }

        // Common Portuguese words
        if (/(olá|obrigado|por favor|como|onde|quando|por quê)/i.test(lowerText)) {
            return 'pt';
        }

        // Default to English if no specific language detected
        return 'en';
    }

    /**
     * Translate text to English using MyMemory API
     */
    async translateToEnglish(text, detectedLanguage = null) {
        console.log('[TRANSLATE-DEBUG] translateToEnglish called');
        
        if (!text || text.trim().length === 0) {
            console.log('[TRANSLATE-DEBUG] Empty text in translateToEnglish');
            return {
                success: false,
                original: text,
                translated: text,
                language: 'en',
                isTranslated: false
            };
        }

        try {
            // Detect language if not provided
            if (!detectedLanguage) {
                console.log('[TRANSLATE-DEBUG] Auto-detecting language...');
                detectedLanguage = await this.detectLanguage(text);
            }

            console.log('[TRANSLATE-DEBUG] Language code:', detectedLanguage, 'Name:', this.getLanguageName(detectedLanguage));

            this.detectedLanguage = detectedLanguage;
            this.originalText = text;

            // If already in English, no translation needed
            if (detectedLanguage === 'en') {
                console.log('[TRANSLATE-DEBUG] Already in English, returning original');
                this.translatedText = text;
                return {
                    success: true,
                    original: text,
                    translated: text,
                    language: 'en',
                    isTranslated: false
                };
            }

            // Call translation API
            const apiUrl = `${this.apiUrl}?q=${encodeURIComponent(text)}&langpair=${detectedLanguage}|en`;
            console.log('[TRANSLATE-DEBUG] Calling API:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit'
            });
            console.log('[TRANSLATE-DEBUG] API Response status:', response.status);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[TRANSLATE-DEBUG] API Response data:', data);

            // Check if translation was successful
            if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
                const translatedText = data.responseData.translatedText.trim();
                
                // Check if translation actually changed the text
                const isActuallyTranslated = translatedText.toLowerCase() !== text.toLowerCase() 
                    && translatedText.length > 0
                    && !translatedText.includes('ERROR');
                
                console.log('[TRANSLATE-DEBUG] Translation successful');
                console.log('[TRANSLATE-DEBUG] Original:', text);
                console.log('[TRANSLATE-DEBUG] Translated:', translatedText);
                console.log('[TRANSLATE-DEBUG] Actually translated:', isActuallyTranslated);
                
                this.translatedText = translatedText;
                
                return {
                    success: true,
                    original: text,
                    translated: translatedText,
                    language: detectedLanguage,
                    isTranslated: isActuallyTranslated,
                    confidence: data.responseData.match || 1
                };
            } else {
                console.warn('[TRANSLATE-DEBUG] Translation API failed or returned empty');
                console.warn('[TRANSLATE-DEBUG] Response Status:', data.responseStatus);
                console.warn('[TRANSLATE-DEBUG] Response Data:', data);
                
                this.translatedText = text;
                return {
                    success: false,
                    original: text,
                    translated: text,
                    language: detectedLanguage,
                    isTranslated: false,
                    error: 'Translation service returned no translation'
                };
            }
        } catch (error) {
            console.error('[TRANSLATE-DEBUG] Exception in translateToEnglish:', error);
            console.error('[TRANSLATE-DEBUG] Stack:', error.stack);
            
            return {
                success: false,
                original: text,
                translated: text,
                language: detectedLanguage || 'unknown',
                isTranslated: false,
                error: error.message
            };
        }
    }

    /**
     * Get language name from code
     */
    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'zh': 'Chinese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'he': 'Hebrew'
        };
        return languages[code] || code;
    }

    /**
     * Format language info for display
     */
    getLanguageInfo(result) {
        if (!result.isTranslated) {
            return null;
        }

        return {
            detected: this.getLanguageName(result.language),
            code: result.language,
            translated: result.translated,
            original: result.original
        };
    }
}

// Global instance
const translationManager = new TranslationManager();

// Verify initialization
console.log('[TRANSLATION.JS] Module loaded successfully');
console.log('[TRANSLATION.JS] translationManager instance created:', translationManager);
console.log('[TRANSLATION.JS] translationManager.translateToEnglish type:', typeof translationManager.translateToEnglish);
