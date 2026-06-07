import fs from 'fs';
import OpenAI from 'openai';

const isOpenRouter = (process.env.OPENAI_BASE_URL || '').includes('openrouter');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  ...(isOpenRouter && {
    defaultHeaders: {
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
      'X-Title': 'ArtHive'
    }
  })
});

const MODEL = process.env.OPENAI_MODEL || (isOpenRouter ? 'openai/gpt-4o' : 'gpt-4o');

const SYSTEM = `You are an expert art and image tagging system. Your task is to analyze images and return relevant descriptive tags.

Rules:
- Return exactly 6-10 tags as a JSON array of objects with "name" and "confidence" (0-1) keys.
- Tags should describe: subject matter, style/technique, colors, mood, composition, and visual elements.
- Confidence should reflect how strongly the tag applies to the image.
- Output ONLY valid JSON. No markdown, no explanation, no preamble.
- Example: [{"name": "landscape", "confidence": 0.95}, {"name": "watercolor", "confidence": 0.88}]`;

export async function analyzeImageWithOpenAI(imagePath) {
  console.log('🤖 Analyzing image with OpenAI Vision...');
  const startTime = Date.now();

  try {
    await fs.promises.access(imagePath);
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = `image/${imagePath.split('.').pop() || 'png'}`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            { type: 'text', text: 'Analyze this image and return tags as a JSON array.' }
          ]
        }
      ],
      max_tokens: 300
    });

    const content = response.choices[0]?.message?.content?.trim();
    console.log('📨 Raw OpenAI response:', content?.slice(0, 500));

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleaned = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try extracting a JSON array from the text
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error(`Could not parse OpenAI response as JSON: ${cleaned.slice(0, 200)}`);
      }
    }

    const tags = Array.isArray(parsed) ? parsed : (parsed.tags || []);

    const labels = tags.map(t => ({
      description: t.name || t.description || String(t),
      score: typeof t.confidence === 'number' ? t.confidence : (typeof t.score === 'number' ? t.score : 0.9)
    }));

    const duration = Date.now() - startTime;
    console.log(`✅ OpenAI tagging completed in ${duration}ms — ${labels.length} tags`);

    return {
      labels,
      safeSearch: {
        adult: 'VERY_UNLIKELY',
        violence: 'VERY_UNLIKELY',
        medical: 'UNLIKELY',
        spoof: 'UNLIKELY',
        racy: 'UNLIKELY'
      },
      provider: 'openai'
    };
  } catch (error) {
    console.error('❌ OpenAI tagging error:', error.message);
    throw new Error(`OpenAI image analysis failed: ${error.message}`);
  }
}
