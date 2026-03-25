/**
 * analysis.js
 * Text sentiment analysis and emotion inference
 */

class SentimentAnalyzer {
    constructor() {
        this.initializeKeywords();
    }

    /**
     * Initialize sentiment keyword dictionaries
     */
    initializeKeywords() {
        // Positive sentiment words
        this.positiveWords = new Set([
            'good', 'great', 'amazing', 'wonderful', 'excellent', 'love', 'happy',
            'glad', 'joy', 'joy', 'cheerful', 'beautiful', 'perfect', 'fantastic',
            'awesome', 'brilliant', 'superb', 'fine', 'nice', 'lovely', 'pleasant',
            'delighted', 'thrilled', 'proud', 'confident', 'hopeful', 'grateful',
            'appreciate', 'enjoy', 'pleased', 'content', 'blessed', 'blessed',
            'lucky', 'fortunate', 'successful', 'excited', 'energetic', 'enthusiastic',
            'inspired', 'motivated', 'optimistic', 'positive', 'uplifting'
        ]);

        // Negative sentiment words
        this.negativeWords = new Set([
            'bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry',
            'frustrated', 'disappointed', 'upset', 'depressed', 'miserable', 'pathetic',
            'disgusting', 'gross', 'vile', 'worst', 'evil', 'poor', 'ugly',
            'annoyed', 'irritated', 'anxious', 'stressed', 'worried', 'concerned',
            'afraid', 'scared', 'lonely', 'lonely', 'regret', 'ashamed', 'guilty',
            'confused', 'helpless', 'powerless', 'tired', 'exhausted', 'overwhelmed',
            'betrayed', 'hurt', 'pain', 'sick', 'numb', 'empty', 'broken',
            'hopeless', 'desperate', 'lost', 'unwanted', 'worthless', 'useless',
            'failed', 'failure', 'problem', 'problems', 'negative', 'dread'
        ]);

        // High energy words
        this.highEnergyWords = new Set([
            'excited', 'energetic', 'enthusiastic', 'passionate', 'intense', 'powerful',
            'explosive', 'dynamic', 'vibrant', 'rushing', 'bursting', 'rapid',
            'swift', 'fast', 'quick', 'urgent', 'pressing', 'critical', 'severe',
            'extreme', 'outrageous', 'wild', 'crazy', 'mad', 'furious', 'furious',
            'angry', 'enraged', 'infuriated', 'livid', 'shocking', 'surprising',
            'startling', 'overwhelming', 'breathtaking'
        ]);

        // Low energy words (calm, quiet, peaceful)
        this.lowEnergyWords = new Set([
            'calm', 'peaceful', 'quiet', 'still', 'serene', 'tranquil', 'relaxed',
            'comfortable', 'cozy', 'soft', 'gentle', 'tender', 'mild', 'slow',
            'lazy', 'drowsy', 'sleepy', 'tired', 'weary', 'exhausted', 'weak',
            'fragile', 'delicate', 'faint', 'subtle', 'whisper', 'muted', 'minor',
            'small', 'little', 'quiet', 'shy', 'reserved', 'withdrawn'
        ]);
    }

    /**
     * Analyze text sentiment (valence)
     * Returns value between -1 (negative) and 1 (positive)
     */
    analyzeSentiment(text) {
        if (!text || text.trim().length === 0) {
            return 0;
        }

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);

        if (words.length === 0) {
            return 0;
        }

        let positiveCount = 0;
        let negativeCount = 0;

        for (const word of words) {
            if (this.positiveWords.has(word)) {
                positiveCount++;
            } else if (this.negativeWords.has(word)) {
                negativeCount++;
            }
        }

        if (positiveCount === 0 && negativeCount === 0) {
            return 0;
        }

        // Calculate valence: positive bias minus negative bias
        const total = positiveCount + negativeCount;
        const valence = (positiveCount - negativeCount) / total;

