class CallSignalingService {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.onIncomingCall = null;
    this.onCallAccepted = null;
    this.onCallDeclined = null;
    this.onCallEnded = null;
    this.onIceCandidate = null;
    this.onOffer = null;
    this.onAnswer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(user, token) {
    this.currentUser = user;
    
    // Use WebSocket with authentication
    const wsUrl = `ws://localhost:8000/ws/calls/?token=${token}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('✅ Call signaling connected for user:', user.username);
      this.reconnectAttempts = 0;
      
      // Send user identification
      this.send({
        type: 'identify',
        user_id: user.id,
        username: user.username
      });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('❌ Call signaling disconnected');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.currentUser && localStorage.getItem('authToken')) {
          this.connect(this.currentUser, localStorage.getItem('authToken'));
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  handleMessage(data) {
    console.log('Received signaling message:', data.type);

    switch (data.type) {
      case 'incoming_call':
        if (this.onIncomingCall) {
          this.onIncomingCall(data.call);
        }
        break;

      case 'call_accepted':
        if (this.onCallAccepted) {
          this.onCallAccepted(data.call);
        }
        break;

      case 'call_declined':
        if (this.onCallDeclined) {
          this.onCallDeclined(data.call);
        }
        break;

      case 'call_ended':
        if (this.onCallEnded) {
          this.onCallEnded(data.call);
        }
        break;

      case 'offer':
        if (this.onOffer) {
          this.onOffer(data.offer, data.call_id);
        }
        break;

      case 'answer':
        if (this.onAnswer) {
          this.onAnswer(data.answer, data.call_id);
        }
        break;

      case 'ice_candidate':
        if (this.onIceCandidate) {
          this.onIceCandidate(data.candidate, data.call_id);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }

  initiateCall(callData) {
    this.send({
      type: 'initiate_call',
      call: callData
    });
  }

  acceptCall(callId) {
    this.send({
      type: 'accept_call',
      call_id: callId
    });
  }

  declineCall(callId) {
    this.send({
      type: 'decline_call',
      call_id: callId
    });
  }

  endCall(callId) {
    this.send({
      type: 'end_call',
      call_id: callId
    });
  }

  sendOffer(offer, callId, targetUserId) {
    this.send({
      type: 'offer',
      offer: offer,
      call_id: callId,
      target_user_id: targetUserId
    });
  }

  sendAnswer(answer, callId, targetUserId) {
    this.send({
      type: 'answer',
      answer: answer,
      call_id: callId,
      target_user_id: targetUserId
    });
  }

  sendIceCandidate(candidate, callId, targetUserId) {
    this.send({
      type: 'ice_candidate',
      candidate: candidate,
      call_id: callId,
      target_user_id: targetUserId
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default CallSignalingService;
