import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // Gemini Pro endpoint; change as needed for other Gemini models
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    // The response structure may differ, adjust as needed
    res.status(200).json({ result: data.candidates?.[0]?.content?.parts?.[0]?.text || "" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch from Gemini API" });
  }
}
