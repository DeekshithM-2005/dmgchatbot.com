import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
  process.exit(1);
}

// Serve static frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Simple POST /api/chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages must be an array' });
    }

    // Call OpenAI Chat Completions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', response.status, errText);
      return res.status(500).json({ error: 'OpenAI API error', details: errText });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message ?? { role: 'assistant', content: 'No response' };
    res.json({ reply: assistantMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