        return Math.max(-1, Math.min(1, valence));
    }

    /**
     * Estimate text energy (arousal) from word choice
     * Returns value between 0 (low) and 1 (high)
     */
    analyzeEnergy(text) {
        if (!text || text.trim().length === 0) {
            return 0.5; // Neutral if empty
        }

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);

        if (words.length === 0) {
            return 0.5;
        }

        let highEnergy = 0;
        let lowEnergy = 0;

        for (const word of words) {
            if (this.highEnergyWords.has(word)) {
                highEnergy++;
            } else if (this.lowEnergyWords.has(word)) {
                lowEnergy++;
            }
        }

        const total = highEnergy + lowEnergy;

        if (total === 0) {
            return 0.5; // Neutral if no energy words found
        }

        // Arousal: high energy - low energy, normalized
        const arousal = (highEnergy - lowEnergy) / total;
        return (arousal + 1) / 2; // Convert from -1,1 to 0,1
    }

    /**
     * Get primary emotions from text
     */
    getEmotionsFromText(text) {
        const valence = this.analyzeSentiment(text);
        const arousal = this.analyzeEnergy(text);

        // Map to emotion labels based on valence and arousal
        const emotions = [];

        if (valence > 0.3 && arousal > 0.6) {
            emotions.push('excited', 'joyful', 'enthusiastic');
        } else if (valence > 0.3 && arousal <= 0.4) {
            emotions.push('content', 'peaceful', 'satisfied');
        } else if (valence > 0.3) {
            emotions.push('happy', 'pleased', 'glad');
        } else if (valence < -0.3 && arousal > 0.6) {
            emotions.push('angry', 'frustrated', 'furious');
        } else if (valence < -0.3 && arousal <= 0.4) {
            emotions.push('sad', 'disappointed', 'disheartened');
        } else if (valence < -0.3) {
            emotions.push('unhappy', 'upset', 'troubled');
        } else if (arousal > 0.6) {
            emotions.push('anxious', 'nervous', 'agitated');
        } else if (arousal <= 0.4) {
            emotions.push('calm', 'composed', 'neutral');
        } else {
            emotions.push('focused', 'thoughtful', 'contemplative');
        }

        return emotions;
    }
}

/**
 * EmotionInference - Combines audio and text features for emotion detection
 */
class EmotionInference {
    constructor() {
        this.sentimentAnalyzer = new SentimentAnalyzer();
    }

    /**
     * Infer emotion from combined audio and text data
     */
    inferEmotion(features, text) {
        // Use only audio features if present, fallback to text if not
        let valence = 0, arousal = 0, label = 'Neutral', description = '';
        if (features) {
            // Heuristic rules
            // High energy + high pitch + fast rate → high arousal (excited / anxious)
            // Low energy + low pitch → low arousal (sad / tired)
            // High pitch variance → emotional intensity
            // High pause ratio → hesitation / uncertainty
            // Low pitch + high energy → anger-like

            // Arousal: mostly energy, pitchMean, speechRate
            arousal = (
                features.energy * 0.4 +
                features.pitchMean * 0.2 +
                features.speechRate * 0.3 +
                (1 - features.pauseRatio) * 0.1
            );
            arousal = Math.max(0, Math.min(1, arousal));

            // Valence: pitchMean, spectralCentroid, pauseRatio, pitchVariance
            valence = (
                (features.pitchMean - 0.5) * 0.5 +
                (features.spectralCentroid - 0.5) * 0.3 +
                (0.5 - features.pauseRatio) * 0.2
            );
            valence = Math.max(-1, Math.min(1, valence));

            // Label logic
            if (arousal > 0.7 && valence > 0.2) {
                label = 'Excited';
                description = 'Positive, high energy';
            } else if (arousal > 0.7 && valence < -0.2) {
                label = 'Stressed';
                description = 'Negative, high energy';
            } else if (arousal < 0.4 && valence < -0.2) {
                label = 'Sad';
                description = 'Negative, low energy';
            } else if (arousal < 0.4 && valence > 0.2) {
                label = 'Calm';
                description = 'Positive, low energy';
            } else if (features.pitchVariance > 0.3 && arousal > 0.5) {
                label = 'Frustrated';
                description = 'Negative, intense';
            } else if (features.pauseRatio > 0.5) {
                label = 'Uncertain';
                description = 'Hesitant, many pauses';
            } else {
                label = 'Neutral';
                description = 'Balanced';
            }
        } else {
            // Fallback to text-based if no audio
            const textValence = this.sentimentAnalyzer.analyzeSentiment(text);
            const textArousal = this.sentimentAnalyzer.analyzeEnergy(text);
            valence = textValence;
            arousal = textArousal;
            // Use text label mapping
            if (valence > 0.3 && arousal > 0.6) label = 'Excited';
            else if (valence > 0.3 && arousal <= 0.4) label = 'Calm';
            else if (valence < -0.3 && arousal > 0.6) label = 'Stressed';
            else if (valence < -0.3 && arousal <= 0.4) label = 'Sad';
            else label = 'Neutral';
        }
        return {
            valence,
            arousal,
            label,
            description
        };
    }

