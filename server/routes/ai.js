const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// Daily usage counter (resets at midnight)
const dailyUsage = { date: '', count: 0 };
const DAILY_LIMIT = 150;

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}
function checkAndIncrement() {
  const today = getTodayStr();
  if (dailyUsage.date !== today) { dailyUsage.date = today; dailyUsage.count = 0; }
  if (dailyUsage.count >= DAILY_LIMIT) return false;
  dailyUsage.count++;
  return true;
}

// POST /api/ai/chat
router.post('/chat', protect, adminOnly, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        message: 'GEMINI_API_KEY não configurada no .env. Obtenha gratuitamente em: https://aistudio.google.com/apikey',
        needsKey: true,
      });
    }

    if (!checkAndIncrement()) {
      return res.status(429).json({
        message: `Limite diário de ${DAILY_LIMIT} mensagens atingido. Resetará amanhã.`,
        limitReached: true,
      });
    }

    const { messages, useSearch = true, useThinking = true } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Campo messages é obrigatório.' });
    }

    // Build Gemini content array (convert from OpenAI format)
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // System instruction
    const systemInstruction = {
      parts: [{
        text: `Você é um assistente especialista em sistemas administrativos militares do Exército Brasileiro.
Você ajuda com:
- Gestão de escalas, boletins e documentos militares
- Procedimentos, regulamentos e normas do EB
- Programação Node.js e React para o Sistema Interno Militar (SIM)
- Busca e análise de informações atualizadas
- Geração de textos militares formais

IMPORTANTE SOBRE CÓDIGO:
Quando gerar código JavaScript ou Node.js:
- Sempre use blocos \`\`\`javascript ... \`\`\` com syntax highlighting
- Organize o código com comentários claros em português
- Explique o que cada parte faz
- Se for código para copiar/colar, deixe completo e funcional

Data atual: ${new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}.
Responda sempre em português do Brasil. Seja preciso, objetivo e profissional.`,
      }],
    };

    // Tools: Google Search grounding
    const tools = useSearch ? [{ googleSearch: {} }] : [];

    // Thinking config
    const generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 8192,
      ...(useThinking ? { thinkingConfig: { thinkingBudget: 8000 } } : {}),
    };

    const body = {
      contents,
      systemInstruction,
      generationConfig,
      ...(tools.length > 0 ? { tools } : {}),
    };

    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      let friendlyMsg = `Erro ${response.status} da API Gemini.`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) friendlyMsg = errJson.error.message;
      } catch {}
      return res.status(response.status).json({ message: friendlyMsg });
    }

    const data = await response.json();

    // Extract text reply (skip thinking parts)
    let reply = '';
    let thinkingSummary = null;

    const candidate = data.candidates?.[0];
    if (candidate?.content?.parts) {
      const textParts = candidate.content.parts.filter(p => p.text && !p.thought);
      const thoughtParts = candidate.content.parts.filter(p => p.thought && p.text);
      reply = textParts.map(p => p.text).join('');
      if (thoughtParts.length > 0) {
        thinkingSummary = thoughtParts.map(p => p.text).join('').slice(0, 300);
      }
    }

    // Extract grounding/search info
    let searchUsed = false;
    let searchQueries = [];
    if (candidate?.groundingMetadata?.webSearchQueries) {
      searchUsed = true;
      searchQueries = candidate.groundingMetadata.webSearchQueries;
    }

    res.json({
      reply: reply || 'Sem resposta.',
      thinking: thinkingSummary,
      searchUsed,
      searchQueries,
      model,
      usage: {
        today: dailyUsage.count,
        limit: DAILY_LIMIT,
        remaining: DAILY_LIMIT - dailyUsage.count,
      },
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ message: 'Erro ao conectar com a IA: ' + err.message });
  }
});

// POST /api/ai/image - Generate image with Gemini
router.post('/image', protect, adminOnly, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ message: 'GEMINI_API_KEY não configurada.', needsKey: true });

    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt é obrigatório.' });

    // Gemini 2.0 Flash Preview — geração de imagens
    const model = 'gemini-2.0-flash-preview-image-generation';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    };

    const response = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ message: 'Erro ao gerar imagem: ' + errText.slice(0, 200) });
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    const textPart = parts.find(p => p.text);

    if (!imgPart) return res.status(422).json({ message: 'Nenhuma imagem gerada. Tente um prompt diferente.' });

    res.json({
      imageBase64: imgPart.inlineData.data,
      mimeType: imgPart.inlineData.mimeType,
      description: textPart?.text || '',
    });
  } catch (err) {
    console.error('Image gen error:', err);
    res.status(500).json({ message: 'Erro: ' + err.message });
  }
});

// GET /api/ai/status
router.get('/status', protect, adminOnly, (req, res) => {
  const today = getTodayStr();
  if (dailyUsage.date !== today) { dailyUsage.date = today; dailyUsage.count = 0; }
  res.json({
    today: dailyUsage.count,
    limit: DAILY_LIMIT,
    remaining: DAILY_LIMIT - dailyUsage.count,
    hasKey: !!process.env.GEMINI_API_KEY,
    provider: 'Google Gemini 2.5 Flash',
    features: ['thinking', 'webSearch', 'imageGeneration'],
  });
});

module.exports = router;
