# Subtext 🎙️

**Emotional Signal Interpreter** — Understand what's beneath your words

A modern web application that combines voice and text analysis to interpret emotional states and translate them into **Nonviolent Communication (NVC)** principles.

## Features

### 🎤 Audio Input
- Record audio directly from your microphone using the Web Audio API
- Real-time recording timer
- **Automatic speech-to-text** — spoken words appear in text input as you speak
- Automatic feature extraction from audio

### 📝 Text Input
- Enter your thoughts and feelings freely
- Analyze with or without audio recording

### 🎛️ Audio Feature Extraction
Automatically detects:
- **Volume (RMS Energy)** — Overall intensity of speech
- **Pitch Estimation** — Fundamental frequency of voice
- **Speech Rate** — Pace of speaking (phonemes per second)
- **Expressiveness** — Pitch variability and emotional engagement

### 🧠 Emotion Inference
Combines audio and text to determine:
- **Valence** — Sentiment ranging from negative to positive
- **Arousal** — Energy level from calm to excited
- **Confidence** — Reliability of the inference

### 💬 NVC Framework
Generates compassionate communication structure:
1. **Observation** — Neutral description of what's observed
2. **Feeling** — Identified emotions
3. **Need** — Underlying needs being expressed
4. **Request** — Constructive way forward

### 📊 Real-time Visualization
- Audio features as progress bars
- Emotion state on a 2D valence-arousal plane
- Confidence percentage

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**: Web Audio API, MediaDevices API
- **Architecture**: Modular, object-oriented design
- **Deployment**: Static site (GitHub Pages compatible)

## Project Structure

```
subtext-site/
├── index.html          # Main HTML layout
├── style.css           # Modern, minimal styling
├── app.js              # Main application controller
├── audio.js            # Audio recording & feature extraction
├── analysis.js         # Sentiment analysis & emotion inference
├── agent.js            # NVC generation logic
└── README.md           # This file
```

## How It Works

### 1. Voice Capture & Transcription
- Records audio and simultaneously transcribes speech using Web Speech API
- Recognized words automatically appear in the text input
- Both audio features and text are analyzed for a complete picture
- Records microphone input using Web Audio API
- Analyzes frequency spectrum with FFT
- Extracts RMS energy, pitch, and speech rate
- Calculates expressiveness through pitch variation

### 2. Text Analysis
- Keyword-based sentiment analysis (positive/negative)
- Energy estimation from word choice (high/low arousal)
- Emotion categorization

### 3. Emotion Inference
- Combines audio arousal with text sentiment
- Weights audio (65%) and text (35%) contributions
- Calculates confidence based on signal alignment
- Maps to emotion labels (excited, calm, frustrated, etc.)

### 4. NVC Generation
- Categorizes emotion into 5 states:
  - High Energy + Negative
  - High Energy + Positive
  - Low Energy + Negative
  - Low Energy + Positive
  - Neutral
- Generates context-aware responses
- Provides compassionate communication framework

## Getting Started

### Local Development

1. **Clone or download** the repository
2. **Open in a browser**:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Node.js http-server
   npx http-server
   ```
3. **Navigate to** `http://localhost:8000`

### Using the App

1. **Record Audio** (optional):
   - Click "Start Recording"
   - Speak naturally for 10-30 seconds
   - Click "Stop Recording"

2. **Enter Text** (optional):
   - Type your thoughts in the text area
   - Be honest and detailed

3. **Analyze**:
   - Click "Analyze"
   - View audio features (if recorded)
   - See emotion state on 2D plane
   - Read NVC-formatted response

4. **Start Over**:
   - Click "Start Over" to reset

## Deployment to GitHub Pages

### Method 1: Direct Upload

1. Create a GitHub repository named `subtext-site`
2. Enable GitHub Pages in repository settings
3. Choose `main` branch as source
4. Upload all files to the repository
5. Access at `https://yourusername.github.io/subtext-site`

