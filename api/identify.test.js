import test from 'node:test';
import assert from 'node:assert/strict';
import identify from './identify.js';

function createRequest(overrides = {}) {
  return {
    method: 'POST',
    headers: {
      host: 'localhost:5173',
      'content-type': 'application/json',
      'x-forwarded-for': `${Math.random()}:127.0.0.1`,
    },
    body: { image: 'data:image/jpeg;base64,aGVsbG8=' },
    ...overrides,
  };
}

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value) {
      this.body = JSON.parse(value);
      this.writableEnded = true;
    },
  };
}

test('rejects unsupported methods and cross-origin requests', async () => {
  const methodResponse = createResponse();
  await identify(createRequest({ method: 'GET' }), methodResponse);
  assert.equal(methodResponse.statusCode, 405);

  const originResponse = createResponse();
  await identify(createRequest({ headers: { ...createRequest().headers, origin: 'https://other.example' } }), originResponse);
  assert.equal(originResponse.statusCode, 403);
});

test('reports missing provider configuration and rejects invalid image payloads', async (context) => {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  context.after(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });

  const unconfigured = createResponse();
  await identify(createRequest(), unconfigured);
  assert.equal(unconfigured.statusCode, 503);

  process.env.OPENAI_API_KEY = 'test-key';
  const invalid = createResponse();
  await identify(createRequest({ body: { image: 'data:image/gif;base64,aGVsbG8=' } }), invalid);
  assert.equal(invalid.statusCode, 400);
});

test('uses the server-side key and returns a validated visual assessment', async (context) => {
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-server-key';
  context.after(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  });
  let upstreamRequest;
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    upstreamRequest = { url, options };
    return new Response(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            classification: 'fort',
            confidence: 83,
            summary: 'दिखाई देने वाली चिनाई किसी निर्मित संरचना का संकेत देती है।',
            visual_cues: ['A stone gateway is visible.'],
            limitations: 'The exact fort cannot be identified from this image.',
          }),
        },
      }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  const response = createResponse();
  await identify(createRequest({ body: { image: 'data:image/jpeg;base64,aGVsbG8=', language: 'mr' } }), response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.classification, 'fort');
  assert.equal(upstreamRequest.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(upstreamRequest.options.headers.Authorization, 'Bearer test-server-key');
  const prompt = upstreamRequest.options.body;
  assert.match(prompt, /Marathi/);
  assert.match(prompt, /"detail":"high"/);
});
