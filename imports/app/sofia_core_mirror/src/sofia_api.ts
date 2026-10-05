/**
 * Sofia API - Express application stub
 * Stub implementation for CI compatibility
 */

import express from 'express';

export const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Message endpoint
app.post('/message', (req, res) => {
  const { user, text } = req.body;
  
  if (!user || !text) {
    return res.status(400).json({ error: 'Missing required fields: user and text' });
  }
  
  res.status(200).json({ reply: `Hello ${user}, you said: ${text}` });
});

// Test error endpoint
app.post('/trigger-error', (req, res) => {
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
