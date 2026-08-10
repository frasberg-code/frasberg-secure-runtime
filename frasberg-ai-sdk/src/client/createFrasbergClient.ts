import { loadFrasbergConfig } from '../config/loadFrasbergConfig';

export interface FrasbergClient {
  generateText: (input: string) => Promise<string>;
  generateImage: (prompt: string) => Promise<Buffer>;
  generateVideo: (prompt: string) => Promise<Buffer>;
}

export function createFrasbergClient(): FrasbergClient {
  const config = loadFrasbergConfig();

  const apiKey = process.env.FRASBERG_AI_API_KEY || (() => {
    throw new Error('FRASBERG_AI_API_KEY is missing');
  })();

  const baseUrl = process.env.FRASBERG_AI_API_URL || 'https://api.frasberg-ai.yourdomain.com';

  return {
    async generateText(input: string) {
      const res = await fetch(`${baseUrl}/v1/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ input })
      });

      if (!res.ok) {
        throw new Error(`Text generation failed: ${res.status}`);
      }

      const data = await res.json();
      return data.output;
    },

    async generateImage(prompt: string) {
      const res = await fetch(`${baseUrl}/v1/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        throw new Error(`Image generation failed: ${res.status}`);
      }

      return Buffer.from(await res.arrayBuffer());
    },

    async generateVideo(prompt: string) {
      const res = await fetch(`${baseUrl}/v1/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        throw new Error(`Video generation failed: ${res.status}`);
      }

      return Buffer.from(await res.arrayBuffer());
    }
  };
}
