import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const chatApi = {
  sendMessage: async (sessionId, message, model = 'gpt-4o', provider = 'openai') => {
    const response = await api.post('/chat', {
      session_id: sessionId,
      message,
      model,
      provider,
    });
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getConversation: async (sessionId) => {
    const response = await api.get(`/conversations/${sessionId}`);
    return response.data;
  },

  deleteConversation: async (sessionId) => {
    const response = await api.delete(`/conversations/${sessionId}`);
    return response.data;
  },
};

// Voice API (TTS/STT)
export const voiceApi = {
  textToSpeech: async (text, voiceId = 'sofia') => {
    const response = await api.post('/tts', { text, voice_id: voiceId });
    return response.data;
  },

  speechToText: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    
    const response = await api.post('/stt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getVoices: async () => {
    const response = await api.get('/voices');
    return response.data;
  },
};

// Sofia Core Admin API
export const sofiaCoreApi = {
  getSyncStatus: async () => {
    const response = await api.get('/admin/sofia-core/sync/status');
    return response.data;
  },

  runSync: async () => {
    const response = await api.post('/admin/sofia-core/sync/run');
    return response.data;
  },

  getFiles: async (deployed = null, pathPrefix = null) => {
    const params = new URLSearchParams();
    if (deployed !== null) params.append('deployed', deployed);
    if (pathPrefix) params.append('path_prefix', pathPrefix);
    
    const response = await api.get('/admin/sofia-core/files', { params });
    return response.data;
  },

  getFile: async (fileId) => {
    const response = await api.get(`/admin/sofia-core/files/${fileId}`);
    return response.data;
  },

  deployFiles: async (fileIds) => {
    const response = await api.post('/admin/sofia-core/deploy', { file_ids: fileIds });
    return response.data;
  },
};

export default api;
