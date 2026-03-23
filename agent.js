/**
 * agent.js
 * NVC (Nonviolent Communication) Framework Generation
 * Converts emotional insights into compassionate communication
 */

class NVCAgent {
    constructor() {
        this.initializeTemplates();
    }

    /**
     * Initialize NVC templates and response patterns
     */
    initializeTemplates() {
        this.observationTemplates = {
            high_energy_negative: [
                'Your voice carries intensity and urgency, and your words convey strong tension.',
                'There\'s significant energy in your tone paired with words expressing frustration or concern.',
                'Your delivery is forceful, and the content reflects distress or strong disagreement.'
            ],
            high_energy_positive: [
                'Your voice is vibrant and energetic, and your words express enthusiasm and hope.',
                'There\'s bright energy in your expression matched with positive, forward-looking language.',
                'Your delivery is animated and your words convey excitement and confidence.'
            ],
            low_energy_negative: [
                'Your tone is subdued, and your words carry sadness or resignation.',
                'There\'s quietness in your voice alongside expressions of disappointment or difficulty.',
                'Your delivery is gentle and withdrawn, with content suggesting pain or weariness.'
            ],
            low_energy_positive: [
                'Your voice is calm and peaceful, with words expressing contentment and ease.',
                'There\'s a gentle tone paired with appreciative and satisfied language.',
                'Your delivery is serene, and your words convey acceptance and gratitude.'
            ],
            neutral: [
                'Your voice is measured and your words are thoughtfully chosen.',
                'There\'s a balanced tone in your expression with neither strong positive nor negative emphasis.',
                'Your delivery is steady, reflecting a contemplative or analytical perspective.'
            ]
        };

        this.feelingTemplates = {
            high_energy_negative: [
                'angry, frustrated, or overwhelmed',
                'tense, agitated, or enraged',
                'anxious, desperate, or panicked'
            ],
            high_energy_positive: [
                'excited, enthusiastic, or joyful',
                'energized, passionate, or inspired',
                'hopeful, delighted, or thrilled'
            ],
            low_energy_negative: [
                'sad, discouraged, or hopeless',
                'disappointed, hurt, or rejected',
                'exhausted, withdrawn, or numb'
            ],
            low_energy_positive: [
                'content, peaceful, or satisfied',
                'calm, comfortable, or at ease',
                'grateful, fulfilled, or serene'
            ],
            neutral: [
                'thoughtful, focused, or contemplative',
                'neutral, composed, or balanced',
                'curious, interested, or engaged'
            ]
        };

        this.needTemplates = {
            high_energy_negative: [
                'to be heard, understood, and validated',
                'clarity, resolution, or change',
                'support, help, or to regain control'
            ],
            high_energy_positive: [
                'to share your joy and celebrate',
                'connection, collaboration, or movement',
                'growth, achievement, or recognition'
            ],
            low_energy_negative: [
                'comfort, gentleness, and compassion',
                'rest, safety, or time to process',
                'connection, support, or purpose'
            ],
            low_energy_positive: [
                'peace, harmony, and balance',
                'appreciation, comfort, or simplicity',
                'presence, acceptance, or reflection'
            ],
            neutral: [
                'understanding, information, or perspective',
                'space to think, reflect, or decide',
                'respect for your autonomy or boundaries'
            ]
        };

        this.requestTemplates = {
            high_energy_negative: [
                'Take a breath, then share one specific concern with me.',
                'Could we pause and discuss what\'s most important to address right now?',
                'I\'d like to help. What would be most useful to you in this moment?'
            ],
            high_energy_positive: [
                'Let\'s channel this energy into action. What would you like to do?',
                'I love your enthusiasm! How can we move forward together?',
                'Tell me more about what\'s bringing you this joy.'
            ],
            low_energy_negative: [
                'You deserve support. Would you like to talk about what\'s weighing on you?',
                'I\'m here for you. What do you need right now?',
                'Let\'s take this slowly. What would help you feel better?'
            ],
            low_energy_positive: [
                'This peace you\'ve found is beautiful. Would you like to share what created it?',
                'I\'m glad you\'re feeling settled. What are you appreciating right now?',
                'This calm is precious. Let\'s protect and nurture it together.'
            ],
            neutral: [
                'Help me understand your perspective better.',
                'What matters most to you about this situation?',
                'How would you like to move forward?'
            ]
        };
    }

