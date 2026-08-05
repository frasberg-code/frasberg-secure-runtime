// server/authMiddleware.js — JWT auth for game rooms
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'frasberg-luchii-secret-change-in-prod';
const TOKEN_TTL = '24h';

// ── Generate token ────────────────────────────────────────────
export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

// ── Verify token ──────────────────────────────────────────────
export function verifyToken(token) {
  try {
    return { valid: true, decoded: jwt.verify(token, SECRET) };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// ── Express middleware ────────────────────────────────────────
export function authMiddleware(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const { valid, decoded, error } = verifyToken(token);
  if (!valid) {
    return res.status(403).json({ error: 'Invalid token', detail: error });
  }
  req.player = decoded;
  next();
}

// ── WebSocket token check ─────────────────────────────────────
export function wsAuthCheck(token) {
  if (!token) return { valid: false, error: 'No token' };
  return verifyToken(token);
}

// ── Room token (scoped to a specific room) ────────────────────
export function generateRoomToken(playerId, playerName, roomId) {
  return generateToken({ playerId, playerName, roomId, scope: 'room' });
}
