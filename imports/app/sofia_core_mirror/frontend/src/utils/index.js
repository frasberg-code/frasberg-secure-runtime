// Page URL creator
export const createPageUrl = (pageName) => {
  const routes = {
    Home: '/',
    Dashboard: '/dashboard',
    Sofia: '/sofia',
    Login: '/login',
    Register: '/register',
    Settings: '/settings',
    Contacts: '/contacts',
    Calling: '/calling',
    CryptoHub: '/crypto',
    Properties: '/properties',
    RealEstateHub: '/real-estate',
    LiveStream: '/live-stream',
    Music: '/music',
    Subscriptions: '/subscriptions',
    SubscriptionPlans: '/subscription-plans',
    SubscriptionManagement: '/admin/subscriptions',
    UserProfile: '/profile',
    UserChat: '/chat',
    SupportDashboard: '/support',
    SecurityMonitor: '/admin/security',
    SharedWorkspace: '/workspaces',
    CollaborationHub: '/collaboration',
    AboutUs: '/about',
    NotificationSettings: '/settings/notifications',
    SofiaSettings: '/settings/sofia',
    SystemControl: '/system-control',
    PropertyMarketing: '/property-marketing',
    PropertyRecommendations: '/property-recommendations',
    PropertyValuation: '/property-valuation',
    RealEstateAcademy: '/real-estate-academy',
  };
  return routes[pageName] || '/';
};

// Format currency
export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format date
export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

// Format time
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format relative time
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

// Get user initials
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Truncate text
export const truncate = (text, length = 100) => {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + '...';
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Storage helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Failed to save to storage');
    }
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
};
