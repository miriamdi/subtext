// server.js

const express = require('express');
const fetch = require('node-fetch'); // npm install node-fetch@2
const cors = require('cors');

let multer = global.__nvc_multer || null;
if (!multer) {
  multer = require('multer');
  global.__nvc_multer = multer;
}

const upload = multer();


const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the project root (where index.html is)
app.use(express.static(path.join(__dirname, '.')));

// Fallback: serve index.html for any unknown GET route (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Fallback: serve index.html for any GET request not handled by API routes
app.get('*', (req, res, next) => {
  // Only handle GET requests that are not API endpoints
  if (req.path.startsWith('/api') || req.path.startsWith('/chat') || req.path.startsWith('/extract_features')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const { NVCFramework } = require('./nvc');
const HF_TOKEN = process.env.HF_API_KEY;
const HF_MODEL_NAME = 'mistralai/Mistral-7B-Instruct-v0.2';
const HF_ROUTER_COMPLETIONS = 'https://router.huggingface.co/v1/completions';

async function callHuggingFaceNVC(text) {
    const prompt = `You are an expert in Nonviolent Communication (NVC).

  Your task: Given any user input, infer and output ALL FOUR NVC fields:
  1. observation (neutral, objective, no judgment)
  2. feeling (emotion, 1–3 words max)
  3. need (universal human need, 1–3 words max)
  4. request (simple, actionable, phrased as a question)

  Instructions:
  - ALWAYS return all four fields. Never use placeholders like "unknown", "N/A", "no clear feeling", or empty strings.
  - If information is vague or missing, INFER the most likely feeling, need, and request based on context and common human experience.
  - Map vague or indirect expressions to likely emotions (e.g., "fine" → "resigned", "doesn't work" → "frustrated").
  - The request should be a natural, concrete question—even if the input doesn't contain one, generate a likely request.
  - Output must be STRICTLY valid JSON, with no extra text.
  - Use concise wording (1–5 words per field). Do NOT repeat the full input in any field.
  - Observation must be neutral and factual (no blame, no "I feel").

  Few-shot examples:
  Input: "what to do? im not sure"
  Output:
  {
    "observation": "Uncertainty about next steps",
    "feeling": "confused",
    "need": "clarity",
    "request": "Could you help me decide what to do next?"
  }

  Input: "doesnt seem to work!!"
  Output:
  {
    "observation": "Tried something and it failed",
    "feeling": "frustrated",
    "need": "support",
    "request": "Could you help me fix this?"
  }

  Input: "fine."
  Output:
  {
    "observation": "Asked about my state",
    "feeling": "resigned",
    "need": "acceptance",
    "request": "Could you give me some space?"
  }

  Input: "You never listen to me, it's so frustrating"
  Output:
  {
    "observation": "When I speak and don't get a response",
    "feeling": "frustrated",
    "need": "understanding",
    "request": "Could you listen and reflect back what you hear?"
  }

  Now process this input:
  ---
  ${text}
  ---`;
  // Helper to check if output is weak (empty or 'No clear ...')
  function isWeakNVC(nvc) {
    return [nvc.feeling, nvc.need, nvc.request].some(
      v => !v || /^no clear/i.test(v) || v === ''
    );
  }

  // Retry logic: if output is weak, retry with stricter prompt
  let nvcResult = null;
  let triedRetry = false;
  let lastError = null;
  let retryPrompt = prompt + '\nREMINDER: You must never use placeholders or leave any field empty. Always infer the most likely feeling, need, and request, even if the input is vague or ambiguous.';

  async function fetchNVC(promptText) {
    let response;
    try {
      response = await fetch(HF_ROUTER_COMPLETIONS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: HF_MODEL_NAME,
          prompt: promptText,
          max_tokens: 200,
          temperature: 0.2
        })
      });
    } catch (err) {
      throw new Error('HF request error: ' + err.message);
    }
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HF request failed ${response.status}: ${errText}`);
    }
    const data = await response.json();
    let generatedText = '';
    if (typeof data === 'string') {
      generatedText = data;
    } else if (Array.isArray(data)) {
      generatedText = (data[0]?.generated_text || data[0]?.text || '') + '';
    } else if (data?.generated_text) {
      generatedText = data.generated_text;
    } else if (data?.text) {
      generatedText = data.text;
    } else if (data?.choices && Array.isArray(data.choices) && data.choices[0]) {
      generatedText = (data.choices[0]?.message?.content || data.choices[0]?.text || '') + '';
    } else {
      throw new Error('Unexpected HF response format: ' + JSON.stringify(data));
    }
    generatedText = generatedText.trim();
    const firstBrace = generatedText.indexOf('{');
    const lastBrace = generatedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      generatedText = generatedText.slice(firstBrace, lastBrace + 1);
    }
    let parsed;
    try {
      parsed = JSON.parse(generatedText);
    } catch (err) {
      throw new Error('Failed to parse HF output as JSON: ' + err.message + ' // ' + generatedText);
    }
    return {
      observation: String(parsed.observation || '').trim(),
      feeling: String(parsed.feeling || '').trim(),
      need: String(parsed.need || '').trim(),
      request: String(parsed.request || '').trim()
    };
  }

  // First attempt
  nvcResult = await fetchNVC(prompt);
  if (isWeakNVC(nvcResult)) {
    console.warn('[NVC LLM] Weak output detected, retrying with stricter prompt:', nvcResult);
    triedRetry = true;
    try {
      nvcResult = await fetchNVC(retryPrompt);
    } catch (retryErr) {
      lastError = retryErr;
      console.error('[NVC LLM] Retry failed:', retryErr);
    }
  }
  if (isWeakNVC(nvcResult)) {
    console.warn('[NVC LLM] Output still weak after retry, synthesizing best-guess fallback:', nvcResult);
    // Synthesize best-guess fallback (never placeholders)
    if (!nvcResult.feeling || /^no clear/i.test(nvcResult.feeling) || nvcResult.feeling === '') nvcResult.feeling = 'uncertain';
    if (!nvcResult.need || /^no clear/i.test(nvcResult.need) || nvcResult.need === '') nvcResult.need = 'clarity';
    if (!nvcResult.request || /^no clear/i.test(nvcResult.request) || nvcResult.request === '') nvcResult.request = 'Can you help me decide?';
    if (!nvcResult.observation || /^no clear/i.test(nvcResult.observation) || nvcResult.observation === '') nvcResult.observation = 'Situation unclear';
  }
  return nvcResult;
}

app.post('/api/nvc', async (req, res) => {
  try {
    console.log('[POST /api/nvc] Incoming body:', req.body);
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      console.warn('[POST /api/nvc] Invalid request body: missing text');
      return res.status(400).json({ error: 'Missing text in request body' });
    }

    if (!HF_TOKEN) {
      console.warn('[POST /api/nvc] HF_TOKEN not configured; using local NVCFramework fallback');
      const localResult = new NVCFramework().generateNVC(text);
      console.log('[POST /api/nvc] localResult:', localResult);
      return res.json(localResult);
    }

    const nvc = await callHuggingFaceNVC(text);
    if ([nvc.feeling, nvc.need, nvc.request].some(v => !v || /^no clear/i.test(v))) {
      console.warn('[POST /api/nvc] LLM output rejected or weak:', nvc);
    }
    console.log('[POST /api/nvc] Response data:', nvc);
    res.json(nvc);
  } catch (error) {
    console.error('[POST /api/nvc] error', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

// Keep existing route logic for /chat and /extract_features if needed
app.post('/chat', async (req, res) => {
  console.log('[POST /chat] Incoming request body:', req.body);
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });
    // Existing chat route logic left as-is
    const systemPrompt = `You are an NVC (Nonviolent Communication) coach.\n1. Identify:\nObservation:\nFeeling:\nNeed:\nRequest:\n2. If missing elements, explain what’s missing.\n3. Suggest a better NVC phrasing.\n4. Respond briefly and clearly.`;
    const fullPrompt = `${systemPrompt}\nUser said: "${message}"`;

    const routerApiTextGen = 'https://router.huggingface.co/api/text-generation';
    const routerApiChat = 'https://router.huggingface.co/api/chat';

    let hfRes = await fetch(routerApiTextGen, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: HF_MODEL_NAME,
        inputs: fullPrompt,
        parameters: { wait_for_model: true }
      })
    });

    if ([404, 405, 410].includes(hfRes.status)) {
      const errText = await hfRes.text();
      console.warn('POST /chat: text-generation fallback to chat route', hfRes.status, errText);
      hfRes = await fetch(routerApiChat, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: HF_MODEL_NAME,
          messages: [
            { role: 'system', content: 'You are an NVC (Nonviolent Communication) coach.' },
            { role: 'user', content: fullPrompt }
          ],
          temperature: 0.2,
          max_new_tokens: 200
        })
      });
    }

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return res.status(500).json({ error: errText });
    }

    const data = await hfRes.json();
    res.json(data);
  } catch (error) {
    console.error('[POST /chat] Handler error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/extract_features', upload.single('audio'), async (req, res) => {
  const text = req.body.text;
  if (text) {
    return res.json({
      source: 'text',
      features: { sentiment: 'neutral', valence: 0.5, arousal: 0.5 }
    });
  }
  if (req.file) {
    return res.json({
      source: 'audio',
      features: {
        energy: 0.7,
        pitchMean: 0.4,
        pitchVariance: 0.1,
        speechRate: 0.6,
        pauseRatio: 0.2,
        spectralCentroid: 0.5
      }
    });
  }
  res.status(400).json({ error: 'No audio or text provided' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));