    /**
     * Generate complete NVC response
     */
    generateNVC(emotion, audioFeatures, text) {
        const category = this.categorizeEmotion(emotion);

        return {
            observation: this.generateObservation(category),
            feeling: this.generateFeeling(category),
            need: this.generateNeed(category),
            request: this.generateRequest(category),
            category: category
        };
    }

    /**
     * Categorize emotion into template category
     */
    categorizeEmotion(emotion) {
        const { valence, arousal } = emotion;

        if (arousal > 0.6 && valence < -0.2) {
            return 'high_energy_negative';
        } else if (arousal > 0.6 && valence > 0.2) {
            return 'high_energy_positive';
        } else if (arousal <= 0.4 && valence < -0.2) {
            return 'low_energy_negative';
        } else if (arousal <= 0.4 && valence > 0.2) {
            return 'low_energy_positive';
        } else {
            return 'neutral';
        }
    }

    /**
     * Generate Observation
     */
    generateObservation(category) {
        const templates = this.observationTemplates[category];
        return this.selectRandom(templates);
    }

    /**
     * Generate Feeling
     */
    generateFeeling(category) {
        const templates = this.feelingTemplates[category];
        const selected = this.selectRandom(templates);
        return `You might be feeling ${selected}.`;
    }

    /**
     * Generate Need
     */
    generateNeed(category) {
        const templates = this.needTemplates[category];
        const selected = this.selectRandom(templates);
        return `You may need ${selected}.`;
    }

    /**
     * Generate Request
     */
    generateRequest(category) {
        const templates = this.requestTemplates[category];
        const selected = this.selectRandom(templates);
        return selected;
    }

    /**
     * Select random item from array
     */
    selectRandom(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Generate contextual interpretation
     */
    generateInterpretation(emotion, audioFeatures, text) {
        const features = audioFeatures || {};
        let interpretation = '';

        if (features.volume > 0.7) {
            interpretation += 'Your voice is quite loud, suggesting intensity. ';
        } else if (features.volume < 0.3) {
            interpretation += 'Your voice is quiet, suggesting restraint or uncertainty. ';
        }

        if (features.speechRate > 0.7) {
            interpretation += 'You\'re speaking quickly, indicating urgency or excitement. ';
        } else if (features.speechRate < 0.3) {
            interpretation += 'You\'re speaking slowly, suggesting thoughtfulness or heaviness. ';
        }

        if (features.expressiveness > 0.6) {
            interpretation += 'Your pitch variation shows emotional engagement. ';
        } else if (features.expressiveness < 0.3) {
            interpretation += 'Your delivery is relatively flat, which may indicate controlling emotion. ';
        }

        if (text.length > 0) {
            interpretation += `The content of your message aligns with feelings of ${emotion.emotions.slice(0, 2).join(' and ')}.`;
        }

        return interpretation.trim();
    }

    /**
     * Get emoji for emotion state
     */
    getEmotionEmoji(valence, arousal) {
        if (valence > 0.3 && arousal > 0.6) return '😄';
        if (valence > 0.3 && arousal <= 0.4) return '😌';
        if (valence > 0.3) return '😊';
        if (valence < -0.3 && arousal > 0.6) return '😠';
        if (valence < -0.3 && arousal <= 0.4) return '😢';
        if (valence < -0.3) return '😔';
        if (arousal > 0.6) return '😰';
        if (arousal <= 0.4) return '😐';
        return '🤔';
    }

    /**
     * Format confidence percentage
     */
    formatConfidence(confidence) {
        return `${Math.round(confidence * 100)}%`;
    }
}

// Create global instance
const nvcAgent = new NVCAgent();
