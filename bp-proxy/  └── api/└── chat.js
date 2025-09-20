// Minimal Vercel serverless proxy for OpenAI Chat
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Widget-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages = [], model = process.env.MODEL || 'gpt-4o-mini' } = req.body || {};
    const widgetKey = req.headers['x-widget-key'];

    // Optional shared secret check
    if (process.env.WIDGET_KEY && widgetKey !== process.env.WIDGET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 700
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'upstream', detail: text });
    }

    const json = await r.json();
    const reply = json.choices?.[0]?.message?.content || '';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: 'server', detail: String(err) });
  }
}

