import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  const url = 'https://api.openai.com/v1/chat/completions';

  const body = {
    model: 'gpt-3.5-turbo', // or 'gpt-4' if you have access
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    res.status(200).json({ result: data.choices?.[0]?.message?.content || "" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from OpenAI API" });
  }
}
