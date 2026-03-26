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

const app = express();
app.use(cors());
app.use(express.json());

const { NVCFramework } = require('./nvc');
const HF_TOKEN = process.env.HF_API_KEY || process.env.HF_TOKEN || '';
const HF_MODEL_NAME = process.env.HF_MODEL_NAME || 'mistralai/Mistral-7B-Instruct-v0.2';

async function callHuggingFaceNVC(text) {
  const prompt = `You are an expert in Nonviolent Communication (NVC).\n\nYour task is to transform user input into 4 components:\n1. observation (objective, factual, no judgment)\n2. feeling (one word emotion)\n3. need (universal human need, not an action)\n4. request (specific, actionable, phrased as a question)\n\nRules:\n- Observation must be neutral (no blame, no \"I feel\")\n- Feeling must be one word\n- Need must be universal\n- Request must be concrete and doable\n- If no request is appropriate, return \"\"\n\nReturn ONLY valid JSON:\n{\n  \"observation\": \"...\",\n  \"feeling\": \"...\",\n  \"need\": \"...\",\n  \"request\": \"...\"\n}\n\nNow process this input:\n---\n${text}\n---`;

  const routerApiTextGen = 'https://router.huggingface.co/api/text-generation';
  const routerApiChat = 'https://router.huggingface.co/api/chat';

  let response;
  try {
    response = await fetch(routerApiTextGen, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: HF_MODEL_NAME,
        inputs: prompt,
        parameters: {
          temperature: 0.2,
          max_new_tokens: 200
        }
      })
    });

    // If text-generation route isn't supported, fallback to chat route
    if (response.status === 404 || response.status === 405 || response.status === 410) {
      const errorText = await response.text();
      console.warn('callHuggingFaceNVC: text-generation route bad status, trying chat route', response.status, errorText);
      response = await fetch(routerApiChat, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: HF_MODEL_NAME,
          messages: [
            { role: 'system', content: 'You are an expert in Nonviolent Communication (NVC).' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_new_tokens: 200
        })
      });
    }
  } catch (err) {
    throw new Error('HF request error: ' + err.message);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF request failed ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let generatedText = '';

  // Router output may carry a 'generated_text' or a choices array
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