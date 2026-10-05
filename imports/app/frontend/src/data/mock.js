// Mock data for Sofia

export const conversations = [
  { id: '1', title: 'Which model are you?', date: 'today' },
  { id: '2', title: 'Hello Sofia, can you help ...', date: 'today' },
  { id: '3', title: 'hi', date: 'today' },
  { id: '4', title: 'Hello Sofia! I need help an...', date: 'today' },
  { id: '5', title: 'hi', date: 'today' },
  { id: '6', title: 'Say hi', date: 'today' },
  { id: '7', title: 'Say hi', date: 'today' },
  { id: '8', title: 'Say hi', date: 'today' },
  { id: '9', title: 'Hello', date: 'today' },
  { id: '10', title: 'Hello', date: 'today' },
  { id: '11', title: 'Say hello and tell me whic...', date: 'today' },
];

export const suggestions = [
  {
    id: 'debug',
    icon: 'code',
    title: 'Help me debug',
    description: 'Find issues in my code',
  },
  {
    id: 'content',
    icon: 'pencil',
    title: 'Write content',
    description: 'Blog posts, emails, essays',
  },
  {
    id: 'brainstorm',
    icon: 'lightbulb',
    title: 'Brainstorm ideas',
    description: 'Creative solutions and concepts',
  },
  {
    id: 'analyze',
    icon: 'document',
    title: 'Analyze documents',
    description: 'Summarize and extract insights',
  },
];

export const actionButtons = [
  { id: 'attach', label: 'Attach', icon: 'paperclip' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'study', label: 'Study', icon: 'book' },
  { id: 'image', label: 'Create image', icon: 'image' },
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'music', label: 'Music', icon: 'music' },
];

export const models = [
  { id: 'sofia-3-moon', name: 'Sofia 3 Moon', provider: 'sofia' },
  { id: 'sofia-orbit', name: 'Sofia Orbit', provider: 'sofia' },
  { id: 'sofia-jupiter', name: 'Sofia Jupiter', provider: 'sofia' },
];

export const assistantModes = [
  { id: 'assistant', name: 'Assistant Mode' },
  { id: 'creative', name: 'Creative Mode' },
  { id: 'precise', name: 'Precise Mode' },
];

export const sofiaCoreFiles = [
  { id: '1', path: 'src/index.ts', status: 'ok', size: 2048, is_deployed: true, last_synced_at: '2025-07-14T10:30:00Z' },
  { id: '2', path: 'src/config.ts', status: 'ok', size: 1024, is_deployed: false, last_synced_at: '2025-07-14T10:30:00Z' },
  { id: '3', path: 'src/services/voice.ts', status: 'ok', size: 4096, is_deployed: true, last_synced_at: '2025-07-14T10:30:00Z' },
  { id: '4', path: 'package.json', status: 'ok', size: 512, is_deployed: true, last_synced_at: '2025-07-14T10:30:00Z' },
];

export const syncStatus = {
  last_run_at: '2025-07-14T10:30:00Z',
  last_success_at: '2025-07-14T10:30:00Z',
  last_error_at: null,
  last_error: null,
  files_synced: 45,
  files_failed: 0,
  duration_seconds: 12.5,
};