    /**
     * Calculate arousal from audio features
     */
    calculateAudioArousal(features) {
        if (!features) return 0.5;

        // High volume + high speech rate = high arousal
        const volumeContrib = features.volume * 0.4;
        const speechRateContrib = features.speechRate * 0.4;
        const pitchContrib = features.pitch * 0.2;

        const arousal = volumeContrib + speechRateContrib + pitchContrib;
        return Math.max(0, Math.min(1, arousal));
    }

    /**
     * Estimate valence hint from audio (limited info from audio alone)
     * Uses pitch variation and expressiveness as proxies
     */
    estimateAudioValence(features) {
        if (!features) return 0;

        // Higher expressiveness and pitch variation might suggest positive emotions
        // But this is weak signal - text sentiment is more reliable
        const expressiveness = features.expressiveness * 0.6;
        const pitchVariation = features.pitch * 0.4;

        // Convert to -1 to 1 range
        let valence = (expressiveness + pitchVariation) / 2;
        valence = (valence - 0.5) * 2; // Center around 0

        return Math.max(-0.5, Math.min(0.5, valence)); // Limit to ±0.5
    }



    /**
     * Get emotion labels based on valence and arousal
     */
    getEmotionLabel(valence, arousal) {
        if (valence > 0.3 && arousal > 0.6) return 'Excited/Joyful';
        if (valence > 0.3 && arousal <= 0.4) return 'Content/Peaceful';
        if (valence > 0.3) return 'Happy/Pleased';
        if (valence < -0.3 && arousal > 0.6) return 'Angry/Frustrated';
        if (valence < -0.3 && arousal <= 0.4) return 'Sad/Disappointed';
        if (valence < -0.3) return 'Upset/Troubled';
        if (arousal > 0.6) return 'Anxious/Nervous';
        if (arousal <= 0.4) return 'Calm/Composed';
        return 'Neutral/Thoughtful';
    }

    /**
     * Normalize features for display (0-1 range)
     */
    normalizeFeatures(features) {
        if (!features) return null;
        return {
            energy: Math.max(0, Math.min(1, features.energy)),
            pitchMean: Math.max(0, Math.min(1, features.pitchMean)),
            pitchVariance: Math.max(0, Math.min(1, features.pitchVariance)),
            speechRate: Math.max(0, Math.min(1, features.speechRate)),
            pauseRatio: Math.max(0, Math.min(1, features.pauseRatio)),
            spectralCentroid: Math.max(0, Math.min(1, features.spectralCentroid))
        };
    }
}

// Create global instances
const sentimentAnalyzer = new SentimentAnalyzer();
const emotionInference = new EmotionInference();
