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
        this.translationResult = null;
        this.analyzedText = null; // Text used for analysis (translated if needed)

        // NVC interpreter UI state
        this.nvcPanelOpen = false;

        // Chat prompts for rotating display
        this.chatPrompts = [
            "How do you feel?",
            "What's up?",
            "What happened?"
        ];
        this.currentPromptIndex = 0;

        // Initialize the processing pipeline
        this.pipeline = new SubtextPipeline();

        // State for interactive reference guide
        this.activeNvcField = null; // 'feeling' or 'need'
        this.fieldHasFocused = { feeling: false, need: false }; // Track first focus

        this.initializeElements();
        this.attachEventListeners();
        this.rotatePrompt();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Chat prompt
        this.chatPrompt = document.getElementById('chatPrompt');

        // Audio controls
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.recordingTime = document.getElementById('recordingTime');
        this.recordingComplete = document.getElementById('recordingComplete');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.timer = document.getElementById('timer');

        // Text input
        this.textInput = document.getElementById('textInput');

        // Translation panel
        this.translationPanel = document.getElementById('translationPanel');
        this.detectedLanguage = document.getElementById('detectedLanguage');
        this.translatedTextDisplay = document.getElementById('translatedTextDisplay');

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
        this.pauseRatioFill = document.getElementById('pauseRatioFill');
        this.pauseRatioValue = document.getElementById('pauseRatioValue');
        this.spectralCentroidFill = document.getElementById('spectralCentroidFill');
        this.spectralCentroidValue = document.getElementById('spectralCentroidValue');

        // Emotion panel
        this.emotionPanel = document.getElementById('emotionPanel');
        this.emotionPoint = document.getElementById('emotionPoint');
        this.emotionLabel = document.getElementById('emotionLabel');
        this.emotionInfoBtn = document.getElementById('emotionInfoBtn');
        this.valenceValue = document.getElementById('valenceValue');
        this.arousalValue = document.getElementById('arousalValue');

        // Results panel
        this.resultsPanel = document.getElementById('resultsPanel');
        this.nvcObservation = document.getElementById('nvcObservation');
        this.nvcFeeling = document.getElementById('nvcFeeling');
        this.nvcNeed = document.getElementById('nvcNeed');
        this.nvcRequest = document.getElementById('nvcRequest');
        this.toggleNvcBtn = document.getElementById('toggleNvcBtn');
        this.nvcToggleSection = document.getElementById('nvcToggleSection');

        // Clear button
        this.clearSection = document.getElementById('clearSection');
        this.clearBtn = document.getElementById('clearBtn');

        // Inline Start Over button (shown under Analyze after result)
        this.startOverInlineSection = document.getElementById('startOverInlineSection');
        this.startOverInlineBtn = document.getElementById('startOverInlineBtn');
    }

    /**
     * Rotate through chat prompts
     */
    rotatePrompt() {
        if (!this.chatPrompt) return;

        this.chatPrompt.textContent = this.chatPrompts[this.currentPromptIndex];
        this.currentPromptIndex = (this.currentPromptIndex + 1) % this.chatPrompts.length;

        // Rotate every 5 seconds
        setInterval(() => {
            if (this.chatPrompt) {
                this.chatPrompt.textContent = this.chatPrompts[this.currentPromptIndex];
                this.currentPromptIndex = (this.currentPromptIndex + 1) % this.chatPrompts.length;
            }
        }, 5000);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.analyzeBtn.addEventListener('click', () => this.analyzeEmotion());
        this.clearBtn.addEventListener('click', () => this.resetApp());

        if (this.startOverInlineBtn) {
            this.startOverInlineBtn.addEventListener('click', () => this.resetApp());
        }

        if (this.toggleNvcBtn) {
            this.toggleNvcBtn.addEventListener('click', () => this.toggleNvcInterpreter());
        }

        // Attach listeners to editable NVC fields
        this.nvcObservation.addEventListener('blur', (e) => this.handleNVCFieldEdit(e));
        this.nvcFeeling.addEventListener('blur', (e) => this.handleNVCFieldEdit(e));
        this.nvcNeed.addEventListener('blur', (e) => this.handleNVCFieldEdit(e));
        this.nvcRequest.addEventListener('blur', (e) => this.handleNVCFieldEdit(e));

        // Also handle immediate updates while typing (optional)
        this.nvcObservation.addEventListener('input', (e) => this.handleNVCFieldInput(e));
        this.nvcFeeling.addEventListener('input', (e) => this.handleNVCFieldInput(e));
        this.nvcNeed.addEventListener('input', (e) => this.handleNVCFieldInput(e));
        this.nvcRequest.addEventListener('input', (e) => this.handleNVCFieldInput(e));

        // Add focus listeners for interactive reference guide
        this.nvcFeeling.addEventListener('focus', () => this.handleNVCFieldFocus('feeling'));
        this.nvcNeed.addEventListener('focus', () => this.handleNVCFieldFocus('need'));

        // Track field blur to clear active field, unless reference modal is open
        this.nvcFeeling.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.referenceModal || this.referenceModal.style.display === 'none') {
                    if (this.activeNvcField === 'feeling') {
                        this.activeNvcField = null;
                    }
                }
            }, 150);
        });
        this.nvcNeed.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.referenceModal || this.referenceModal.style.display === 'none') {
                    if (this.activeNvcField === 'need') {
                        this.activeNvcField = null;
                    }
                }
            }, 150);
        });

        // Initialize explanation and reference features
        this.initializeExplanationFeatures();
        // Also initialize reference modal features for main page
        if (typeof initializeReferenceModalFeatures === 'function') {
            initializeReferenceModalFeatures();
        }
        this.initializeInteractiveReferenceGuide();
        this.initializeEmotionInfoModal();
    }

    /**
     * Start recording audio
     */
    async startRecording() {
        const success = await audioManager.startRecording();

        if (success) {
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.stopBtn.style.display = 'inline-block';
            this.recordingStatus.style.display = 'flex';
            this.recordingTime.style.display = 'inline';
            this.recordingComplete.style.display = 'none';
            this.analyzeBtn.disabled = true;

            this.recordingDuration = 0;
            this.startTimer();

            // Set up speech recognition callback
            audioManager.onTextRecognized = (text, isInterim) => {
                this.updateTextFromSpeech(text, isInterim);
            };

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
        this.stopBtn.style.display = 'none';
        this.recordingTime.style.display = 'none';
        // Always hide the red recording status row after stopping
        this.recordingStatus.style.display = 'none';
        this.recordingComplete.style.display = 'inline';
        this.analyzeBtn.disabled = false;

        // Extract features
        this.audioFeatures = audioManager.extractAudioFeatures(audioData);
        this.displayAudioFeatures();

        // Clear callback
        audioManager.onTextRecognized = null;

        console.log('Recording stopped. Features:', this.audioFeatures);
    }

    /**
     * Update text input with recognized speech
     */
    updateTextFromSpeech(text, isInterim) {
        if (isInterim) {
            // Show interim (grayed out) - just display the final recognized text
            // The interim is shown with a visual indicator
            this.textInput.value = text;
            // Optional: add a subtle style to show it's still being recognized
            this.textInput.style.opacity = '0.8';
        } else {
            // Final result - keep it
            this.textInput.value = text;
            this.textInput.style.opacity = '1';
        }
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
        // Energy
        this.volumeFill.style.width = (norm.energy * 100) + '%';
        this.volumeValue.textContent = (norm.energy * 100).toFixed(0) + '%';
        // Pitch Mean
        this.pitchFill.style.width = (norm.pitchMean * 100) + '%';
        this.pitchValue.textContent = (norm.pitchMean * 400).toFixed(0) + ' Hz';
        // Pitch Variance
        if (this.pitchVarianceValue) {
            this.pitchVarianceValue.textContent = (norm.pitchVariance * 100).toFixed(0) + '%';
        }
        // Speech Rate
        this.rateFill.style.width = (norm.speechRate * 100) + '%';
        this.rateValue.textContent = (norm.speechRate * 100).toFixed(0) + '%';
        // Pause Ratio
        if (this.pauseRatioFill) {
            this.pauseRatioFill.style.width = (norm.pauseRatio * 100) + '%';
        }
        if (this.pauseRatioValue) {
            this.pauseRatioValue.textContent = (norm.pauseRatio * 100).toFixed(0) + '%';
        }
        // Spectral Centroid
        if (this.spectralCentroidFill) {
            this.spectralCentroidFill.style.width = (norm.spectralCentroid * 100) + '%';
        }
        if (this.spectralCentroidValue) {
            this.spectralCentroidValue.textContent = (norm.spectralCentroid * 100).toFixed(0) + '%';
        }
        this.featuresPanel.style.display = 'block';
    }

    /**
     * Analyze emotion from audio + text
     */
    async analyzeEmotion() {
        const text = this.textInput.value.trim();
        console.log('[APP-DEBUG] analyzeEmotion called with text:', text);

        // Require either audio or text
        if (!this.audioFeatures && text.length === 0) {
            alert('Please record audio or enter text (or both) before analyzing.');
            return;
        }

        // Disable button during processing
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.textContent = '⏳ Translating & Analyzing...';

        try {
            console.log('[APP-DEBUG] Starting translation process...');
            
            // Translate text to English if needed
            let translationResult;
            try {
                translationResult = await translationManager.translateToEnglish(text);
                console.log('[APP-DEBUG] Translation promise resolved:', translationResult);
            } catch (translateError) {
                console.error('[APP-DEBUG] Translation error caught:', translateError);
                // Fallback: use original text
                translationResult = {
                    success: false,
                    original: text,
                    translated: text,
                    language: 'unknown',
                    isTranslated: false,
                    error: translateError.message
                };
            }
            
            this.translationResult = translationResult;
            this.analyzedText = this.translationResult.translated;

            console.log('[APP-DEBUG] Will analyze text:', this.analyzedText);
            console.log('[APP-DEBUG] Translation was:', this.translationResult.isTranslated);

            // Display translation if text was translated
            if (this.translationResult.isTranslated) {
                this.displayTranslation(this.translationResult);
            } else {
                this.translationPanel.style.display = 'none';
            }

            // Perform emotion inference using the English (translated) text
            console.log('[APP-DEBUG] Running emotion inference...');
            this.emotion = emotionInference.inferEmotion(this.audioFeatures, this.analyzedText);
            console.log('[APP-DEBUG] Emotion result:', this.emotion);

            // Generate NVC response using the pipeline
            // Pipeline Stage 1: Analyze emotional tone from audio
            // Pipeline Stage 2: Transform text to NVC structure
            console.log('[APP-DEBUG] Processing through pipeline...');
            const pipelineResult = this.pipeline.process(
                this.emotion,
                this.audioFeatures,
                this.analyzedText,
                this.analyzedText
            );
            
            this.nvcResult = pipelineResult.stage2.data;
            console.log('[APP-DEBUG] Pipeline complete:', pipelineResult);

            // Display results
            this.displayEmotionState();
            this.displayNVCResults();
            this.displayClearButton();
        } catch (error) {
            console.error('[APP-DEBUG] Overall error:', error);
            alert('Error during analysis. Please try again.');
        } finally {
            // Re-enable button
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = '✨ Analyze';
        }
    }

    /**
     * Display translation information
     */
    displayTranslation(translationResult) {
        if (!translationResult.isTranslated) {
            this.translationPanel.style.display = 'none';
            console.log('[App] No translation needed');
            return;
        }

        const langName = translationManager.getLanguageName(translationResult.language);
        
        this.detectedLanguage.textContent = langName;
        this.translatedTextDisplay.textContent = translationResult.translated;
        this.translationPanel.style.display = 'block';

        console.log('[App] Translation displayed:', {
            original: translationResult.original,
            translated: translationResult.translated,
            language: translationResult.language,
            languageName: langName
        });
    }

    /**
     * Display emotion state on 2D plane
     */
    displayEmotionState() {
        const { valence, arousal, label, description } = this.emotion;
        // Position on 2D plane (300x300, centered at 150,150)
        const x = 150 + (valence * 150); // valence: -1 to 1 → 0 to 300
        const y = 150 - (arousal * 150); // arousal: 0 to 1 → 150 to 0 (inverted for display)
        this.emotionPoint.style.left = x + 'px';
        this.emotionPoint.style.top = y + 'px';
        // Display only the emotion label as 'Current Emotion: <label>'
        this.emotionLabel.textContent = `Current Emotion: ${label}`;
        // Display values
        const valenceLabel = valence > 0 ? 'Positive' : valence < 0 ? 'Negative' : 'Neutral';
        const arousalLabel = arousal > 0.6 ? 'High Energy' : arousal < 0.4 ? 'Low Energy' : 'Balanced';
        this.valenceValue.textContent = `${valenceLabel} (${(valence * 100).toFixed(0)})`;
        this.arousalValue.textContent = `${arousalLabel} (${(arousal * 100).toFixed(0)})`;
        this.emotionPanel.style.display = 'block';
        console.log('Emotion State:', {
            valence: valence.toFixed(2),
            arousal: arousal.toFixed(2),
            label,
            description
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

        // Update visual hints for fields with fallback messages
        this.updateNVCFieldHints();

        // Set up toggle control for NVC interpreter UI
        if (this.toggleNvcBtn && this.nvcToggleSection) {
            this.nvcToggleSection.style.display = 'flex';
            this.toggleNvcBtn.textContent = this.nvcPanelOpen ? '🦒 Close NVC Interpreter' : '🦒 Open NVC Interpreter';
        }

        // Show/hide NVC panel based on user choice
        this.resultsPanel.style.display = this.nvcPanelOpen ? 'block' : 'none';

        console.log('NVC Generated:', nvc, 'NVC panel open:', this.nvcPanelOpen);
    }

    /**
     * Toggle NVC interpreter panel open/closed
     */
    toggleNvcInterpreter() {
        this.nvcPanelOpen = !this.nvcPanelOpen;

        if (this.nvcPanelOpen) {
            this.resultsPanel.style.display = 'block';
            this.toggleNvcBtn.textContent = '🦒 Close NVC Interpreter';
        } else {
            this.resultsPanel.style.display = 'none';
            this.toggleNvcBtn.textContent = '🦒 Open NVC Interpreter';
        }

        // Keep emotion panel visible always by default
        this.emotionPanel.style.display = 'block';
    }

    /**
     * Update visual hints for fields with "No clear X" messages
     */
    updateNVCFieldHints() {
        const fields = [
            { element: this.nvcObservation, fallback: 'No clear observation' },
            { element: this.nvcFeeling, fallback: 'No clear feeling' },
            { element: this.nvcNeed, fallback: 'No clear need' },
            { element: this.nvcRequest, fallback: 'No clear request' }
        ];

        fields.forEach(({ element, fallback }) => {
            if (element.textContent.trim() === fallback) {
                element.classList.add('field-placeholder');
            } else {
                element.classList.remove('field-placeholder');
            }
        });
    }

    /**
     * User edits observation - request auto-updates
     */
    editNVCObservation(newObservation) {
        console.log('[App] User editing observation:', newObservation);
        const updated = this.pipeline.editObservation(newObservation);
        this.nvcResult = updated;
        this.displayNVCResults();
    }

    /**
     * User edits feeling - need and request auto-update
     */
    editNVCFeeling(newFeeling) {
        console.log('[App] User editing feeling:', newFeeling);
        const updated = this.pipeline.editFeeling(newFeeling);
        this.nvcResult = updated;
        this.displayNVCResults();
    }

    /**
     * User edits need - request auto-updates
     */
    editNVCNeed(newNeed) {
        console.log('[App] User editing need:', newNeed);
        const updated = this.pipeline.editNeed(newNeed);
        this.nvcResult = updated;
        this.displayNVCResults();
    }

    /**
     * User edits request - manual edit, doesn't trigger auto-updates
     */
    editNVCRequest(newRequest) {
        console.log('[App] User editing request:', newRequest);
        if (this.nvcResult) {
            this.nvcResult.request = newRequest;
            this.displayNVCResults();
        }
    }

    /**
     * Handle NVC field blur event - calls appropriate edit method
     */
    handleNVCFieldEdit(event) {
        const field = event.target.getAttribute('data-field');
        const newValue = event.target.textContent.trim();

        if (!newValue) return; // Don't update if empty

        console.log('[App] NVC field edited:', field, newValue);

        if (field === 'observation') {
            this.editNVCObservation(newValue);
        } else if (field === 'feeling') {
            this.editNVCFeeling(newValue);
        } else if (field === 'need') {
            this.editNVCNeed(newValue);
        } else if (field === 'request') {
            this.editNVCRequest(newValue);
        }
    }

    /**
     * Handle NVC field input event - live updates while typing
     */
    handleNVCFieldInput(event) {
        const field = event.target.getAttribute('data-field');
        const newValue = event.target.textContent.trim();

        if (!newValue) return;

        // For feeling field, only update if it's a valid feeling
        if (field === 'feeling') {
            if (!this.pipeline.nvc.FEELING_LIST.includes(newValue.toLowerCase())) {
                return; // Don't update if not a valid feeling
            }
        }

        console.log('[App] NVC field live update:', field);
        
        // Update immediately without waiting for blur
        if (field === 'observation') {
            this.editNVCObservation(newValue);
        } else if (field === 'feeling') {
            this.editNVCFeeling(newValue);
        } else if (field === 'need') {
            this.editNVCNeed(newValue);
        } else if (field === 'request') {
            this.editNVCRequest(newValue);
        }
    }

    /**
     * Show clear/reset button
     */
    displayClearButton() {
        if (this.clearSection) {
            this.clearSection.style.display = 'block';
        }
        if (this.startOverInlineSection) {
            this.startOverInlineSection.style.display = 'block';
        }
    }

    /**
     * Reset app to initial state
     */
    resetApp() {
        // Clear inputs
        this.textInput.value = '';
        this.textInput.style.opacity = '1';

        // Hide panels
        this.featuresPanel.style.display = 'none';
        this.emotionPanel.style.display = 'none';
        this.resultsPanel.style.display = 'none';
        this.recordingStatus.style.display = 'none';
        this.translationPanel.style.display = 'none';
        this.clearSection.style.display = 'none';
        this.nvcToggleSection.style.display = 'none';
        this.recordingComplete.style.display = 'none';
        this.recordingTime.style.display = 'none';
        if (this.startOverInlineSection) {
            this.startOverInlineSection.style.display = 'none';
        }

        // Reset state
        this.audioFeatures = null;
        this.emotion = null;
        this.nvcResult = null;
        this.translationResult = null;
        this.analyzedText = null;
        this.nvcPanelOpen = false;

        if (this.toggleNvcBtn) {
            this.toggleNvcBtn.style.display = 'none';
            this.toggleNvcBtn.textContent = '🦒 Open NVC Interpreter';
        }

        // Reset pipeline
        this.pipeline.reset();

        // Clear speech recognition callback
        audioManager.onTextRecognized = null;

        // Reset buttons
        this.recordBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.analyzeBtn.disabled = false;

        console.log('App reset');
    }

    /**
     * Initialize explanations and reference guide features
     */
    initializeExplanationFeatures() {
        // Initialize reference database
        this.nvcReference = new NVCReference();

        // Get modal elements
        this.explanationModal = document.getElementById('explanationModal');
        this.referenceModal = document.getElementById('referenceModal');
        this.closeExplanationBtn = document.getElementById('closeExplanation');
        this.closeReferenceBtn = document.getElementById('closeReference');
        this.referenceBtn = document.getElementById('referenceBtn');

        // Attach explanation button listeners
        const explanationBtns = document.querySelectorAll('.explanation-btn');
        explanationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const component = btn.getAttribute('data-component');
                this.showExplanation(component);
            });
        });

        // Reference page button
        if (this.referenceBtn) {
            this.referenceBtn.addEventListener('click', () => this.showReference());
        }

        // Close buttons
        this.closeExplanationBtn.addEventListener('click', () => this.closeExplanation());
        this.closeReferenceBtn.addEventListener('click', () => this.closeReference());

        // Close on background click
        this.explanationModal.addEventListener('click', (e) => {
            if (e.target === this.explanationModal) {
                this.closeExplanation();
            }
        });

        this.referenceModal.addEventListener('click', (e) => {
            if (e.target === this.referenceModal) {
                this.closeReference();
            }
        });

        // Reference modal tabs
        const referenceTabBtns = document.querySelectorAll('.reference-tab-btn');
        referenceTabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchReferenceTab(e.target.getAttribute('data-tab')));
        });

        // Search inputs
        const feelingsSearch = document.getElementById('feelingsSearch');
        const needsSearch = document.getElementById('needsSearch');

        if (feelingsSearch) {
            feelingsSearch.addEventListener('input', (e) => this.filterFeelings(e.target.value));
        }
        if (needsSearch) {
            needsSearch.addEventListener('input', (e) => this.filterNeeds(e.target.value));
        }

        // Initialize reference content on first load
        this.renderFeelingsList();
        this.renderNeedsList();

        console.log('Explanation features initialized');
    }

    /**
     * Show explanation modal for a component
     */
    showExplanation(component) {
        const explanation = this.nvcReference.getComponentExplanation(component);
        if (!explanation) {
            console.warn('No explanation found for component:', component);
            return;
        }

        const explanationContent = document.getElementById('explanationContent');
        
        let html = `
            <div class="explanation-title">
                <span class="explanation-icon">${explanation.icon}</span>
                <span>${explanation.title}</span>
            </div>

            <div class="explanation-section">
                <p class="section-content">${explanation.description}</p>
            </div>

            <div class="explanation-section">
                <div class="section-label">What it means</div>
                <p class="section-content">${explanation.details}</p>
            </div>

            <div class="explanation-section">
                <div class="section-label">Why it matters</div>
                <p class="section-content">${explanation.why}</p>
            </div>

            <div class="explanation-section">
                <div class="example bad">${explanation.example_bad}</div>
                <div class="example good">${explanation.example_good}</div>
            </div>
        `;

        explanationContent.innerHTML = html;
        
        this.explanationModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close explanation modal
     */
    closeExplanation() {
        this.explanationModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * Show reference guide modal
     */
    showReference() {
        this.referenceModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close reference modal
     */
    closeReference() {
        this.referenceModal.style.display = 'none';
        document.body.style.overflow = '';
        this.activeNvcField = null;
    }

    /**
     * Switch reference tabs (feelings vs needs)
     */
    switchReferenceTab(tabName) {
        // Hide all sections
        const sections = document.querySelectorAll('.reference-section');
        sections.forEach(s => s.classList.remove('active'));

        // Deactivate all tabs
        const tabs = document.querySelectorAll('.reference-tab-btn');
        tabs.forEach(t => t.classList.remove('active'));

        // Show selected section
        const selectedSection = document.getElementById(tabName + 'Tab');
        if (selectedSection) {
            selectedSection.classList.add('active');
        }

        // Activate selected tab
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
    }

    /**
     * Render feelings list in reference
     */
    renderFeelingsList(feelingsList = null) {
        const container = document.getElementById('feelingsContainer');
        if (!container) return;

        const feelings = feelingsList || this.nvcReference.getFeelingsByCategory();
        let html = '';

        for (const [key, categoryData] of Object.entries(feelings)) {
            html += `
                <div class="reference-category">
                    <div class="category-header">
                        <div class="category-header-title">${categoryData.title}</div>
                        <div class="category-header-description">${categoryData.description}</div>
                    </div>
                    <div class="category-content">
                        <div class="entry-list">
                            ${categoryData.feelings.map(feeling => `
                                <div class="entry-item" data-type="feeling" data-value="${feeling.word}" data-selectable="true">
                                    <div class="entry-word">${feeling.word}</div>
                                    <div class="entry-definition">${feeling.definition}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        this.initializeInteractiveReferenceGuide();
    }

    /**
     * Render needs list in reference
     */
    renderNeedsList(needsList = null) {
        const container = document.getElementById('needsContainer');
        if (!container) return;

        const needs = needsList || this.nvcReference.getNeedsByCategory();
        let html = '';

        for (const [key, categoryData] of Object.entries(needs)) {
            html += `
                <div class="reference-category">
                    <div class="category-header">
                        <div class="category-header-icon">${categoryData.icon}</div>
                        <div>
                            <div class="category-header-title">${categoryData.category}</div>
                            <div class="category-header-description">${categoryData.description}</div>
                        </div>
                    </div>
                    <div class="category-content">
                        <div class="entry-list">
                            ${categoryData.needs.map(need => `
                                <div class="entry-item" data-type="need" data-value="${need.name}" data-selectable="true">
                                    <div class="entry-word">${need.name}</div>
                                    <div class="entry-definition">${need.definition}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        this.initializeInteractiveReferenceGuide();
    }

    /**
     * Filter feelings list by search term
     */
    filterFeelings(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderFeelingsList();
            return;
        }

        const results = this.nvcReference.searchFeelings(searchTerm);
        
        if (results.length === 0) {
            const container = document.getElementById('feelingsContainer');
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">No feelings found matching "' + searchTerm + '"</p>';
            return;
        }

        let html = '';
        for (const result of results) {
            html += `
                <div class="reference-category">
                    <div class="category-header">
                        <div class="category-header-title">${result.category}</div>
                    </div>
                    <div class="category-content">
                        <div class="entry-list">
                            ${result.feelings.map(feeling => `
                                <div class="entry-item" data-type="feeling" data-value="${feeling.word}" data-selectable="true">
                                    <div class="entry-word">${feeling.word}</div>
                                    <div class="entry-definition">${feeling.definition}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        const container = document.getElementById('feelingsContainer');
        container.innerHTML = html;
        this.initializeInteractiveReferenceGuide();
    }

    /**
     * Filter needs list by search term
     */
    filterNeeds(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderNeedsList();
            return;
        }

        const results = this.nvcReference.searchNeeds(searchTerm);
        
        if (results.length === 0) {
            const container = document.getElementById('needsContainer');
            container.innerHTML = '<p style="color: var(--text-secondary); padding: 2rem; text-align: center;">No needs found matching "' + searchTerm + '"</p>';
            return;
        }

        let html = '';
        for (const result of results) {
            html += `
                <div class="reference-category">
                    <div class="category-header">
                        <div class="category-header-icon">${result.icon}</div>
                        <div>
                            <div class="category-header-title">${result.category}</div>
                        </div>
                    </div>
                    <div class="category-content">
                        <div class="entry-list">
                            ${result.needs.map(need => `
                                <div class="entry-item" data-type="need" data-value="${need.name}" data-selectable="true">
                                    <div class="entry-word">${need.name}</div>
                                    <div class="entry-definition">${need.definition}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        const container = document.getElementById('needsContainer');
        container.innerHTML = html;
        this.initializeInteractiveReferenceGuide();
    }

    /**
     * ===== INTERACTIVE REFERENCE GUIDE METHODS =====
     */

    /**
     * Handle focus on Feeling or Need field
     * Auto-open reference guide on first focus, track active field
     */
    handleNVCFieldFocus(fieldType) {
        this.activeNvcField = fieldType;

        // Only auto-open on first focus
        if (!this.fieldHasFocused[fieldType]) {
            this.fieldHasFocused[fieldType] = true;
            this.showReferenceForField(fieldType);
        }
    }

    /**
     * Show reference guide and navigate to correct tab for the field
     */
    showReferenceForField(fieldType) {
        // Open the modal
        this.showReference();

        // Switch to the appropriate tab
        if (fieldType === 'feeling') {
            this.switchReferenceTab('feelings');
        } else if (fieldType === 'need') {
            this.switchReferenceTab('needs');
        }
    }

    /**
     * Initialize interactive handlers for reference items
     * Called after rendering feelings or needs lists
     */
    initializeInteractiveReferenceGuide() {
        // Find all selectable items
        const selectableItems = document.querySelectorAll('[data-selectable="true"]');

        selectableItems.forEach(item => {
            // Remove existing listener to avoid duplicates
            item.style.cursor = 'pointer';

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemType = item.getAttribute('data-type');
                const itemValue = item.getAttribute('data-value');

                if (itemType === 'feeling' && this.activeNvcField === 'feeling') {
                    this.selectReferenceItem(itemType, itemValue);
                } else if (itemType === 'need' && this.activeNvcField === 'need') {
                    this.selectReferenceItem(itemType, itemValue);
                }
            });

            // Hover feedback
            item.addEventListener('mouseenter', () => {
                if ((item.getAttribute('data-type') === 'feeling' && this.activeNvcField === 'feeling') ||
                    (item.getAttribute('data-type') === 'need' && this.activeNvcField === 'need')) {
                    item.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
                }
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
            });
        });
    }

    /**
     * Select an item from the reference guide and insert into active field
     */
    selectReferenceItem(itemType, itemValue) {
        let targetField = null;

        // Determine which field to update
        if (itemType === 'feeling' && this.activeNvcField === 'feeling') {
            targetField = this.nvcFeeling;
        } else if (itemType === 'need' && this.activeNvcField === 'need') {
            targetField = this.nvcNeed;
        }

        if (!targetField) return;

        // Insert the value into the field
        targetField.textContent = itemValue;

        // Highlight the selected item
        this.highlightSelectedItem(itemType, itemValue);

        // Update field hints
        this.updateNVCFieldHints();

        // Trigger edit event to update the NVC result
        const editEvent = new Event('blur', { bubbles: true });
        targetField.dispatchEvent(editEvent);

        // Close the modal after a brief delay for visual feedback
        setTimeout(() => {
            this.closeReference();
        }, 200);
    }

    /**
     * Highlight the selected item in the reference guide
     */
    highlightSelectedItem(itemType, itemValue) {
        // Clear previous highlights
        const allItems = document.querySelectorAll('[data-selectable="true"]');
        allItems.forEach(item => {
            item.classList.remove('selected-reference-item');
            item.style.borderLeft = '';
        });

        // Highlight the selected item
        const selectedItem = document.querySelector(`[data-type="${itemType}"][data-value="${itemValue}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected-reference-item');
            selectedItem.style.borderLeft = '4px solid var(--primary-color)';
            selectedItem.style.paddingLeft = 'calc(0.75rem - 4px)';
            selectedItem.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        }
    }

    /**
     * Initialize emotion information modal
     */
    initializeEmotionInfoModal() {
        this.emotionInfoModal = document.getElementById('emotionInfoModal');
        const closeEmotionInfoBtn = document.getElementById('closeEmotionInfo');

        if (!this.emotionInfoBtn || !this.emotionInfoModal) {
            console.warn('Emotion info modal elements not found');
            return;
        }

        // Show modal when info button is clicked
        this.emotionInfoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEmotionInfo();
        });

        // Close button
        closeEmotionInfoBtn.addEventListener('click', () => this.closeEmotionInfo());

        // Close on background click
        this.emotionInfoModal.addEventListener('click', (e) => {
            if (e.target === this.emotionInfoModal) {
                this.closeEmotionInfo();
            }
        });

        console.log('Emotion info modal initialized');
    }

    /**
     * Show emotion information modal
     */
    showEmotionInfo() {
        const emotionInfoContent = document.getElementById('emotionInfoContent');

        const html = `
            <div class="explanation-title">
                <span class="explanation-icon">😊</span>
                <span>Understanding Your Emotional State</span>
            </div>

            <div class="explanation-section">
                <div class="section-label">Russell's Circumplex Model</div>
                <p class="section-content">
                    Your emotional state is mapped on a 2D space based on two dimensions:
                </p>
            </div>

            <div class="explanation-section">
                <div class="subsection-label"><strong>Valence (Positive ↔ Negative)</strong></div>
                <p class="section-content">
                    How positive or negative the emotion is.<br/>
                    <span class="text-muted">• Positive: Happiness, joy, contentment, excitement</span><br/>
                    <span class="text-muted">• Negative: Sadness, anger, frustration, anxiety</span>
                </p>
            </div>

            <div class="explanation-section">
                <div class="subsection-label"><strong>Arousal (Low Energy ↔ High Energy)</strong></div>
                <p class="section-content">
                    How energized or calm you feel.<br/>
                    <span class="text-muted">• High Energy: Alert, excited, tense, active</span><br/>
                    <span class="text-muted">• Low Energy: Calm, peaceful, tired, relaxed</span>
                </p>
            </div>

            <div class="explanation-section">
                <div class="section-label">Emotion Quadrants</div>
                <div class="example">
                    <strong>📍 Top-Right (Excited):</strong> Positive + High Energy<br/>
                    <em>Example: Joy, excitement, enthusiasm, confidence</em>
                </div>
                <div class="example">
                    <strong>📍 Top-Left (Tense):</strong> Negative + High Energy<br/>
                    <em>Example: Anger, frustration, anxiety, tension</em>
                </div>
                <div class="example">
                    <strong>📍 Bottom-Left (Low):</strong> Negative + Low Energy<br/>
                    <em>Example: Sadness, melancholy, despair, resignation</em>
                </div>
                <div class="example">
                    <strong>📍 Bottom-Right (Calm):</strong> Positive + Low Energy<br/>
                    <em>Example: Calmness, contentment, serenity, peace</em>
                </div>
            </div>

            <div class="explanation-section">
                <div class="section-label">How Emotions Are Detected</div>
                <p class="section-content">
                    Subtext analyzes both audio features (tone, pace, pitch, volume) and text content 
                    to infer your emotional state. This allows for deeper understanding of what's 
                    really being communicated beyond just the words.
                </p>
            </div>

            <div class="explanation-section">
                <div class="section-label">Why Emotions Matter</div>
                <p class="section-content">
                    Understanding emotions is key to Nonviolent Communication (NVC). Behind every 
                    emotion lies an unmet need. By recognizing what you're feeling, you can better 
                    identify what you truly need and communicate it clearly to others.
                </p>
            </div>
        `;

        emotionInfoContent.innerHTML = html;

        this.emotionInfoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close emotion information modal
     */
    closeEmotionInfo() {
        this.emotionInfoModal.style.display = 'none';
        document.body.style.overflow = '';
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
