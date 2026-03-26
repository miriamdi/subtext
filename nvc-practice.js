/**
 * nvc-practice.js
 * Interactive NVC practice tool
 * Uses local NVC framework for analysis
 */

class NVCPractice {
    constructor() {
        this.nvc = new NVCFramework(); // Use existing NVC framework
        this.currentResult = null;
        this.apiKey = null; // Will try free options first
        this.chatHistory = [];

        this.nvcReference = new NVCReference();
        this.initializeElements();
        this.attachEventListeners();
        // No reference modal initialization in practice page
    }
    // No reference modal logic in practice page

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Input elements
        this.practiceInput = document.getElementById('practiceInput');
        this.practiceBtn = document.getElementById('practiceBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');

        // Results panel
        this.resultsPanel = document.getElementById('resultsPanel');
        this.nvcObservation = document.getElementById('nvcObservation');
        this.nvcFeeling = document.getElementById('nvcFeeling');
        this.nvcNeed = document.getElementById('nvcNeed');
        this.nvcRequest = document.getElementById('nvcRequest');

        // Action buttons
        this.clearResultsBtn = document.getElementById('clearResultsBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Chat UI elements
        this.chatContainer = document.getElementById('chatContainer');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');

        // Alerts
        this.errorAlert = document.getElementById('errorAlert');
        this.errorMessage = document.getElementById('errorMessage');
        this.successAlert = document.getElementById('successAlert');
        this.successMessage = document.getElementById('successMessage');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {

        if (this.practiceBtn) {
            this.practiceBtn.addEventListener('click', () => this.analyzeExpression());
        }
        if (this.clearResultsBtn) {
            this.clearResultsBtn.addEventListener('click', () => this.clearResults());
        }
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadAsText());
        }

        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        }

        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.handleSendMessage();
                }
            });
        }

        // Make NVC fields editable with proper event handlers
        this.makeFieldEditable(this.nvcObservation, 'observation');
        this.makeFieldEditable(this.nvcFeeling, 'feeling');
        this.makeFieldEditable(this.nvcNeed, 'need');
        this.makeFieldEditable(this.nvcRequest, 'request');

        // Initialize explanation features
        this.initializeExplanationModal();
    }

    /**
     * Make a field editable with visual feedback
     * @param {HTMLElement} fieldElement - The DOM element
     * @param {string} fieldName - The field name
     */
    makeFieldEditable(fieldElement, fieldName) {
        // Make the field focusable
        fieldElement.addEventListener('click', () => {
            fieldElement.focus();
            // Select all text when clicked
            const range = document.createRange();
            range.selectNodeContents(fieldElement);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        });

        // Add visual feedback on focus
        fieldElement.addEventListener('focus', () => {
            fieldElement.classList.add('editing');
            fieldElement.style.outline = '2px solid #4a90e2';
            fieldElement.style.outlineOffset = '2px';
        });

        // Save changes on blur
        fieldElement.addEventListener('blur', () => {
            fieldElement.classList.remove('editing');
            fieldElement.style.outline = 'none';
            this.updateField(fieldName);
        });

        // Allow Enter key to unfocus (Shift+Enter for newline if needed)
        fieldElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                fieldElement.blur();
            }
        });
    }

    /**
     * Main analysis function - tries multiple free chatbot approaches
     */
    async analyzeExpression() {
        const text = this.practiceInput.value.trim();
        if (!text) {
            this.showError('Please enter some text to practice with.');
            return;
        }

        this.practiceBtn.disabled = true;
        this.loadingSpinner.style.display = 'inline-flex';

        // Display user input in the chat area (if available)
        if (this.chatContainer) {
            this.renderMessage('user', text);
        }

        try {
            // Build prompt for Hugging Face
            const prompt = this.buildNVCPrompt(text);
            // Call Hugging Face API
            const aiResponse = await this.callHuggingFace(prompt);

            // Display AI response in chat area (if available)
            if (this.chatContainer && aiResponse) {
                this.renderMessage('assistant', aiResponse);
            }

            // Optionally, display the result in the results panel as well
            // Use async LLM-backed NVC with fallback to rule-based
            let result;
            try {
                if (typeof extractNVCWithFallback === 'function') {
                    result = await extractNVCWithFallback(text);
                    console.log('nvc-practice: Using LLM NVC:', result);
                }
            } catch (fallbackError) {
                console.warn('nvc-practice: extractNVCWithFallback failed, reverting to local NVC', fallbackError);
            }
            if (!result || !isValidNVC(result)) {
                console.log('nvc-practice: Using local NVCFramework fallback');
                result = this.nvc.generateNVC(text);
            }

            this.displayResults(result);
        } catch (error) {
            console.error('Error in analysis:', error);
            this.showError('Unable to analyze text. Please try again.');
        } finally {
            this.practiceBtn.disabled = false;
            this.loadingSpinner.style.display = 'none';
        }
    }

    /**
     * Render a chat message bubble
     */
    renderMessage(role, text) {
        if (!this.chatContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message chat-${role}`;
        messageEl.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>')}</div>`;

        this.chatContainer.appendChild(messageEl);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * Build NVC coach prompt for Hugging Face
     */
    buildNVCPrompt(userText) {
        return `You are an NVC (Nonviolent Communication) coach.\n\nUser said:\n"${userText}"\n\n1. Identify:\nObservation:\nFeeling:\nNeed:\nRequest:\n\n2. If missing elements, explain what’s missing.\n\n3. Suggest a better NVC phrasing.\n\n4. Respond briefly and clearly.`;
    }

    /**
     * Call Hugging Face free inference API
     */
    async callHuggingFace(userText) {
        // Use your deployed proxy server URL in production
        const url = 'https://subtext-je6y.onrender.com/chat'; // or 'http://localhost:5000/chat' for local dev
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText })
            });
            if (!response.ok) throw new Error('Proxy server error');
            const data = await response.json();
            // Hugging Face returns an array or object
            if (Array.isArray(data)) {
                const first = data[0];
                if (first?.generated_text) return first.generated_text;
                if (typeof first?.text === 'string') return first.text;
                if (typeof first === 'string') return first;
            }
            if (typeof data?.generated_text === 'string') return data.generated_text;
            if (typeof data?.text === 'string') return data.text;
            return null;
        } catch (error) {
            console.warn('Proxy/Hugging Face call failed:', error);
            return null;
        }
    }

    /**
     * Handle send button click for chat interface
     */
    async handleSendMessage() {
        if (!this.chatInput || !this.sendBtn) return;

        const userText = this.chatInput.value.trim();
        if (!userText) return;

        this.chatHistory.push({ role: 'user', content: userText });
        this.renderMessage('user', userText);
        this.chatInput.value = '';

        this.sendBtn.disabled = true;
        if (this.typingIndicator) this.typingIndicator.style.display = 'block';

        // Local NVC result is always available
        const localResult = this.nvc.generateNVC(userText);

        // Build AI prompt
        const prompt = this.buildNVCPrompt(userText);
        let aiResponse = await this.callHuggingFace(prompt);

        if (!aiResponse) {
            // fallback to structured local result
            aiResponse = `I couldn't reach the remote coach, so here is local NVC output.\nObservation: ${localResult.observation || '—'}\nFeeling: ${localResult.feeling || '—'}\nNeed: ${localResult.need || '—'}\nRequest: ${localResult.request || '—'}`;
        }

        const hybrid = `Local NVC: Observation: ${localResult.observation || '—'}; Feeling: ${localResult.feeling || '—'}; Need: ${localResult.need || '—'}; Request: ${localResult.request || '—'}.\nAI Coach: ${aiResponse}`;

        this.chatHistory.push({ role: 'assistant', content: hybrid });
        this.renderMessage('assistant', hybrid);

        if (this.typingIndicator) this.typingIndicator.style.display = 'none';
        this.sendBtn.disabled = false;
    }

    /**
     * Get response from free chatbot API
     * Tries multiple free options without requiring API keys
     */
    /**
     * Display results in the UI
     * Shows meaningful messages when components are not detected
     */
    displayResults(result) {
        this.currentResult = result;
        
        // Display all components using the fallback strings from NVC framework
        this.nvcObservation.textContent = result.observation;
        this.nvcFeeling.textContent = result.feeling;
        this.nvcNeed.textContent = result.need;
        this.nvcRequest.textContent = result.request;

        // Add visual hint class to fields with fallback messages
        this.updateFieldHintClasses();

        this.resultsPanel.style.display = 'block';
        this.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

        this.showSuccess('Analysis complete! You can edit any part by clicking on it.');
    }

    /**
     * Update visual hints for fields with "No clear" messages
     */
    updateFieldHintClasses() {
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
     * Update field after editing
     */
    updateField(field) {
        if (this.currentResult) {
            this.currentResult[field] = document.getElementById(`nvc${field.charAt(0).toUpperCase() + field.slice(1)}`).textContent;
            // Update visual hints after field is edited
            this.updateFieldHintClasses();
        }
    }

    /**
     * Clear results and input
     */
    clearResults() {
        this.practiceInput.value = '';
        this.resultsPanel.style.display = 'none';
        this.currentResult = null;
        this.practiceInput.focus();
    }

    /**
     * Copy NVC breakdown to clipboard
     */
    copyToClipboard() {
        const text = this.getNVCText();
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('Copied to clipboard!');
        }).catch(() => {
            this.showError('Failed to copy to clipboard.');
        });
    }

    /**
     * Download NVC breakdown as text file
     */
    downloadAsText() {
        const text = this.getNVCText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nvc-practice-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.showSuccess('Downloaded as text file!');
    }

    /**
     * Get formatted NVC text for copying/downloading
     * Uses actual content from editable fields
     */
    getNVCText() {
        const timestamp = new Date().toLocaleString();
        const observation = this.nvcObservation.textContent.trim();
        const feeling = this.nvcFeeling.textContent.trim();
        const need = this.nvcNeed.textContent.trim();
        const request = this.nvcRequest.textContent.trim();
        
        return `NVC Practice Breakdown
Generated: ${timestamp}

ORIGINAL EXPRESSION:
${this.practiceInput.value}

---------------------------------

🦒 OBSERVATION (Facts, no judgment):
${observation || '(not provided)'}

🦒 FEELING (Emotions):
${feeling || '(not detected)'}

🦒 NEED (Underlying human need):
${need || '(not identified)'}

🦒 REQUEST (Specific action):
${request || '(no clear request)'}

---------------------------------

💡 TIP: You can edit any section by clicking on it!`;
    }

    /**
     * Show error message
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorAlert.style.display = 'block';
        setTimeout(() => {
            this.errorAlert.style.display = 'none';
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successAlert.style.display = 'block';
        setTimeout(() => {
            this.successAlert.style.display = 'none';
        }, 4000);
    }

    /**
     * Initialize explanation modal
     */
    initializeExplanationModal() {
        const explanationBtn = document.querySelectorAll('.explanation-btn');
        const modal = document.getElementById('explanationModal');
        const closeBtn = document.getElementById('closeExplanation');

        explanationBtn.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const component = btn.getAttribute('data-component');
                this.showExplanation(component);
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    /**
     * Show explanation for NVC component
     */
    showExplanation(component) {
        const explanations = {
            observation: {
                title: '👁️ Observation',
                content: `
                    <div class="explanation-section">
                        <p class="section-label">What it is:</p>
                        <p class="section-content">A factual, non-judgmental description of what happened. It's what anyone could see, hear, or measure.</p>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">How to do it right:</p>
                        <div class="example good">Leave out emotions, judgments, and interpretations</div>
                        <div class="example good">Describe specific behaviors: "When you raised your voice"</div>
                        <div class="example good">State facts: "The report was submitted late"</div>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Common mistakes:</p>
                        <div class="example bad">You're so irresponsible (judgment, not fact)</div>
                        <div class="example bad">You always ignore me (interpretation, not specific)</div>
                    </div>
                `
            },
            feeling: {
                title: '❤️ Feeling',
                content: `
                    <div class="explanation-section">
                        <p class="section-label">What it is:</p>
                        <p class="section-content">Your genuine emotional response to the observation. Pure emotions without blame toward others.</p>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">How to do it right:</p>
                        <div class="example good">Use genuine emotion words: sad, angry, frustrated, scared, happy</div>
                        <div class="example good">Start with "I felt..." or "I feel..."</div>
                        <div class="example good">Name one or more emotions that fit</div>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Common mistakes:</p>
                        <div class="example bad">I feel like you don't care (not a feeling, it's a thought)</div>
                        <div class="example bad">I felt attacked (includes interpretation of others' intent)</div>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Common feelings:</p>
                        <p class="section-content">Happy, sad, angry, scared, frustrated, confused, lonely, peaceful, excited, disappointed, worried, grateful</p>
                    </div>
                `
            },
            need: {
                title: '🎯 Need',
                content: `
                    <div class="explanation-section">
                        <p class="section-label">What it is:</p>
                        <p class="section-content">The underlying universal human need behind your feeling. What matters to you deeply?</p>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">How to do it right:</p>
                        <div class="example good">Identify universal needs: respect, autonomy, connection, safety, understanding</div>
                        <div class="example good">Ask yourself: What is this feeling telling me I need?</div>
                        <div class="example good">Name the underlying value or requirement</div>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Common needs:</p>
                        <p class="section-content">Connection, love, respect, autonomy, safety, security, competence, growth, peace, fairness, understanding, belonging, purpose</p>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Remember:</p>
                        <p class="section-content">Every emotion points to a need. By identifying the need, you move toward genuine resolution.</p>
                    </div>
                `
            },
            request: {
                title: '📝 Request',
                content: `
                    <div class="explanation-section">
                        <p class="section-label">What it is:</p>
                        <p class="section-content">A specific, concrete action you'd like to request to address the need. It's actionable and clear.</p>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">How to do it right:</p>
                        <div class="example good">Be specific: "Would you be willing to finish reports by noon?"</div>
                        <div class="example good">Use positive language: what you want, not what to avoid</div>
                        <div class="example good">Make it doable: realistic, concrete actions</div>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Common mistakes:</p>
                        <div class="example bad">You need to be more responsible (not actionable)</div>
                        <div class="example bad">Don't interrupt me (negative framing)</div>
                    </div>
                    <div class="explanation-section">
                        <p class="section-label">Better requests:</p>
                        <div class="example good">Would you be willing to wait until I finish speaking before responding?</div>
                        <div class="example good">Could you send me a message when you'll be running late?</div>
                    </div>
                `
            }
        };

        const explanation = explanations[component];
        if (explanation) {
            const modal = document.getElementById('explanationModal');
            const content = document.getElementById('explanationContent');
            
            content.innerHTML = `
                <div class="explanation-title">
                    ${explanation.title}
                </div>
                ${explanation.content}
            `;

            modal.style.display = 'flex';
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NVCPractice();
});
