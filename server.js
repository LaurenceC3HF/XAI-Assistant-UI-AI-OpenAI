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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }

    const data = await response.json();
    res.json({ result: data.choices?.[0]?.message?.content || '' });
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
