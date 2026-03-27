// API integration with Anthropic Claude
async function fetchWords(theme) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are a crossword constructor. Output ONLY valid JSON. No markdown fences, no explanation.',
      messages: [{
        role: 'user',
        content: `Create a crossword puzzle themed around: "${theme}".

Return a JSON array of exactly 12 objects. Each object must have:
- "word": ALL CAPS, English word or abbreviation, 4–11 letters, no spaces or hyphens
- "clue": concise crossword clue, under 10 words

Mix lengths: 3-4 short (4-5 letters), 5-6 medium (6-8), 2-3 long (9-11).
All words must clearly relate to the theme.
Return ONLY the JSON array.`
      }]
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  let text = data.content.find(c => c.type === 'text')?.text?.trim() || '';

  // Remove markdown fences if present
  text = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(text);
}
