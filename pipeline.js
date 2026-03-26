/**
 * pipeline.js
 * Subtext Processing Pipeline
 * Orchestrates the flow: audio analysis → emotion interpretation → NVC transformation
 * 
 * Pipeline:
 * Input (voice + text) 
 *   → agent.js (emotion/tone/reflection) 
 *   → nvc.js (structure + editable NVC) 
 *   → Output (editable components with auto-updating request)
 */

class SubtextPipeline {
    constructor() {
        this.agent = new NVCAgent();
        this.nvc = new NVCFramework();
        
        // Store intermediate results
        this.audioAnalysis = null;
        this.emotionalInterpretation = null;
        this.nvcOutput = null;
    }

    /**
     * STAGE 1: Analyze emotional tone and audio features
     * Interprets what's happening internally
     * 
     * @param {object} emotion - { valence, arousal, confidence }
     * @param {object} audioFeatures - { volume, pitch, speechRate, expressiveness }
     * @param {string} text - Transcribed text from voice
     * @returns {object} - Agent's emotional interpretation
     */
    analyzeEmotionalTone(emotion, audioFeatures, text) {
        console.log('[Pipeline] Stage 1: Analyzing emotional tone...');
        
        this.audioAnalysis = {
            emotion,
            audioFeatures,
            transcribedText: text
        };

        // Get agent's interpretation of emotional state
        this.emotionalInterpretation = this.agent.generateNVC(emotion, audioFeatures, text);
        
        console.log('[Pipeline] Emotional interpretation:', this.emotionalInterpretation);
        return this.emotionalInterpretation;
    }

    /**
     * STAGE 2: Transform into structured NVC framework
     * Takes the emotional analysis and user text, produces editable NVC
     * 
     * @param {string} userText - User's original text input (not transcribed speech)
     * @returns {object} - Structured, editable NVC framework
     */
    async transformToNVC(userText) {
        console.log('[Pipeline] Stage 2: Transforming to NVC structure...');

        let nvcOutput;

        if (typeof extractNVCWithFallback === 'function') {
            try {
                nvcOutput = await extractNVCWithFallback(userText);
                console.log('Using LLM NVC:', nvcOutput);

                if (!isValidNVC(nvcOutput)) {
                    console.warn('[Pipeline] LLM NVC invalid, falling back to rule-based NVCFramework', nvcOutput);
                    nvcOutput = this.nvc.process(userText);
                }
            } catch (error) {
                console.error('[Pipeline] LLM NVC extraction failed, falling back to rule-based NVCFramework', error);
                nvcOutput = this.nvc.process(userText);
            }
        } else {
            console.warn('[Pipeline] extractNVCWithFallback not available, using rule-based NVCFramework');
            nvcOutput = this.nvc.process(userText);
        }

        this.nvcOutput = nvcOutput;
        console.log('[Pipeline] NVC output:', this.nvcOutput);
        return this.nvcOutput;
    }

    /**
     * FULL PIPELINE: Voice + Text → Emotion → NVC
     * All-in-one method for complete processing
     * 
     * @param {object} emotion - Emotional metrics
     * @param {object} audioFeatures - Audio metrics
     * @param {string} transcribedText - Speech-to-text output
     * @param {string} userText - User's text input (or same as transcribed)
     * @returns {object} - Complete pipeline output
     */
    async process(emotion, audioFeatures, transcribedText, userText) {
        console.log('[Pipeline] Starting full pipeline...');
        
        // Stage 1: Interpret emotions from audio
        const interpretation = this.analyzeEmotionalTone(
            emotion,
            audioFeatures,
            transcribedText
        );
        
        // Stage 2: Transform user text to NVC
        const nvc = await this.transformToNVC(userText || transcribedText);
        
        // Return complete state
        const output = {
            stage1: {
                name: 'Emotional Interpretation',
                data: interpretation
            },
            stage2: {
                name: 'NVC Structure',
                data: nvc
            },
            isComplete: this.nvc.isComplete()
        };
        
        console.log('[Pipeline] Pipeline complete:', output);
        return output;
    }

    /**
     * STAGE 3: User Edits
     * User edits observation, feeling, or need → request auto-updates
     */
    editObservation(newObservation) {
        console.log('[Pipeline] User editing observation...');
        this.nvc.setObservation(newObservation);
        return this.nvc.getOutput();
    }

    editFeeling(newFeeling) {
        console.log('[Pipeline] User editing feeling...');
        this.nvc.setFeeling(newFeeling);
        return this.nvc.getOutput();
    }

    editNeed(newNeed) {
        console.log('[Pipeline] User editing need...');
        this.nvc.setNeed(newNeed);
        return this.nvc.getOutput();
    }

    /**
     * Reset entire pipeline
     */
    reset() {
        this.audioAnalysis = null;
        this.emotionalInterpretation = null;
        this.nvcOutput = null;
        this.nvc.reset();
    }

    /**
     * Get current state of NVC components
     */
    getNVCOutput() {
        return this.nvc.getOutput();
    }

    /**
     * Get formatted output for UI display
     */
    getFormattedOutput() {
        return this.nvc.getFormattedOutput();
    }

    /**
     * Get both interpretation and NVC together
     */
    getFullOutput() {
        return {
            interpretation: this.emotionalInterpretation,
            nvc: this.nvc.getOutput(),
            isComplete: this.nvc.isComplete()
        };
    }
}

// Self-contained demo showing the pipeline in action
function demonstratePipeline() {
    const pipeline = new SubtextPipeline();
    
    console.log('========== SUBTEXT PIPELINE DEMO ==========\n');
    
    // Simulate user input
    const emotion = { valence: -0.7, arousal: 0.8, confidence: 0.85 };
    const audioFeatures = { volume: 0.75, pitch: 0.65, speechRate: 1.2, expressiveness: 0.9 };
    const userText = "I see socks everywhere I'm so angry";
    
    console.log('Input:', { emotion, audioFeatures, userText });
    console.log('\n');
    
    // Run full pipeline
    const result = pipeline.process(emotion, audioFeatures, userText, userText);
    
    console.log('\n========== OUTPUT STRUCTURE ==========\n');
    console.log('STAGE 1 - Emotional Interpretation (what is happening internally):');
    console.log(result.stage1.data);
    
    console.log('\nSTAGE 2 - NVC Structure (how to express it clearly):');
    console.log(result.stage2.data);
    
    // Demonstrate editing
    console.log('\n========== USER EDITS ==========\n');
    console.log('User refines observation...');
    let edited = pipeline.editObservation('There are socks scattered in the living room and bedroom');
    console.log('After edit:', edited);
    
    console.log('\nUser changes feeling to "frustrated"...');
    edited = pipeline.editFeeling('frustrated');
    console.log('After edit:', edited);
    
    console.log('\nFinal NVC output:\n', pipeline.getFormattedOutput());
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubtextPipeline;
}
