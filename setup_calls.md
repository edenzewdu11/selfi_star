# Video/Audio Calling Setup Guide

## 🚀 Complete Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Redis (Required for WebSocket signaling)

**Windows:**
```bash
# Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
# Or use WSL/Linux
```

**Mac:**
```bash
brew install redis
```

**Linux:**
```bash
sudo apt-get install redis-server
# or
sudo yum install redis
```

### 3. Start Redis Server

```bash
redis-server
```

### 4. Start Django Backend with WebSocket Support

```bash
cd backend
python manage.py runserver
```

**Note:** Django will now automatically use the ASGI application for WebSocket support.

### 5. Start Frontend Development Server

```bash
cd src
npm start
# or your preferred dev server command
```

## 🎯 Testing the Calling Feature

### Step 1: Login as Demo User
- Email: `demo@example.com`
- Password: `demo12345`

### Step 2: Start a Conversation
1. Go to Messages
2. Click "New Message"
3. Select a contact (eden11131000 or test users)
4. Start chatting

### Step 3: Initiate a Call
1. In the chat interface, click the phone icon (audio) or video icon (video)
2. The call interface will open
3. For testing with two users:
   - Open two browser windows/incognito windows
   - Login as different users
   - One user initiates call
   - Other user should see incoming call notification

## 🎨 Features Implemented

### ✅ Core Features
- **WebRTC Real-time Communication** - Video and audio calls
- **WebSocket Signaling** - Call setup and negotiation
- **Call State Management** - Initiate, accept, decline, end calls
- **Incoming Call UI** - Beautiful call receiving interface
- **Active Call UI** - Full-screen video call interface

### ✅ Call Controls
- **Mute/Unmute** - Toggle audio
- **Video On/Off** - Toggle video
- **Screen Sharing** - Share your screen (Chrome/Firefox)
- **Camera Switch** - Front/back camera (mobile)
- **End Call** - Properly terminate calls

### ✅ User Experience
- **Call Duration Timer** - Shows call length
- **Connection Quality** - Displays connection status
- **Picture-in-Picture** - Local video preview
- **Responsive Design** - Works on desktop and mobile
- **Call History** - Track previous calls

### ✅ Technical Features
- **STUN Servers** - NAT traversal for WebRTC
- **ICE Candidate Exchange** - Optimal connection path
- **Call Persistence** - Database call records
- **Authentication** - Secure token-based calls
- **Error Handling** - Graceful failure recovery

## 🔧 Configuration

### WebRTC Configuration
The WebRTC service uses Google's STUN servers by default:
```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]
```

### WebSocket Configuration
Signaling uses Redis channel layer:
```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

## 🐛 Troubleshooting

### Issue: "WebRTC not supported"
- **Solution:** Use a modern browser (Chrome, Firefox, Safari, Edge)
- **Check:** Browser supports WebRTC and getUserMedia

### Issue: "Cannot access camera/microphone"
- **Solution:** Grant camera/microphone permissions
- **Check:** HTTPS (localhost is exempt) and browser permissions

### Issue: "WebSocket connection failed"
- **Solution:** Make sure Redis is running on port 6379
- **Check:** Redis server status and Django ASGI configuration

### Issue: "Call not connecting"
- **Solution:** Check network connectivity and firewall settings
- **Check:** STUN server accessibility and ICE negotiation

### Issue: "One-way audio/video"
- **Solution:** Check browser permissions and device selection
- **Check:** WebRTC tracks and stream configuration

## 🚀 Production Deployment

For production deployment, you'll need:

1. **TURN Server** - For NAT traversal in restrictive networks
2. **HTTPS** - Required for WebRTC in production
3. **Scalable Redis** - For multiple WebSocket connections
4. **Load Balancer** - That supports WebSockets
5. **Media Server** - Optional for recording/streaming

## 📱 Mobile Considerations

- **iOS Safari** - Supports WebRTC with limitations
- **Android Chrome** - Full WebRTC support
- **React Native** - Use WebRTC libraries for mobile apps

## 🔐 Security Notes

- Calls are authenticated using Django tokens
- WebRTC traffic is encrypted (SRTP)
- Signaling messages are authenticated
- No media passes through your server (P2P)

---

**Enjoy your video calling feature! 🎥📞**
