const API_BASE_URL = 'http://localhost:8000/api';

let authToken = localStorage.getItem('authToken');

// Validate token format - clear if invalid
if (authToken && (authToken.length < 10 || authToken.includes('undefined') || authToken.includes('null'))) {
  console.log('🔑 Invalid token format detected, clearing...');
  localStorage.removeItem('authToken');
  authToken = null;
}

console.log('🔑 Initial authToken loaded:', authToken ? authToken.substring(0, 10) + '...' : 'NONE');

const api = {
  setAuthToken: (token) => {
    console.log('🔑 setAuthToken called with:', token ? token.substring(0, 10) + '...' : 'NULL');
    
    authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('✅ Token saved to localStorage');
    } else {
      localStorage.removeItem('authToken');
      console.log('❌ Token removed from localStorage');
    }
  },

  getToken: () => {
    const currentToken = authToken;
    console.log('🔍 getToken returning:', currentToken ? currentToken.substring(0, 10) + '...' : 'NONE');
    return currentToken;
  },

  clearToken: () => {
    console.log('🗑️ clearToken called');
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
  },

  async request(endpoint, options = {}) {
    console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
    console.log(`🔑 Auth token available: ${!!authToken}`);
    
    const headers = {
      ...options.headers,
    };

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Only add token if it exists AND it's not an auth endpoint
    const currentToken = authToken;
    if (currentToken && !endpoint.includes('/auth/')) {
      headers['Authorization'] = `Token ${currentToken}`;
      console.log(`🔐 Using token for request: ${currentToken.substring(0, 10)}...`);
    } else {
      console.log(`🔓 No token used for request: ${endpoint}`);
    }

    console.log(`📤 Full request details:`, {
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers,
      isFormData: options.isFormData
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));

    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log(`📦 Response data received, type: ${Array.isArray(data) ? 'array' : typeof data}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } else {
        // Handle HTML error pages
        const text = await response.text();
        console.error('Received HTML response instead of JSON:', text.substring(0, 200));
        data = { error: 'Server returned HTML instead of JSON', status: response.status, html: text };
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', e);
      data = { error: 'Failed to parse response', status: response.status };
    }

    if (!response.ok) {
      console.error('❌ API Error:', response.status, data);
      // Log the full error object
      console.error('❌ Full error response:', JSON.stringify(data, null, 2));
      
      // Auto-clear invalid token on 401 errors
      if (response.status === 401 && authToken) {
        console.log('🔑 401 error detected, clearing invalid token...');
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminToken');
      }
      
      throw new Error(data.error || data.message || `API Error: ${response.status}`);
    }

    console.log(`✅ API Request successful for ${endpoint}`);
    return data;
  },

  // Generic HTTP methods for admin panel
  get: (endpoint) => api.request(endpoint, { method: 'GET' }).then(data => ({ data })),
  post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }).then(data => ({ data })),
  patch: (endpoint, body) => api.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }).then(data => ({ data })),
  delete: (endpoint) => api.request(endpoint, { method: 'DELETE' }).then(data => ({ data })),

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

  createPost: (formData) => {
    const currentToken = authToken;
    console.log("📤 createPost called with FormData:");
    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    console.log("🔑 Using token:", currentToken ? currentToken.substring(0, 10) + '...' : 'NONE');
    
    if (!currentToken) {
      console.error('❌ NO TOKEN AVAILABLE FOR POST CREATION!');
      return Promise.reject({ error: 'Not authenticated' });
    }
    
    // Enhanced token validation before making request
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && currentToken === adminToken) {
      console.error('🚨 CRITICAL ERROR: Attempting to create post with admin token!');
      console.error('This would cause the post to be attributed to admin instead of the actual user');
      console.error('Clearing tokens to prevent this issue...');
      
      // Auto-fix: Clear the conflicting tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminToken');
      authToken = null;
      
      return Promise.reject({ 
        error: 'Authentication conflict detected. Please log out and log back in.',
        token_conflict: true 
      });
    }
    
    return fetch(`${API_BASE_URL}/posts/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${currentToken}`,
      },
      body: formData,
    }).then(r => {
      console.log("API response status:", r.status);
      if (!r.ok) {
        return r.json().then(err => {
          console.error("API error response:", err);
          
          // Check if the response indicates admin attribution
          if (err.user && err.user.username === 'admin') {
            console.error('🚨 POST WAS ATTRIBUTED TO ADMIN! This confirms token confusion.');
            console.error('Clearing tokens to prevent further issues...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminToken');
            authToken = null;
            
            return Promise.reject({ 
              error: 'Post was incorrectly attributed to admin due to token conflict. Please clear your browser cache and log in again.',
              admin_attribution: true 
            });
          }
          
          return Promise.reject(err);
        });
      }
      return r.json();
    }).then(data => {
      console.log("✅ Post created successfully:", data);
      
      // Verify the post was attributed to the correct user
      if (data.user && data.user.username === 'admin') {
        console.error('🚨 WARNING: Post was created but shows admin as author!');
        console.error('This indicates a token confusion issue occurred.');
        console.error('Clearing tokens to prevent further issues...');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminToken');
        authToken = null;
        
        return Promise.reject({ 
          error: 'Post was incorrectly attributed to admin. Please clear your browser cache and log in again.',
          admin_attribution: true 
        });
      }
      
      return data;
    })
  },

  // Competitions
  getCompetitions: () => api.request('/competitions/'),

  getActiveCompetitions: () => api.request('/competitions/?is_active=true'),

  // Winners
  getWinners: () => api.request('/winners/'),

  getLatestWinners: () => api.request('/winners/latest/'),

  // Subscription upgrade
  upgradeToProPlan: () =>
    api.request('/subscription/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro' }),
    }),

  upgradeToPremiumPlan: () =>
    api.request('/subscription/upgrade/', {
      method: 'POST',
      body: JSON.stringify({ plan: 'premium' }),
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
    api.request(`/comments/?reel=${reelId}`),

  followUser: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }),

  unfollowUser: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }),

  deletePost: (reelId) =>
    api.request(`/reels/${reelId}/`, {
      method: 'DELETE',
    }),

  updateNotificationSettings: (settings) =>
    api.request('/notifications/me/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  updatePrivacySettings: (settings) =>
    api.request('/profile/update_privacy/', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  getUserNotifications: () =>
    api.request('/notifications/list/', {
      method: 'GET',
    }),

  // Reports
  createReport: (reportData) =>
    api.request('/reports/create/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  getAdminReports: (status = null, type = null) => {
    let url = '/admin/reports/';
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    if (params.toString()) url += '?' + params.toString();
    return api.request(url, { method: 'GET' });
  },

  getAdminReportDetail: (reportId) =>
    api.request(`/admin/reports/${reportId}/`, {
      method: 'GET',
    }),

  updateAdminReport: (reportId, data) =>
    api.request(`/admin/reports/${reportId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAdminReportsStats: () =>
    api.request('/admin/reports/stats/', {
      method: 'GET',
    }),

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

  // Search by hashtag
  searchByHashtag: (hashtag) =>
    api.request(`/reels/?hashtags__icontains=${encodeURIComponent(hashtag)}`),

  // Follow/Unfollow
  toggleFollow: (userId) =>
    api.request('/follows/toggle/', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    }),

  getFollowers: (userId) => api.request(`/follows/?following=${userId}`),

  getFollowing: (userId) => api.request(`/follows/?follower=${userId}`),

  getUserSuggestions: () => api.request('/follows/suggestions/'),

  // Search
  search: (query) => api.request(`/search/?q=${encodeURIComponent(query)}`),

  // Get user by ID or username
  getUser: (userId) => api.request(`/profile/${userId}/`),
  
  // Comments with likes and replies
  getComments: (reelId) => api.request(`/comments/?reel=${reelId}`),
  
  likeComment: (commentId) =>
    api.request(`/comments/${commentId}/like/`, {
      method: 'POST',
    }),
  
  replyToComment: (commentId, text) =>
    api.request(`/comments/${commentId}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  
  // Saved posts
  getSavedPosts: () => api.request('/saved/'),
  
  toggleSavePost: (reelId) =>
    api.request('/saved/toggle/', {
      method: 'POST',
      body: JSON.stringify({ reel_id: reelId }),
    }),
  
  // Profile photo upload
  uploadProfilePhoto: (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    return fetch(`${API_BASE_URL}/profile-photo/upload/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
      },
      body: formData,
    }).then(r => r.json());
  },
  
  // Update profile with bio and name
  updateUserProfile: (data) => {
    const formData = new FormData();
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.bio) formData.append('bio', data.bio);
    if (data.profile_photo) formData.append('profile_photo', data.profile_photo);
    
    return fetch(`${API_BASE_URL}/profile/update_profile/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${authToken}`,
      },
      body: formData,
    }).then(r => r.json());
  },
  
  // Get user's posts
  getUserPosts: (userId) => api.request(`/reels/?user=${userId}`),
  
  // Get saved posts
  getSavedPosts: () => api.request('/reels/?saved=true'),
  getUserSavedPosts: () => api.request('/reels/?saved=true'),

  // Messaging
  getConversations: () => api.request('/conversations/'),
  
  getContacts: (search = '') => {
    const url = search ? `/conversations/contacts/?search=${encodeURIComponent(search)}` : '/conversations/contacts/';
    return api.request(url);
  },
  
  startConversation: (recipientId) =>
    api.request('/conversations/start/', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId }),
    }),
  
  getMessages: (conversationId) => 
    api.request(`/messages/?conversation=${conversationId}`),
  
  sendMessage: (conversationId, text, files = [], reelId = null) => {
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('text', text);
    
    // Detect message type from files
    let messageType = 'text';
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) messageType = 'audio';
      else if (file.type.startsWith('video/')) messageType = 'video';
      else messageType = 'image';
    }
    formData.append('message_type', messageType);
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (reelId) {
      formData.append('reel_id', reelId);
    }
    
    const token = api.getToken();
    console.log('🚀 SENDING MESSAGE:', {
      conversationId,
      text,
      filesCount: files.length,
      reelId,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 10) + '...' : 'NONE'
    });
    
    if (!token) {
      console.error('❌ NO AUTH TOKEN AVAILABLE FOR MESSAGE SEND!');
      return Promise.reject(new Error('Authentication required'));
    }
    
    // Additional validation: ensure we're not accidentally using admin token
    const adminToken = localStorage.getItem('adminToken');
    if (token === adminToken) {
      console.error('🚨 ERROR: Attempting to send message with admin token!');
      console.error('This would cause the message to appear as from admin instead of the actual user');
      return Promise.reject(new Error('Invalid authentication: admin token detected in user context'));
    }
    
    return fetch(`${API_BASE_URL}/messages/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData,
    }).then(async r => {
      console.log('📨 Message response status:', r.status);
      const data = await r.json();
      if (!r.ok) {
        console.error('🚨 Message send error:', data);
        throw new Error(JSON.stringify(data));
      }
      console.log('✅ Message sent successfully:', data);
      
      // Additional verification: ensure the returned message has the correct sender
      if (data.sender && data.sender.username === 'admin') {
        console.warn('⚠️ WARNING: Message was sent but shows admin as sender!');
        console.warn('This indicates a token confusion issue. Check localStorage tokens.');
      }
      
      return data;
    });
  },
  
  markConversationRead: (conversationId) =>
    api.request('/messages/mark_conversation_read/', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId }),
    }),
  
  // Calls
  initiateCall: (conversationId, callType = 'audio') =>
    api.request('/calls/initiate/', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, call_type: callType }),
    }),
  
  updateCallStatus: (callId, status) =>
    api.request(`/calls/${callId}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
  
  getCalls: () => api.request('/calls/'),
  
  // Message operations
  updateMessage: (messageId, text) =>
    api.request(`/messages/${messageId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ text }),
    }),
  
  addReaction: (messageId, emoji) =>
    api.request(`/messages/${messageId}/reactions/`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
  
  removeReaction: (messageId, emoji) =>
    api.request(`/messages/${messageId}/reactions/`, {
      method: 'DELETE',
      body: JSON.stringify({ emoji }),
    }),

  // Notification management
  markNotificationAsRead: (notificationId) =>
    api.request(`/notifications/${notificationId}/read/`, {
      method: 'POST',
    }),

  markAllNotificationsAsRead: () =>
    api.request('/notifications/mark_all_read/', {
      method: 'POST',
    }),

  deleteNotification: (notificationId) =>
    api.request(`/notifications/${notificationId}/`, {
      method: 'DELETE',
    }),

  // Real-time notification settings
  updateNotificationSettings: (settings) =>
    api.request('/notifications/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getNotificationSettings: () => api.request('/notifications/settings/'),
};

export default api;
