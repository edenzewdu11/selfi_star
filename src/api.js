const API_BASE_URL = 'http://localhost:8000/api';

let authToken = localStorage.getItem('authToken');

const api = {
  setToken: (token) => {
    authToken = token;
    localStorage.setItem('authToken', token);
    console.log('Token set:', token);
  },

  getToken: () => authToken,

  clearToken: () => {
    authToken = null;
    localStorage.removeItem('authToken');
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Only add token if it exists AND it's not an auth endpoint
    if (authToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Token ${authToken}`;
    }

    console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, { headers, body: options.body });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Failed to parse response' };
    }

    if (!response.ok) {
      console.error('API Error:', response.status, data);
      // Log the full error object
      console.error('Full error response:', JSON.stringify(data, null, 2));
      throw new Error(JSON.stringify(data) || `API Error: ${response.status}`);
    }

    return data;
  },

  // Auth
  register: (username, email, password, firstName = '', lastName = '') =>
    api.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, first_name: firstName, last_name: lastName }),
    }),

  login: (username, password) =>
    api.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Profile
  getProfile: () => api.request('/profile/me/'),

  updateProfile: (data) =>
    api.request('/profile/1/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  addXP: (xp) =>
    api.request('/profile/add_xp/', {
      method: 'POST',
      body: JSON.stringify({ xp }),
    }),

  dailyCheckIn: () =>
    api.request('/profile/daily_checkin/', {
      method: 'POST',
    }),

  // Reels
  getReels: () => api.request('/reels/'),

  createReel: (formData) =>
    fetch(`${API_BASE_URL}/reels/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
      },
      body: formData,
    }).then(r => r.json()),

  createPost: (formData) =>
    fetch(`${API_BASE_URL}/posts/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
      },
      body: formData,
    }).then(r => {
      if (!r.ok) {
        return r.json().then(err => Promise.reject(err));
      }
      return r.json();
    }),

  voteReel: (reelId) =>
    api.request(`/reels/${reelId}/vote/`, {
      method: 'POST',
    }),

  postComment: (reelId, text) =>
    api.request(`/reels/${reelId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  getComments: (reelId) =>
    api.request(`/reels/${reelId}/comments/`),

  // Quests
  getQuests: () => api.request('/quests/'),

  completeQuest: (questId) =>
    api.request(`/quests/${questId}/complete/`, {
      method: 'POST',
    }),

  // Subscription
  getSubscription: () => api.request('/subscription/'),

  upgradeSubscription: (plan) =>
    api.request('/subscription/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  // Notifications
  getNotificationPrefs: () => api.request('/notifications/me/'),

  updateNotificationPrefs: (prefs) =>
    api.request('/notifications/me/', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),
};

export default api;
