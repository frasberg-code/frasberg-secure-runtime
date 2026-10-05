import { v4 as uuidv4 } from "uuid";

const sessions = new Map();

export function createSession(userId, gameId) {
  const id = uuidv4();
  const session = {
    id,
    userId,
    gameId,
    createdAt: Date.now(),
    peerConnection: null,
    gameProcess: null,
    inputChannel: null,
    status: "initializing",
  };
  sessions.set(id, session);
  console.log(`🎮 Session created: ${id} | user:${userId} | game:${gameId}`);
  return session;
}

export function getSession(id) {
  return sessions.get(id);
}

export function updateSession(id, updates) {
  const session = sessions.get(id);
  if (!session) return null;
  Object.assign(session, updates);
  sessions.set(id, session);
  return session;
}

export function destroySession(id) {
  const session = sessions.get(id);
  if (!session) return;

  // Cleanup game process
  if (session.gameProcess) {
    session.gameProcess.kill("SIGTERM");
  }

  // Cleanup peer connection
  if (session.peerConnection) {
    session.peerConnection.close();
  }

  sessions.delete(id);
  console.log(`🔴 Session destroyed: ${id}`);
}

export function getAllSessions() {
  return Array.from(sessions.values());
}

export function getSessionCount() {
  return sessions.size;
}
