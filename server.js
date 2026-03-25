// server.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const HF_TOKEN = process.env.HF_API_KEY; 

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  try {
    const hfRes = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: message })
    });
    const data = await hfRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hugging Face request failed', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
