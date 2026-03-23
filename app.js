/**
 * app.js
 * Main application controller
 * Handles UI interactions and orchestrates emotion analysis
 */

class SubtextApp {
    constructor() {
        this.recordingDuration = 0;
        this.timerInterval = null;
        this.audioFeatures = null;
        this.emotion = null;
        this.nvcResult = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Audio controls
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.recordingTime = document.getElementById('recordingTime');
        this.recordingComplete = document.getElementById('recordingComplete');
        this.timer = document.getElementById('timer');

        // Text input
        this.textInput = document.getElementById('textInput');

        // Analyze button
        this.analyzeBtn = document.getElementById('analyzeBtn');

        // Features panel
        this.featuresPanel = document.getElementById('featuresPanel');
        this.volumeFill = document.getElementById('volumeFill');
        this.volumeValue = document.getElementById('volumeValue');
        this.pitchFill = document.getElementById('pitchFill');
        this.pitchValue = document.getElementById('pitchValue');
        this.rateFill = document.getElementById('rateFill');
        this.rateValue = document.getElementById('rateValue');
        this.expressFill = document.getElementById('expressFill');
        this.expressValue = document.getElementById('expressValue');

        // Emotion panel
        this.emotionPanel = document.getElementById('emotionPanel');
        this.emotionPoint = document.getElementById('emotionPoint');
        this.valenceValue = document.getElementById('valenceValue');
        this.arousalValue = document.getElementById('arousalValue');
        this.confidenceValue = document.getElementById('confidenceValue');

        // Results panel
        this.resultsPanel = document.getElementById('resultsPanel');
        this.nvcObservation = document.getElementById('nvcObservation');
        this.nvcFeeling = document.getElementById('nvcFeeling');
        this.nvcNeed = document.getElementById('nvcNeed');
        this.nvcRequest = document.getElementById('nvcRequest');

        // Clear button
        this.clearSection = document.getElementById('clearSection');
        this.clearBtn = document.getElementById('clearBtn');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.analyzeBtn.addEventListener('click', () => this.analyzeEmotion());
        this.clearBtn.addEventListener('click', () => this.resetApp());
    }

    /**
     * Start recording audio
     */
    async startRecording() {
        const success = await audioManager.startRecording();

        if (success) {
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.recordingTime.style.display = 'inline';
            this.recordingComplete.style.display = 'none';
            this.analyzeBtn.disabled = true;

            this.recordingDuration = 0;
            this.startTimer();

            console.log('Recording started...');
        }
    }

    /**
     * Stop recording audio
     */
    stopRecording() {
        const audioData = audioManager.stopRecording();
        this.stopTimer();

        this.recordBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.recordingTime.style.display = 'none';
        this.recordingComplete.style.display = 'inline';
        this.analyzeBtn.disabled = false;

        // Extract features
        this.audioFeatures = audioManager.extractFeatures(audioData);
        this.displayAudioFeatures();

        console.log('Recording stopped. Features:', this.audioFeatures);
    }

    /**
     * Start recording timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.recordingDuration++;
            this.timer.textContent = audioManager.formatTime(this.recordingDuration);
        }, 1000);
    }

    /**
     * Stop recording timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    /**
     * Display audio features on UI
     */
    displayAudioFeatures() {
        if (!this.audioFeatures) return;

        const norm = emotionInference.normalizeFeatures(this.audioFeatures);

        // Volume
        this.volumeFill.style.width = (norm.volume * 100) + '%';
        this.volumeValue.textContent = (norm.volume * 100).toFixed(0) + '%';

        // Pitch
        this.pitchFill.style.width = (norm.pitch * 100) + '%';
        this.pitchValue.textContent = this.audioFeatures.pitch.toFixed(0) + ' Hz';

        // Speech Rate
        this.rateFill.style.width = (norm.speechRate * 100) + '%';
        this.rateValue.textContent = (norm.speechRate * 100).toFixed(0) + '%';

        // Expressiveness
        this.expressFill.style.width = (norm.expressiveness * 100) + '%';
        this.expressValue.textContent = (norm.expressiveness * 100).toFixed(0) + '%';

        this.featuresPanel.style.display = 'block';
    }

    /**
     * Analyze emotion from audio + text
     */
    analyzeEmotion() {
        const text = this.textInput.value.trim();

        // Require either audio or text
        if (!this.audioFeatures && text.length === 0) {
            alert('Please record audio or enter text (or both) before analyzing.');
            return;
        }

        // Perform emotion inference
        this.emotion = emotionInference.inferEmotion(this.audioFeatures, text);

        // Generate NVC response
        this.nvcResult = nvcAgent.generateNVC(this.emotion, this.audioFeatures, text);

        // Display results
        this.displayEmotionState();
        this.displayNVCResults();
        this.displayClearButton();
    }

    /**
     * Display emotion state on 2D plane
     */
    displayEmotionState() {
        const { valence, arousal, confidence } = this.emotion;

        // Position on 2D plane (300x300, centered at 150,150)
        const x = 150 + (valence * 150); // valence: -1 to 1 → 0 to 300
        const y = 150 - (arousal * 150); // arousal: 0 to 1 → 150 to 0 (inverted for display)

        this.emotionPoint.style.left = x + 'px';
        this.emotionPoint.style.top = y + 'px';

        // Display values
        const valenceLabel = valence > 0 ? 'Positive' : valence < 0 ? 'Negative' : 'Neutral';
        const arousalLabel = arousal > 0.6 ? 'High Energy' : arousal < 0.4 ? 'Low Energy' : 'Balanced';

        this.valenceValue.textContent = `${valenceLabel} (${(valence * 100).toFixed(0)})`;
        this.arousalValue.textContent = `${arousalLabel} (${(arousal * 100).toFixed(0)})`;
        this.confidenceValue.textContent = `${(confidence * 100).toFixed(0)}%`;

        this.emotionPanel.style.display = 'block';

        console.log('Emotion State:', {
            valence: valence.toFixed(2),
            arousal: arousal.toFixed(2),
            confidence: confidence.toFixed(2)
        });
    }

    /**
     * Display NVC results
     */
    displayNVCResults() {
        const nvc = this.nvcResult;

        this.nvcObservation.textContent = nvc.observation;
        this.nvcFeeling.textContent = nvc.feeling;
        this.nvcNeed.textContent = nvc.need;
        this.nvcRequest.textContent = nvc.request;

        this.resultsPanel.style.display = 'block';

        console.log('NVC Generated:', nvc);
    }

    /**
     * Show clear/reset button
     */
    displayClearButton() {
        this.clearSection.style.display = 'block';
    }

    /**
     * Reset app to initial state
     */
    resetApp() {
        // Clear inputs
        this.textInput.value = '';

        // Hide panels
        this.featuresPanel.style.display = 'none';
        this.emotionPanel.style.display = 'none';
        this.resultsPanel.style.display = 'none';
        this.clearSection.style.display = 'none';
        this.recordingComplete.style.display = 'none';
        this.recordingTime.style.display = 'none';

        // Reset state
        this.audioFeatures = null;
        this.emotion = null;
        this.nvcResult = null;

        // Reset buttons
        this.recordBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.analyzeBtn.disabled = false;

        console.log('App reset');
    }
}

/**
 * Initialize app when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Subtext App Initializing...');
    const app = new SubtextApp();
    console.log('Subtext App Ready!');

    // For debugging: expose app globally
    window.subtextApp = app;
    window.audioManager = audioManager;
    window.emotionInference = emotionInference;
    window.nvcAgent = nvcAgent;
});

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
    audioManager.cleanup();
});
