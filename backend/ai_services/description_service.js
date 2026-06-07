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

const SYSTEM = `You are a professional art critic writing for a contemporary art platform. You write concise, evocative descriptions that help viewers connect emotionally with artworks.

Rules:
- Write exactly 2–3 sentences. No more.
- Use present tense ("The composition draws the eye...", "Warm ochres contrast with...").
- Cover: visual impression, technique/style, emotional tone.
- Do NOT use clichés like "a masterpiece", "breathtaking", or "speaks to the soul".
- Do NOT mention the artist's name or repeat the title verbatim.
- Output only the description text. No quotes, no label, no preamble.`;

export async function generateArtDescription({ imageUrl, title, category, tags, userDescription }) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not set — skipping AI description');
    return null;
  }

  console.log(`🤖 Generating AI description using model: ${MODEL}`);

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            },
            {
              type: 'text',
              text: `Title: ${title}\nCategory: ${category}\nTags: ${(tags || []).join(', ')}\nArtist description: ${userDescription || 'none'}\n\nWrite a 2–3 sentence art critic description.`
            }
          ]
        }
      ],
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content?.trim() || null;
    console.log(`✅ AI description generated (${content?.length || 0} chars)`);
    return content;
  } catch (error) {
    console.error('❌ AI description generation error:', error.message);
    if (error.status) console.error('   Status:', error.status);
    if (error.error) console.error('   Details:', JSON.stringify(error.error));
    return null;
  }
}
