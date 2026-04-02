import { useState, useEffect, useCallback, useRef } from 'react';
import WebRTCService from '../services/WebRTCService';
import CallSignalingService from '../services/CallSignalingService';
import api from '../api';

export function useCallManager(user) {
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isInCall, setIsInCall] = useState(false);
  
  const webrtcService = useRef(null);
  const signalingService = useRef(null);

  useEffect(() => {
    if (!user) return;

    console.log('🎤 Initializing call manager for user:', user.username);
    
    // Initialize services
    webrtcService.current = new WebRTCService();
    signalingService.current = new CallSignalingService();
    
    // Make WebRTC service globally accessible for VideoCallInterface
    window.callWebrtcService = webrtcService.current;

    // Setup signaling callbacks
    signalingService.current.onIncomingCall = handleIncomingCall;
    signalingService.current.onCallAccepted = handleCallAccepted;
    signalingService.current.onCallDeclined = handleCallDeclined;
    signalingService.current.onCallEnded = handleCallEnded;
    signalingService.current.onOffer = handleOffer;
    signalingService.current.onAnswer = handleAnswer;
    signalingService.current.onIceCandidate = handleIceCandidate;

    // Poll for incoming calls (fallback for WebSocket issues)
    const pollInterval = setInterval(async () => {
      try {
        const calls = await api.getCalls();
        const incomingCalls = calls.filter(call => 
          call.receiver.id === user.id && 
          ['initiated', 'ringing'].includes(call.status)
        );
        
        if (incomingCalls.length > 0 && !incomingCall) {
          const latestCall = incomingCalls[0];
          console.log('📞 Found incoming call:', latestCall);
          setIncomingCall(latestCall);
          playNotificationSound();
        }
      } catch (error) {
        console.log('Error polling calls:', error);
      }
    }, 3000);

    // Load call history
    loadCallHistory();

    return () => {
      clearInterval(pollInterval);
      if (signalingService.current) {
        signalingService.current.disconnect();
      }
      if (webrtcService.current) {
        webrtcService.current.endCall();
      }
    };
  }, [user]);

  const loadCallHistory = async () => {
    try {
      const calls = await api.getCalls();
      setCallHistory(calls);
    } catch (error) {
      console.error('Error loading call history:', error);
    }
  };

  const handleIncomingCall = useCallback((callData) => {
    console.log('Incoming call received:', callData);
    setIncomingCall(callData);
    
    // Play notification sound (you can implement this)
    playNotificationSound();
  }, []);

  const handleCallAccepted = useCallback((callData) => {
    console.log('Call accepted:', callData);
    // Update active call status
    setActiveCall(prev => prev ? { ...prev, status: 'ongoing' } : null);
    setIsInCall(true);
  }, []);

  const handleCallDeclined = useCallback((callData) => {
    console.log('Call declined:', callData);
    setActiveCall(null);
    setIncomingCall(null);
    setIsInCall(false);
  }, []);

  const handleCallEnded = useCallback((callData) => {
    console.log('Call ended:', callData);
    setActiveCall(null);
    setIncomingCall(null);
    setIsInCall(false);
    
    // Clean up WebRTC
    if (webrtcService.current) {
      webrtcService.current.endCall();
    }
    
    // Reload call history
    loadCallHistory();
  }, []);

  const handleOffer = useCallback(async (offer, callId) => {
    try {
      if (!webrtcService.current) {
        await webrtcService.current.initializeLocalStream(true, true);
      }
      
      webrtcService.current.createPeerConnection();
      const answer = await webrtcService.current.createAnswer(offer);
      
      // Send answer back
      const targetUserId = incomingCall?.caller?.id;
      if (targetUserId) {
        signalingService.current.sendAnswer(answer, callId, targetUserId);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [incomingCall]);

  const handleAnswer = useCallback(async (answer, callId) => {
    try {
      await webrtcService.current.handleAnswer(answer);
      setIsInCall(true);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate, callId) => {
    try {
      await webrtcService.current.handleIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  const initiateCall = async (conversationId, callType = 'video') => {
    try {
      console.log('📞 Initiating call:', { conversationId, callType });
      
      // Create call via API
      const callData = await api.initiateCall(conversationId, callType);
      console.log('✅ Call created via API:', callData);
      
      // Initialize local media for caller
      await webrtcService.current.initializeLocalStream(callType === 'video', true);
      webrtcService.current.createPeerConnection();
      
      // Create and store offer for when receiver accepts
      const offer = await webrtcService.current.createOffer();
      webrtcService.current.offer = offer; // Store for later
      
      setActiveCall(callData);
      setIsInCall(true);
      
      return callData;
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      throw error;
    }
  };

  const acceptIncomingCall = async () => {
    try {
      if (!incomingCall || !webrtcService.current) return;
      
      // Initialize local media for receiver
      await webrtcService.current.initializeLocalStream(incomingCall.call_type === 'video', true);
      webrtcService.current.createPeerConnection();
      
      // Update call status via API
      await api.updateCallStatus(incomingCall.id, 'ongoing');
      
      // Add call started message to chat
      const callMessage = {
        id: `call-started-${Date.now()}`,
        text: `📞 ${incomingCall.call_type === 'video' ? 'Video' : 'Audio'} call started`,
        sender: { username: 'System' },
        created_at: new Date().toISOString(),
        isCallEvent: true,
        callData: incomingCall,
        event: 'started'
      };
      
      // This would need to be passed to the parent component
      if (window.onCallMessage) {
        window.onCallMessage(callMessage);
      }
      
      setActiveCall(incomingCall);
      setIncomingCall(null);
      setIsInCall(true);
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const declineIncomingCall = async () => {
    try {
      if (!incomingCall) return;
      
      console.log('❌ Declining call:', incomingCall);
      
      // Update call status via API
      await api.updateCallStatus(incomingCall.id, 'declined');
      
      // Add call declined message to chat
      const callMessage = {
        id: `call-declined-${Date.now()}`,
        text: `📞 Call declined`,
        sender: { username: 'System' },
        created_at: new Date().toISOString(),
        isCallEvent: true,
        callData: incomingCall,
        event: 'declined'
      };
      
      if (window.onCallMessage) {
        window.onCallMessage(callMessage);
      }
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const endCall = async () => {
    try {
      if (!activeCall) return;
      
      console.log('🔚 Ending call:', activeCall);
      
      // Update call status via API
      const updatedCall = await api.updateCallStatus(activeCall.id, 'ended');
      
      // Add call ended message to chat
      const duration = updatedCall.duration > 0 ? ` (${Math.floor(updatedCall.duration / 60)}m ${updatedCall.duration % 60}s)` : '';
      const callMessage = {
        id: `call-ended-${Date.now()}`,
        text: `📞 Call ended${duration}`,
        sender: { username: 'System' },
        created_at: new Date().toISOString(),
        isCallEvent: true,
        callData: updatedCall,
        event: 'ended'
      };
      
      if (window.onCallMessage) {
        window.onCallMessage(callMessage);
      }
      
      setActiveCall(null);
      setIncomingCall(null);
      setIsInCall(false);
      
      // Reload call history
      loadCallHistory();
      
      return updatedCall;
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const toggleAudio = () => {
    if (webrtcService.current) {
      return webrtcService.current.toggleAudio();
    }
    return false;
  };

  const toggleVideo = () => {
    if (webrtcService.current) {
      return webrtcService.current.toggleVideo();
    }
    return false;
  };

  const switchCamera = async () => {
    if (webrtcService.current) {
      return await webrtcService.current.switchCamera();
    }
    return null;
  };

  const getConnectionStats = async () => {
    if (webrtcService.current) {
      return await webrtcService.current.getConnectionStats();
    }
    return null;
  };

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const getCallDuration = () => {
    if (!activeCall || !activeCall.started_at) return 0;
    
    const startTime = new Date(activeCall.started_at);
    const now = new Date();
    return Math.floor((now - startTime) / 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // State
    activeCall,
    incomingCall,
    callHistory,
    isInCall,
    
    // Actions
    initiateCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleAudio,
    toggleVideo,
    switchCamera,
    
    // Utilities
    getConnectionStats,
    getCallDuration,
    formatDuration,
    loadCallHistory,
    
    // WebRTC services (for advanced usage)
    webrtcService: webrtcService.current,
    signalingService: signalingService.current,
  };
}
