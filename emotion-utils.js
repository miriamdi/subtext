/**
 * emotion-utils.js
 * Emotion mapping and analysis utilities
 * Implements Russell's Circumplex Model and PAD (Pleasure-Arousal-Dominance) model
 */

class EmotionUtils {
    /**
     * Map valence and arousal to a discrete emotion label
     * Based on Russell's Circumplex Model of Emotion
     * 
     * @param {number} valence - Valence score (-1 to 1, where -1 is negative, 1 is positive)
     * @param {number} arousal - Arousal score (0 to 1, where 0 is low energy, 1 is high energy)
     * @param {number} dominance - Optional dominance/control (0-100, defaults to 50)
     * @returns {Object} - { label, category, description }
     */
    static mapToEmotion(valence, arousal, dominance = 50) {
        // Normalize inputs
        const v = Math.max(-1, Math.min(1, valence));
        const a = Math.max(0, Math.min(1, arousal));
        const d = Math.max(0, Math.min(100, dominance));

        // Determine quadrant
        const isPositive = v > 0;
        const isHighEnergy = a > 0.5;

        let label, category, description;

        if (isPositive && isHighEnergy) {
            // Top-right: Positive + High Energy
            label = this.refineHappyEmotion(v, a, d);
            category = 'excited';
            description = 'Positive with high energy';
        } else if (!isPositive && isHighEnergy) {
            // Top-left: Negative + High Energy
            label = this.refineAngryEmotion(v, a, d);
            category = 'angry';
            description = 'Negative with high energy';
        } else if (isPositive && !isHighEnergy) {
            // Bottom-right: Positive + Low Energy
            label = this.refineCalmEmotion(v, a, d);
            category = 'calm';
            description = 'Positive with low energy';
        } else {
            // Bottom-left: Negative + Low Energy
            label = this.refineSadEmotion(v, a, d);
            category = 'sad';
            description = 'Negative with low energy';
        }

        return {
            label,
            category,
            description,
            dominance: Math.round(d)
        };
    }

    /**
     * Refine positive + high energy emotions based on dominance
     * @private
     */
    static refineHappyEmotion(valence, arousal, dominance) {
        // High arousal (excited, energized)
        if (arousal > 0.75) {
            return dominance > 60 ? 'Excited / Confident' : 'Excited / Joyful';
        }
        // Medium-high arousal
        return 'Happy / Pleased';
    }

    /**
     * Refine negative + high energy emotions based on dominance
     * @private
     */
    static refineAngryEmotion(valence, arousal, dominance) {
        // High dominance = more aggressive/angry
        if (dominance > 70) {
            return arousal > 0.75 ? 'Angry / Hostile' : 'Angry / Frustrated';
        }
        // Low dominance = anxious, tense
        if (dominance < 40) {
            return 'Anxious / Tense';
        }
        // Medium dominance
        return 'Frustrated / Annoyed';
    }

    /**
     * Refine positive + low energy emotions based on dominance
     * @private
     */
    static refineCalmEmotion(valence, arousal, dominance) {
        // Very low arousal = serene, peaceful
        if (arousal < 0.3) {
            return 'Serene / Peaceful';
        }
        // Low arousal = calm, content
        return 'Calm / Content';
    }

    /**
     * Refine negative + low energy emotions based on dominance
     * @private
     */
    static refineSadEmotion(valence, arousal, dominance) {
        // Very low arousal = depressed, resigned
        if (arousal < 0.3) {
            return dominance < 40 ? 'Depressed / Hopeless' : 'Resigned / Tired';
        }
        // Low arousal = sad, melancholic
        return 'Sad / Melancholic';
    }

