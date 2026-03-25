/**
 * audio.js
 * Handles audio recording and feature extraction from audio signals
 */

class AudioManager {
        // Smooth features over a window (moving average)
        smoothAudioFeatures(windowSize = 10) {
            if (!this.audioBuffer || this.audioBuffer.length < windowSize) return this.extractAudioFeatures();
            // Take last N frames
            const windowFrames = this.audioBuffer.slice(-windowSize);
            return this.extractAudioFeatures(windowFrames);
        }
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.dataArray = null;
        this.isRecording = false;
        this.audioBuffer = [];
        this.recordingStartTime = null;
        this.timerInterval = null;
        
        // Speech recognition
        this.recognition = null;
        this.recognizedText = '';
        this.isListening = false;
        this.onTextRecognized = null;
        this.initializeSpeechRecognition();
    }

    /**
     * Initialize Web Speech API for speech-to-text
     */
    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('Speech recognition started');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update recognized text
            if (finalTranscript) {
                this.recognizedText += finalTranscript;
                if (this.onTextRecognized) {
                    this.onTextRecognized(this.recognizedText, false); // false = final
                }
            }

            // Show interim results real-time
            if (interimTranscript && this.onTextRecognized) {
                this.onTextRecognized(this.recognizedText + interimTranscript, true); // true = interim
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Speech recognition ended');
        };
    }

    /**
     * Initialize audio context and request microphone access
     */
    async initialize() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            
            source.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            return true;
        } catch (error) {
            console.error('Microphone access denied:', error);
            alert('Microphone access is required to use audio features.');
            return false;
        }
    }

    /**
     * Start recording audio
     */
    async startRecording() {
        if (!this.audioContext) {
            const initialized = await this.initialize();
            if (!initialized) return false;
        }

        this.isRecording = true;
        this.audioBuffer = [];
        this.recordingStartTime = Date.now();
        this.recognizedText = '';
        
        // Start speech recognition
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (e) {
                console.warn('Speech recognition already running or not available');
            }
        }
        
        // Start capturing audio data
        this.captureAudio();
        return true;
    }

    /**
     * Continuously capture audio data during recording
     */
    captureAudio() {
        if (!this.isRecording) return;

        const timeData = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(timeData);
        this.audioBuffer.push(new Uint8Array(timeData));

        // Capture at 30fps for smooth analysis
        requestAnimationFrame(() => this.captureAudio());
    }

    /**
     * Stop recording
     */
    stopRecording() {
        this.isRecording = false;
        
        // Stop speech recognition
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                console.warn('Error stopping speech recognition');
            }
        }
        
        return this.audioBuffer;
    }

    /**
     * Extract audio features from recorded data
     */
    extractAudioFeatures(audioBuffer = null) {
        const data = audioBuffer || this.audioBuffer;
        if (!data || data.length === 0) return null;

        // Flatten frames for some calculations
        const flat = data.flat();

        // RMS energy (volume)
        const energy = Math.min(this.calculateRMSEnergy(data) / 128, 1);

        // Pitch stats
        const pitchArr = this.getPitchArray(data);
        const pitchMean = pitchArr.length ? Math.min(this.mean(pitchArr) / 400, 1) : 0;
        const pitchVariance = pitchArr.length ? Math.min(this.variance(pitchArr) / (400*400), 1) : 0;

        // Speech rate
        const speechRate = Math.min(this.calculateSpeechRate(data) / 300, 1);

        // Pause ratio (frames with low energy)
        const pauseRatio = this.calculatePauseRatio(data);

        // Spectral centroid
        const spectralCentroid = this.calculateSpectralCentroid(data);

        return {
            energy,
            pitchMean,
            pitchVariance,
            speechRate,
            pauseRatio,
            spectralCentroid
        };
    }

    // Helper: get array of pitch values for each frame
    getPitchArray(audioData) {
        const arr = [];
        for (let i = 0; i < audioData.length; i++) {
            const pitch = this.estimatePitchFrame(audioData[i]);
            if (pitch > 0) arr.push(pitch);
        }
        return arr;
    }

    // Helper: mean
    mean(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // Helper: variance
    variance(arr) {
        const m = this.mean(arr);
        return arr.reduce((sum, n) => sum + Math.pow(n - m, 2), 0) / arr.length;
    }

    // Helper: pause ratio (frames with low energy)
    calculatePauseRatio(audioData) {
        let silent = 0;
        for (let i = 0; i < audioData.length; i++) {
            const frame = audioData[i];
            const rms = Math.sqrt(frame.reduce((sum, v) => sum + Math.pow((v / 128 - 1), 2), 0) / frame.length);
            if (rms < 0.05) silent++;
        }
        return audioData.length ? silent / audioData.length : 0;
    }

    // Helper: spectral centroid (brightness)
    calculateSpectralCentroid(audioData) {
        let totalCentroid = 0;
        let count = 0;
        for (let i = 0; i < audioData.length; i++) {
            const frame = audioData[i];
            let num = 0, denom = 0;
            for (let j = 0; j < frame.length; j++) {
                num += j * frame[j];
                denom += frame[j];
            }
            if (denom > 0) {
                // Normalize centroid to 0-1 (max bin = frame.length)
                totalCentroid += (num / denom) / frame.length;
                count++;
            }
        }
        return count ? Math.min(totalCentroid / count, 1) : 0;
    }

    /**
     * Calculate RMS (Root Mean Square) energy - proxy for volume
     */
    calculateRMSEnergy(audioData) {
        if (audioData.length === 0) return 0;

        let sum = 0;
        for (let sample of audioData) {
            // Get max value from each frame
            const normalized = sample[0] / 128 - 1;
            sum += normalized * normalized;
        }

        const rms = Math.sqrt(sum / audioData.length);
        return rms * 128; // Scale back
    }

    /**
     * Estimate fundamental frequency (pitch) using simplified autocorrelation
     */
    estimatePitch(audioData) {
        if (audioData.length < 2) return 0;

        // Use a simplified approach: analyze frequency content
        let peakFrequency = 0;
        let peakMagnitude = 0;

        // Sample analysis points
        const sampleSize = Math.min(audioData.length, 50);
        for (let i = 0; i < sampleSize; i++) {
            const frameData = audioData[i];
            if (!frameData) continue;

            // Find peaks in frequency range (roughly 80-400Hz)
            // Map to frequency bins (assuming 44.1kHz sample rate, 2048 FFT)
            const minBin = Math.floor((80 / 44100) * 2048);
            const maxBin = Math.floor((400 / 44100) * 2048);

            for (let j = minBin; j < maxBin && j < frameData.length; j++) {
                if (frameData[j] > peakMagnitude) {
                    peakMagnitude = frameData[j];
                    // Approximate frequency from bin
                    peakFrequency = (j / 2048) * 44100;
                }
            }
        }

        return Math.max(80, Math.min(400, peakFrequency)); // Constrain to voice range
    }

    /**
     * Calculate speech rate from amplitude variations
     */
    calculateSpeechRate(audioData) {
        if (audioData.length < 2) return 0;

        let crossings = 0;
        const threshold = 64; // Mid-point of 0-128 range

        // Count zero crossings (proxy for phoneme changes)
        for (let i = 1; i < Math.min(audioData.length, 100); i++) {
            const prev = audioData[i - 1][0];
            const curr = audioData[i][0];

            if ((prev < threshold && curr >= threshold) ||
                (prev >= threshold && curr < threshold)) {
                crossings++;
            }
        }

        // Estimate phonemes per second (typical: 5-10 phonemes/sec)
        return crossings * 6; // Rough scaling
    }

    /**
     * Calculate pitch variability (expressiveness/prosody)
     */
    calculateExpressiveness(audioData) {
        if (audioData.length < 2) return 0;

        const pitches = [];
        const sampleSize = Math.min(audioData.length, 30);

        // Sample pitches from frames
        for (let i = 0; i < sampleSize; i++) {
            const pitch = this.estimatePitchFrame(audioData[i]);
            if (pitch > 0) pitches.push(pitch);
        }

        // Calculate standard deviation as measure of variability
        if (pitches.length < 2) return 0.3;

        const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
        const variance = pitches.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / pitches.length;
        const stdDev = Math.sqrt(variance);

        // Normalize: higher variability = more expressive
        // Typical range: 20-80, normalize to 0-1
        return Math.min(stdDev / 100, 1);
    }

    /**
     * Estimate pitch from a single frame
     */
    estimatePitchFrame(frameData) {
        if (!frameData) return 0;

        let peakFreq = 0;
        let peakMag = 0;

        const minBin = Math.floor((80 / 44100) * 2048);
        const maxBin = Math.floor((400 / 44100) * 2048);

        for (let j = minBin; j < maxBin && j < frameData.length; j++) {
            if (frameData[j] > peakMag) {
                peakMag = frameData[j];
                peakFreq = (j / 2048) * 44100;
            }
        }

        return peakFreq;
    }

    /**
     * Get recording duration in seconds
     */
    getRecordingDuration() {
        if (!this.recordingStartTime) return 0;
        return (Date.now() - this.recordingStartTime) / 1000;
    }

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Cleanup audio resources
     */
    cleanup() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
}

// Create global instance
const audioManager = new AudioManager();
