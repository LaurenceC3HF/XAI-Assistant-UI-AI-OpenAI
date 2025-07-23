export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt.' });
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
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API Response Error:", text);
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

if (!['insight', 'reasoning', 'projection', 'error'].includes(type) || typeof parsed.content !== 'string') {
  console.error('Unexpected schema from OpenAI:', parsed);
  return res.status(500).json({ error: 'Invalid response schema from OpenAI.' });
}

const xaiExplanation = {
  defaultTab: type === 'error' ? 'insight' : type,
  insight: type === 'insight' || type === 'error' ? parsed.content : null,
  reasoning: type === 'reasoning' ? parsed.content : null,
  projection: type === 'projection' ? parsed.content : null,
  confidence: null,
  showShapChart: false,
  showDAG: false,
  highlightedFeatures: [],
  graphNodes: [],
  suggestedPrompts: []
};

  console.log("Sending response to frontend:", xaiExplanation);
res.json(xaiExplanation);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    res.status(500).json({ error: 'Failed to fetch from OpenAI API', details: error.message });
  }
}
