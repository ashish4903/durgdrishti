const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_REQUEST_BYTES = 4_300_000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 12;
const requestCounts = new Map();
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function checkRateLimit(ip, now = Date.now()) {
  for (const [knownIp, knownRequest] of requestCounts) {
    if (now - knownRequest.startedAt >= RATE_WINDOW_MS) requestCounts.delete(knownIp);
  }
  const current = requestCounts.get(ip);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestCounts.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export default async function identify(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'Use POST to analyze an image.' });
  }
  if (!isSameOrigin(req)) return reply(res, 403, { error: 'Cross-origin requests are not allowed.' });
  if (!String(req.headers['content-type'] ?? '').includes('application/json')) {
    return reply(res, 415, { error: 'Send a JSON request with an image.' });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return reply(res, 503, { error: 'Photo identification is not configured on this deployment.' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.setHeader('Retry-After', String(Math.ceil(RATE_WINDOW_MS / 1000)));
    return reply(res, 429, { error: 'Too many photo checks. Please try again later.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) return reply(res, 413, { error: 'Image is too large to analyze.' });
    try {
      body = JSON.parse(body);
    } catch {
      return reply(res, 400, { error: 'The image request could not be read.' });
    }
  }

  const image = body?.image;
  const language = ['en', 'mr', 'hi'].includes(body?.language) ? body.language : 'en';
  if (typeof image !== 'string' || image.length > MAX_REQUEST_BYTES || !image.startsWith('data:')) {
    return reply(res, 400, { error: 'Choose a supported image before analyzing.' });
  }
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  if (!match || !allowedMimeTypes.has(match[1])) return reply(res, 400, { error: 'Use a JPEG, PNG, or WebP image.' });
  if (Buffer.from(match[2], 'base64').length > MAX_IMAGE_BYTES) return reply(res, 413, { error: 'Image is too large to analyze.' });

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sahyadri_fort_or_peak_assessment',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['classification', 'confidence', 'summary', 'visual_cues', 'limitations'],
              properties: {
                classification: { type: 'string', enum: ['fort', 'natural_peak', 'uncertain'] },
                confidence: { type: 'integer', minimum: 0, maximum: 100 },
                summary: { type: 'string' },
                visual_cues: { type: 'array', items: { type: 'string' } },
                limitations: { type: 'string' },
              },
            },
          },
        },
        messages: [
          {
            role: 'system',
            content: `You are a cautious visual field-guide assistant for Maharashtra hill forts. Inspect only visible evidence in the photo. Distinguish an engineered historic fort from a natural peak only when the image supports it. A dramatic rocky summit alone is not evidence of a fort. If the photo is unclear, shows neither landmark, or lacks enough visible structure, classify as uncertain. Never identify an exact named site from appearance alone. This is not an authoritative archaeological or safety assessment. Respond only using the requested JSON schema. Keep summary, cues, and limitations concise. Write all user-facing text fields in ${language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'}.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Does this photo show visible evidence of an engineered fort or a natural peak? Describe the evidence and uncertainty.' },
              { type: 'image_url', image_url: { url: image, detail: 'high' } },
            ],
          },
        ],
      }),
    });

    if (!upstream.ok) {
      console.error(`OpenAI image identification failed (${upstream.status}).`);
      return reply(res, 502, { error: 'The image service could not complete this check. Please try again.' });
    }

    const data = await upstream.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      console.error('OpenAI image identification returned no structured result.');
      return reply(res, 502, { error: 'The image service returned an unreadable result. Please try again.' });
    }

    const result = JSON.parse(content);
    if (!['fort', 'natural_peak', 'uncertain'].includes(result.classification)
      || !Number.isInteger(result.confidence)
      || result.confidence < 0
      || result.confidence > 100
      || typeof result.summary !== 'string'
      || !Array.isArray(result.visual_cues)
      || typeof result.limitations !== 'string') {
      console.error('OpenAI image identification result did not match the expected schema.');
      return reply(res, 502, { error: 'The image service returned an incomplete result. Please try again.' });
    }

    return reply(res, 200, {
      classification: result.classification,
      confidence: result.confidence,
      summary: result.summary.slice(0, 600),
      visual_cues: result.visual_cues.filter((cue) => typeof cue === 'string').slice(0, 5).map((cue) => cue.slice(0, 180)),
      limitations: result.limitations.slice(0, 400),
    });
  } catch (error) {
    console.error('Image identification request failed:', error);
    return reply(res, 502, { error: 'The image service is unavailable. Please try again shortly.' });
  }
}
