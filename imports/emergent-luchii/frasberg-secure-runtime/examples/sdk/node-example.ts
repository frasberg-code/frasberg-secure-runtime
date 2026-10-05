const apiKey = process.env.FRASBERG_API_KEY;

if (!apiKey) {
  throw new Error('Set FRASBERG_API_KEY before running this example.');
}

const response = await fetch('http://127.0.0.1:4000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'x-tenant-id': 'demo',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'hello from sdk example' }],
  }),
});

console.log(await response.json());
