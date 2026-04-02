import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, Maximize2, Users, MessageSquare } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import WebRTCService from '../services/WebRTCService';
import CallSignalingService from '../services/CallSignalingService';

export function VideoCallInterface({ 
  call, 
  user, 
  onEndCall, 
  isIncoming = false,
  onAcceptCall,
  onDeclineCall 
}) {
  const { colors: T } = useTheme();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');

  const webrtcService = useRef(null);
  const signalingService = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    if (!call) return;

    // Initialize local video when call is active
    initializeCall();

    // Simulate connection after a short delay
    setTimeout(() => {
      setIsConnected(true);
      startDurationTimer();
    }, 1000);

    return () => {
      cleanup();
    };
  }, [call]);

  useEffect(() => {
    if (isIncoming && call) {
      // Handle incoming call UI
      return;
    }
  }, [isIncoming, call]);

  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  };

  const initializeCall = async () => {
    try {
      // Get the WebRTC service from the call manager (global access)
      const webrtc = window.callWebrtcService;
      if (webrtc && webrtc.localStream) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = webrtc.localStream;
        }
        console.log('✅ Local video stream attached');
      }
    } catch (error) {
      console.error('Error initializing call:', error);
    }
  };

  const acceptCall = async () => {
    try {
      console.log('✅ Accepting call in UI');
      
      // Just call the accept callback - the hook handles the API call
      if (onAcceptCall) {
        onAcceptCall();
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const declineCall = async () => {
    try {
      console.log('❌ Declining call in UI');
      
      if (onDeclineCall) {
        onDeclineCall();
      }
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const endCallHandler = async () => {
    try {
      console.log('🔚 Ending call in UI');
      
      if (onEndCall) {
        onEndCall();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const toggleMute = () => {
    const webrtc = window.callWebrtcService;
    if (webrtc) {
      const newMutedState = webrtc.toggleAudio();
      setIsMuted(!newMutedState);
    }
  };

  const toggleVideo = () => {
    const webrtc = window.callWebrtcService;
    if (webrtc) {
      const newVideoState = webrtc.toggleVideo();
      setIsVideoOff(!newVideoState);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await webrtcService.current.switchCamera(); // Switch back to camera
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = webrtcService.current.peerConnection.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
          setIsScreenSharing(true);
          
          // Stop screen share when user ends it
          videoTrack.onended = () => {
            setIsScreenSharing(false);
            // Switch back to camera
            webrtcService.current.switchCamera();
          };
        }
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const cleanup = () => {
    stopDurationTimer();
    if (webrtcService.current) {
      webrtcService.current.endCall();
    }
    if (signalingService.current) {
      signalingService.current.disconnect();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const otherParticipant = call?.caller?.id === user?.id ? call?.receiver : call?.caller;

  if (isIncoming && !isConnected) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        zIndex: 9999
      }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          marginBottom: 30
        }}>
          👤
        </div>
        
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
          {call?.call_type === 'video' ? 'Video Call' : 'Audio Call'}
        </h2>
        
        <div style={{ fontSize: 24, marginBottom: 40 }}>
          {otherParticipant?.username || 'Unknown'}
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          <button
            onClick={declineCall}
            style={{
              background: '#ff4444',
              border: 'none',
              borderRadius: '50%',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff'
            }}
          >
            <PhoneOff size={28} />
          </button>
          
          <button
            onClick={acceptCall}
            style={{
              background: '#44ff44',
              border: 'none',
              borderRadius: '50%',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#000'
            }}
          >
            <Phone size={28} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999
    }}>
      {/* Remote Video (Full Screen) */}
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        
        {!isConnected && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#fff'
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>📞</div>
            <div style={{ fontSize: 18 }}>
              {isIncoming ? 'Connecting...' : 'Calling...'}
            </div>
          </div>
        )}

        {/* Call Info Overlay */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 5 }}>
            {otherParticipant?.username || 'Unknown'}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            {formatDuration(callDuration)}
          </div>
          {connectionQuality && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>
              Connection: {connectionQuality}
            </div>
          )}
        </div>
      </div>

      {/* Local Video (Picture-in-Picture) */}
      {call?.call_type === 'video' && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 150,
          height: 200,
          background: '#333',
          borderRadius: 10,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.2)'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          {isVideoOff && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontSize: 24
            }}>
              📵
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20
      }}>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <button
            onClick={toggleMute}
            style={{
              background: isMuted ? '#ff4444' : 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s'
            }}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {call?.call_type === 'video' && (
            <>
              <button
                onClick={toggleVideo}
                style={{
                  background: isVideoOff ? '#ff4444' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>

              <button
                onClick={toggleScreenShare}
                style={{
                  background: isScreenSharing ? '#44ff44' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <Monitor size={24} />
              </button>
            </>
          )}

          <button
            onClick={endCallHandler}
            style={{
              background: '#ff4444',
              border: 'none',
              borderRadius: '50%',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s'
            }}
          >
            <PhoneOff size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