    /**
     * Compute dominance/control from audio and text features
     * PAD Model: Dominance reflects sense of control
     * 
     * @param {Object} audioFeatures - Audio analysis results
     * @param {string} text - Text content
     * @returns {number} - Dominance score (0-100)
     */
    static computeDominance(audioFeatures = {}, text = '') {
        let dominance = 50; // Base neutral

        // Audio-based signals
        if (audioFeatures && audioFeatures.expressiveness) {
            // High expressiveness suggests more control/confidence
            dominance += audioFeatures.expressiveness * 20; // +0 to 20
        }

        if (audioFeatures && audioFeatures.pitch) {
            // Pitch analysis (normalized to 0-1 range)
            // Very high or very low pitch can indicate tension (low control)
            // Mid-high pitch suggests confidence
            const normalizedPitch = Math.min(1, audioFeatures.pitch / 500); // Normalize to ~0-1
            if (normalizedPitch > 0.6) {
                dominance += 15; // Higher pitch often = confidence
            } else if (normalizedPitch < 0.3) {
                dominance -= 10; // Very low pitch = resignation/sadness
            }
        }

        if (audioFeatures && audioFeatures.speechRate) {
            // Normal-to-fast speech = confidence/control
            // Slow speech = uncertainty
            const rate = Math.min(1, audioFeatures.speechRate);
            if (rate > 0.6) {
                dominance += 10;
            } else if (rate < 0.4) {
                dominance -= 10;
            }
        }

        // Text-based signals (optional)
        if (text && text.length > 0) {
            // Presence of assertive language
            const assertivePatterns = /\b(must|should|will|definitely|absolutely|certain|sure|confident)\b/gi;
            const hesitantPatterns = /\b(maybe|might|could|uncertain|unsure|afraid|worry|concerned)\b/gi;

            const assertiveMatches = (text.match(assertivePatterns) || []).length;
            const hesitantMatches = (text.match(hesitantPatterns) || []).length;

            dominance += (assertiveMatches * 5) - (hesitantMatches * 5);
        }

        // Clamp to 0-100
        return Math.max(0, Math.min(100, dominance));
    }

    /**
     * Get color for emotion category
     * @param {string} category - Emotion category
     * @returns {string} - Hex color code
     */
    static getEmotionColor(category) {
        const colors = {
            excited: '#FFD700',  // Gold
            angry: '#FF6B6B',    // Red
            calm: '#87CEEB',     // Sky Blue
            sad: '#4A5F8F',      // Deep Blue
            neutral: '#9B9B9B'   // Gray
        };
        return colors[category] || colors.neutral;
    }

    /**
     * Get quadrant label and position
     * @param {number} valence - Valence (-1 to 1)
     * @param {number} arousal - Arousal (0 to 1)
     * @returns {Object} - { quadrant, label, position }
     */
    static getQuadrantInfo(valence, arousal) {
        const isPositive = valence > 0;
        const isHighEnergy = arousal > 0.5;

        let quadrant, label, position;

        if (isPositive && isHighEnergy) {
            quadrant = 'top-right';
            label = 'Excited';
            position = { x: '75%', y: '25%' };
        } else if (!isPositive && isHighEnergy) {
            quadrant = 'top-left';
            label = 'Tense';
            position = { x: '25%', y: '25%' };
        } else if (!isPositive && !isHighEnergy) {
            quadrant = 'bottom-left';
            label = 'Low';
            position = { x: '25%', y: '75%' };
        } else {
            quadrant = 'bottom-right';
            label = 'Calm';
            position = { x: '75%', y: '75%' };
        }

        return { quadrant, label, position };
    }

    /**
     * Format emotion values for display
     * @param {number} valence - Valence score
     * @param {number} arousal - Arousal score
     * @param {number} dominance - Optional dominance score
     * @returns {Object} - Formatted display values
     */
    static formatEmotionDisplay(valence, arousal, dominance = null) {
        const valencePercent = ((valence + 1) / 2 * 100).toFixed(0); // Convert -1..1 to 0..100
        const arousalPercent = (arousal * 100).toFixed(0); // Already 0..1
        const dominancePercent = dominance ? dominance.toFixed(0) : null;

        return {
            valencePercent,
            arousalPercent,
            dominancePercent
        };
    }
}
