import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.json());

app.post('/api/openai', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  try {
    const systemPrompt =
      'You are an explainable AI assistant for a military command and control setting. Respond ONLY in JSON using this schema:\n{"explanationType":"insight | reasoning | projection","content":"..."}.';
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User question: ${prompt}` }
        ],
        temperature: 0,
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error('Invalid JSON from OpenAI:', content);
      return res.status(500).json({ error: 'Invalid response format from OpenAI.' });
    }

    const type = String(parsed.explanationType).toLowerCase();
    if (!['insight', 'reasoning', 'projection'].includes(type) || typeof parsed.content !== 'string') {
      console.error('Unexpected schema from OpenAI:', parsed);
      return res.status(500).json({ error: 'Invalid response schema from OpenAI.' });
    }

    const xaiExplanation = {
      defaultTab: type,
      insight: type === 'insight' ? parsed.content : null,
      reasoning: type === 'reasoning' ? parsed.content : null,
      projection: type === 'projection' ? parsed.content : null,
      confidence: null,
      showShapChart: false,
      showDAG: false,
      highlightedFeatures: [],
      graphNodes: [],
      suggestedPrompts: []
    };

    res.json(xaiExplanation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from OpenAI API' });
  }
});

app.post('/api/weather', async (req, res) => {
  const { location } = req.body;
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenWeatherMap API key not configured.' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }

    const data = await response.json();
    res.json({ result: {
      location: data.name,
      temperature: data.main.temp,
      description: data.weather?.[0]?.description
    }});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from OpenWeatherMap API' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
