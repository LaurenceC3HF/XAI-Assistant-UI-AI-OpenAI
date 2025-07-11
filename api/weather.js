export default async function handler(req, res) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenWeatherMap API key not configured.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { location } = req.body || {};

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }
    const data = await response.json();
    res.status(200).json({
      result: {
        location: data.name,
        temperature: data.main.temp,
        description: data.weather?.[0]?.description
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from OpenWeatherMap API' });
  }
}