### Method 2: via Git

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: Subtext MVP"

# Add remote
git remote add origin https://github.com/yourusername/subtext-site.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in repository settings.

## Browser Support

- Chrome/Edge 55+
- Firefox 52+
- Safari 14.1+
- Opera 42+

**Requires**:
- HTTPS (for Web Audio API and MediaDevices)
- Microphone permissions
- Modern JavaScript (ES6)
- For speech-to-text: Chrome/Edge, Safari 14.1+, or Firefox with specific settings

## Features Explained

### Audio Features

**Volume (RMS Energy)**
- Measures average loudness during speech
- Range: 0-100% (0-128 in technical terms)
- High volume ≈ intensity and urgency

**Pitch Estimation**
- Detects fundamental frequency of voice
- Range: ~80-400 Hz (human voice)
- Higher pitch often indicates emotion or tension

**Speech Rate**
- Counts phoneme transitions per second
- Typical: 5-10 phonemes/second
- Fast rate ≈ high arousal or urgency

**Expressiveness**
- Measures pitch variation over time
- Range: 0-100%
- Higher variability ≈ more emotional engagement

### Emotion Dimensions

**Valence** (Sentiment)
- Negative ←→ Positive
- Determined primarily by text sentiment
- Audio provides minor hints

**Arousal** (Energy)
- Low Energy ←→ High Energy
- Determined by speech volume, rate, pitch
- Text energy provides secondary signal

### Confidence Score
- 0-100% reliability of emotional inference
- Higher when audio and text signals align
- Always shows even with single input (text or audio)

## Keyboard Shortcuts

- Focus text input: `Tab`
- Submit analysis: `Tab` + `Return`
- Accessible throughout with keyboard navigation

## Limitations & Future Enhancements

### Current MVP
- Rule-based emotion inference (no ML)
- Simplified pitch detection (no full autocorrelation)
- Keyword-based sentiment (no deep NLP)
- No audio playback/review

### Future Improvements
- Real ML emotion recognition (TensorFlow.js)
- Advanced pitch detection algorithms
- Language model for NVC generation
- Audio waveform visualization
- Dark mode
- Multiple language support
- Export/save analysis history
- Voice activity detection
- Noise filtering

## Privacy

- **All processing is local** — no data sent to servers
- Audio is processed in-memory only
- No tracking or analytics
- No login required
- Safe to use on any device

## Architecture Decisions

### Modular Design
- **audio.js**: Isolation of Web Audio API
- **analysis.js**: Sentiment and emotion logic
- **agent.js**: NVC generation rules
- **app.js**: UI orchestration

Benefits:
- Easy to test and debug
- Simple to enhance or replace modules
- Clear separation of concerns

### Rule-Based Approach
- Lightweight (no ML dependencies)
- Explainable results
- Fast processing
- Perfect for MVP

### Frontend-Only
- No backend required
- Deploy anywhere (GitHub Pages, Netlify, etc.)
- Instant setup, no infrastructure
- Works offline (after first load)

## Contributing

This is an MVP. Suggestions welcome:
- Better pitch detection methods
- Expanded sentiment dictionaries
- Improved NVC templates
- UI/UX refinements
- Accessibility improvements

## License

MIT — Free to use and modify

## Support

- **Microphone not working?** Ensure HTTPS and browser permissions
- **Audio analysis seems off?** Try recording on 10+ second snippet
- **Want to debug?** Open DevTools (F12) and check console logs
- **App won't load?** Clear browser cache, check JavaScript errors

## About

Subtext interprets the signals beneath words — the emotions, needs, and intentions that shape communication. By applying **Nonviolent Communication (NVC)** principles, it helps translate emotional complexity into clarity and compassion.

---

Made with 💜 for more authentic connection

**Remember**: This tool is a starting point for self-awareness. Real human connection always requires empathy, listening, and presence. ✨
