import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import identify from './api/identify.js';

function localIdentifyEndpoint() {
  return {
    name: 'local-fort-photo-identification',
    configureServer(server) {
      server.middlewares.use('/api/identify', (req, res) => {
        if (req.method !== 'POST') {
          identify(req, res);
          return;
        }

        const chunks = [];
        let receivedBytes = 0;
        req.on('data', (chunk) => {
          receivedBytes += chunk.length;
          if (receivedBytes > 4_300_000) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Image is too large to analyze.' }));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        req.on('end', () => {
          if (res.writableEnded) return;
          try {
            req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'The image request could not be read.' }));
            return;
          }
          identify(req, res);
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, process.cwd(), '');
  if (!process.env.OPENAI_API_KEY && localEnv.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = localEnv.OPENAI_API_KEY;
  }

  return {
    plugins: [react(), localIdentifyEndpoint()],
    base: process.env.GITHUB_ACTIONS === 'true' ? '/durgdrishti/' : './',
  };
});
