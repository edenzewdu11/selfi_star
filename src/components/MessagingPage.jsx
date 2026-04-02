import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Send, Image, Video, Mic, Phone, VideoIcon, Paperclip, Smile, MoreVertical, X, Play, Square, Circle, Camera, Edit, Copy, Forward, Reply } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { getRelativeTime } from "../utils/timeUtils";
import { useCallManager } from "../hooks/useCallManager";
import { VideoCallInterface } from "./VideoCallInterface";

export function MessagingPage({ user, onBack }) {
  const { colors: T } = useTheme();
  const [view, setView] = useState("list"); // list, chat, contacts
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedReel, setSelectedReel] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [showReactions, setShowReactions] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastFetchRef = useRef(0);
  const [videoThumbnails, setVideoThumbnails] = useState({});

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingTime, setVoiceRecordingTime] = useState(0);
  const voiceRecorderRef = useRef(null);
  const voiceChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);

  // Video recording state
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoRecordingTime, setVideoRecordingTime] = useState(0);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const videoRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const videoTimerRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Use call manager hook
  const {
    activeCall,
    incomingCall,
    isInCall,
    initiateCall,
    acceptIncomingCall,
    declineIncomingCall,
    endCall,
    toggleAudio,
    toggleVideo,
    callHistory,
  } = useCallManager(user);

  // Add call events to messages
  useEffect(() => {
    if (!selectedConversation) return;

    // Listen for call events and add them as messages
    const handleCallEvent = (event, callData) => {
      const callMessage = {
        id: `call-${callData.id}`,
        text: getCallMessageText(event, callData),
        sender: { username: 'System' },
        created_at: new Date().toISOString(),
        isCallEvent: true,
        callData: callData,
        event: event
      };
      
      setMessages(prev => [...prev, callMessage]);
    };

    // Set up global callback for call messages
    window.onCallMessage = (callMessage) => {
      setMessages(prev => [...prev, callMessage]);
    };

    return () => {
      // Cleanup
      window.onCallMessage = null;
    };
  }, [selectedConversation]);

  const getCallMessageText = (event, callData) => {
    switch (event) {
      case 'missed':
        return `📞 Missed call from ${callData.caller?.username}`;
      case 'declined':
        return `📞 Call declined`;
      case 'ended':
        const duration = callData.duration > 0 ? ` (${Math.floor(callData.duration / 60)}m ${callData.duration % 60}s)` : '';
        return `📞 Call ended${duration}`;
      case 'initiated':
        return `📞 ${callData.call_type === 'video' ? 'Video' : 'Audio'} call...`;
      default:
        return `📞 Call ${event}`;
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Check if we have a target conversation ID to open
      if (window.targetConversationId) {
        console.log('📨 MessagingPage received target conversation ID:', window.targetConversationId);
        // We'll handle this after conversations are loaded
        const handleTargetConversation = () => {
          const interval = setInterval(() => {
            if (conversations.length > 0) {
              clearInterval(interval);
              const targetConv = conversations.find(c => c.id === window.targetConversationId);
              if (targetConv) {
                console.log('📨 Found target conversation:', targetConv);
                handleSelectConversation(targetConv);
                delete window.targetConversationId;
              } else {
                console.log('📨 Target conversation not found, fetching conversations again...');
                fetchConversations();
              }
            }
          }, 500);
          
          // Cleanup after 10 seconds
          setTimeout(() => clearInterval(interval), 10000);
        };
        
        // Start checking after a short delay to let conversations load
        setTimeout(handleTargetConversation, 1000);
      }
    }
  }, [user, conversations]);

  useEffect(() => {
    if (view === "contacts" && user) {
      fetchContacts();
    }
  }, [view, user]);

  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  useEffect(() => {
    if (selectedConversation) {
      console.log("🔄 useEffect: Using conversation ID:", selectedConversation.id);
      
      // Initial fetch
      fetchMessages(selectedConversation.id);
      
      // Set up polling with shorter interval for better real-time experience
      const interval = setInterval(() => {
        if (selectedConversation) {
          console.log("🔄 Polling for new messages...");
          fetchMessages(selectedConversation.id);
        }
      }, 2000); // Poll every 2 seconds for better responsiveness
      
      return () => {
        console.log("🔄 Cleaning up polling interval");
        clearInterval(interval);
      };
    }
  }, [selectedConversation]);

  // Check if user is near bottom of chat
  useEffect(() => {
    const handleScroll = () => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsUserNearBottom(isNearBottom);
      }
    };

    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [selectedConversation]);

  // Auto-scroll only if user is near bottom
  useEffect(() => {
    if (isUserNearBottom) {
      scrollToBottom();
    }
  }, [messages, isUserNearBottom]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      if (messageMenu) {
        setMessageMenu(null);
      }
      if (showReactions) {
        setShowReactions(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && editingMessage) {
        setEditingMessage(null);
        setEditText("");
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [messageMenu, showReactions, editingMessage]);

  // Cleanup thumbnail URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(videoThumbnails).forEach(url => URL.revokeObjectURL(url));
    };
  }, [videoThumbnails]);

  // Handle video stream setup when recorder is shown
  useEffect(() => {
    if (showVideoRecorder && videoPreviewRef.current && videoStreamRef.current) {
      console.log("🎥 Video recorder shown, setting up stream...");
      videoPreviewRef.current.srcObject = videoStreamRef.current;
      videoPreviewRef.current.play().catch(err => {
        console.error("❌ Video play failed in useEffect:", err);
      });
    }
  }, [showVideoRecorder]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const data = await api.request("/conversations/");
      setConversations(data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchContacts = async (search = "") => {
    try {
      setLoading(true);
      console.log("Fetching contacts with search:", search);
      const data = await api.getContacts(search);
      console.log("Contacts received:", data);
      setContacts(data || []);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const processEditNotification = (messageText) => {
    if (messageText && messageText.startsWith('EDIT_MESSAGE:')) {
      try {
        const parts = messageText.split(':');
        if (parts.length >= 3) {
          const messageSignature = parts.slice(1, -1).join(':');
          const jsonPart = parts.slice(-1).join(':');
          
          // Only try to parse if it looks like valid JSON
          if (jsonPart.startsWith('{') && jsonPart.endsWith('}')) {
            const editData = JSON.parse(jsonPart);
            return { messageSignature, editData };
          }
        }
      } catch (e) {
        console.log('Failed to parse edit notification (skipping):', messageText);
      }
    }
    return null;
  };

  const fetchMessages = async (conversationId) => {
    try {
      console.log("🔄 fetchMessages called for conversation:", conversationId);
      
      // Simple rate limiting - don't fetch if we fetched within the last 1 second
      const now = Date.now();
      if (now - lastFetchRef.current < 1000) {
        console.log("🔄 fetchMessages: Rate limited, skipping fetch");
        return;
      }
      lastFetchRef.current = now;
      
      console.log("🔄 fetchMessages: Using conversation ID:", conversationId);
      
      const data = await api.getMessages(conversationId);
      console.log("📨 Fetched messages:", data.length, "messages");
      
      if (!Array.isArray(data)) {
        console.error("❌ Invalid data received from API:", data);
        return;
      }
      
      // Backend returns newest first, reverse to show oldest first
      const newMessages = data.reverse();
      
      // Simple message update - just replace with new messages
      setMessages(newMessages);
      console.log("📨 Updated messages display with", newMessages.length, "messages");
      
    } catch (error) {
      console.error("❌ Failed to fetch messages:", error);
      // Don't clear messages on error, just log it
    }
  };

  const startConversation = async (contactId) => {
    try {
      const data = await api.request("/conversations/start/", {
        method: "POST",
        body: JSON.stringify({ recipient_id: contactId }),
      });
      setSelectedConversation(data);
      setView("chat");
      fetchConversations();
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setView("chat");
    fetchMessages(conv.id);
    
    // If forwarding a message, send it to this conversation
    if (forwardMessage) {
      const forwardText = `📎 Forwarded from ${forwardMessage.sender?.username}:\n"${forwardMessage.text}"`;
      api.sendMessage(conv.id, forwardText, [], null);
      setForwardMessage(null);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0 && !selectedReel) {
      console.log("No message to send");
      return;
    }

    let finalText = messageText;
    
    // Add reply prefix if replying to a message
    if (replyToMessage) {
      finalText = `↪ Replying to ${replyToMessage.sender}:\n"${replyToMessage.text}"\n\n${messageText}`;
    }

    console.log("🚀 SENDING MESSAGE:", {
      conversationId: selectedConversation?.id,
      text: finalText,
      filesCount: selectedFiles.length,
      fileDetails: selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
      reelId: selectedReel?.id,
      replyTo: replyToMessage?.id,
      hasConversation: !!selectedConversation
    });

    if (!selectedConversation) {
      console.error("❌ No selected conversation!");
      alert("Please select a conversation first.");
      return;
    }

    if (!selectedConversation.id) {
      console.error("❌ No conversation ID!");
      alert("Invalid conversation.");
      return;
    }

    const conversationIdToUse = selectedConversation.id;
    console.log("📨 Using conversation ID:", conversationIdToUse);
    
    // DEBUG: Log the exact data being sent
    const debugData = {
      conversation_id: conversationIdToUse,
      text: finalText,
      message_type: selectedFiles.length > 0 ? 
        (selectedFiles[0].type.startsWith('audio/') ? 'audio' : 
         selectedFiles[0].type.startsWith('video/') ? 'video' : 'image') : 'text'
    };
    console.log("🔍 DEBUG: Data being sent to API:", debugData);

    try {
      const result = await api.sendMessage(
        conversationIdToUse,
        finalText,
        selectedFiles,
        selectedReel?.id
      );
      
      console.log("✅ Message sent successfully:", result);
      console.log("📨 Message details:", {
        id: result.id,
        sender: result.sender?.username,
        text: result.text,
        conversation: result.conversation
      });

      // Only clear files AFTER successful upload
      setMessageText("");
      setSelectedFiles([]);
      setSelectedReel(null);
      setReplyToMessage(null);
      
      // Immediately fetch messages to show the sent message
      fetchMessages(conversationIdToUse);
      fetchConversations();
      
      // Trigger global notification refresh to update badge immediately
      if (window.refreshNotifications) {
        window.refreshNotifications();
      }
      
      // Mark the correct conversation as read - TEMPORARILY DISABLED
      // await api.markConversationRead(conversationIdToUse);
      console.log("⚠️ markConversationRead temporarily disabled in sendMessage");
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      alert("Failed to send message: " + error.message);
      // Don't clear files on error - let user try again
    }
  };

  const generateVideoThumbnail = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/')) {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = 160;
      canvas.height = 90;
      
      // Seek to 1 second (or first frame if video is shorter)
      const seekTime = Math.min(1, video.duration);
      video.currentTime = seekTime;
    };
    
    video.onseeked = () => {
      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        const thumbnailUrl = URL.createObjectURL(blob);
        resolve(thumbnailUrl);
        URL.revokeObjectURL(video.src); // Clean up video URL
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(video.src); // Clean up video URL
    };
  });
};

const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    console.log("📁 Files selected:", files.length, files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Validate file sizes (max 10MB for images, 50MB for videos, 5MB for audio)
    const validFiles = files.filter(file => {
      const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : // 10MB
                     file.type.startsWith('video/') ? 50 * 1024 * 1024 : // 50MB
                     file.type.startsWith('audio/') ? 5 * 1024 * 1024 :  // 5MB
                     10 * 1024 * 1024; // Default 10MB
      
      if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const limitMB = (maxSize / (1024 * 1024)).toFixed(0);
        alert(`File "${file.name}" is too large (${sizeMB}MB). Maximum size is ${limitMB}MB for ${file.type.split('/')[0]} files.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      
      // Generate thumbnails for video files
      const thumbnails = {};
      for (const file of validFiles) {
        if (file.type.startsWith('video/')) {
          const thumbnail = await generateVideoThumbnail(file);
          if (thumbnail) {
            thumbnails[file.name + file.size] = thumbnail;
          }
        }
      }
      setVideoThumbnails(thumbnails);
    }
  };

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ─── Voice Recording ───
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      voiceChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      voiceRecorderRef.current = recorder;
      setIsRecordingVoice(true);
      setVoiceRecordingTime(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required to record voice messages.");
    }
  };

  const stopAndSendVoice = async () => {
    if (!voiceRecorderRef.current) return;
    clearInterval(voiceTimerRef.current);
    const recorder = voiceRecorderRef.current;
    return new Promise((resolve) => {
      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        setIsRecordingVoice(false);
        setVoiceRecordingTime(0);
        try {
          await api.sendMessage(selectedConversation.id, "", [file]);
          fetchMessages(selectedConversation.id);
          fetchConversations();
        } catch (err) {
          console.error("Failed to send voice message:", err);
          alert("Failed to send voice message.");
        }
        resolve();
      };
      recorder.stop();
    });
  };

  const cancelVoiceRecording = () => {
    if (!voiceRecorderRef.current) return;
    clearInterval(voiceTimerRef.current);
    voiceRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    voiceRecorderRef.current.stop();
    voiceChunksRef.current = [];
    setIsRecordingVoice(false);
    setVoiceRecordingTime(0);
  };

  // ─── Video Recording ───
  const getSupportedVideoMimeType = () => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const openVideoRecorder = async () => {
    try {
      console.log("🎥 Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: true,
      });
      console.log("✅ Camera access granted, stream:", stream);
      console.log("📹 Video tracks:", stream.getVideoTracks());
      console.log("🎤 Audio tracks:", stream.getAudioTracks());
      
      videoStreamRef.current = stream;
      setShowVideoRecorder(true);
      
      // Give the video element time to render before setting the stream
      setTimeout(() => {
        if (videoPreviewRef.current && videoStreamRef.current) {
          console.log("🔗 Setting video stream to element (retry)...");
          videoPreviewRef.current.srcObject = videoStreamRef.current;
          videoPreviewRef.current.play().catch(err => {
            console.error("❌ Video play failed (retry):", err);
          });
        } else {
          console.error("❌ Video element or stream not available for retry");
        }
      }, 200);
      
      // Additional retry with longer delay
      setTimeout(() => {
        if (videoPreviewRef.current && videoStreamRef.current && !videoPreviewRef.current.srcObject) {
          console.log("🔗 Final retry: Setting video stream...");
          videoPreviewRef.current.srcObject = videoStreamRef.current;
          videoPreviewRef.current.play().catch(err => {
            console.error("❌ Final video play failed:", err);
          });
        }
      }, 500);
      
    } catch (err) {
      console.error("❌ Camera/mic access denied:", err);
      alert("Camera and microphone access is required to record video messages. Please allow access when prompted.");
    }
  };

  const startVideoRecording = () => {
    if (!videoStreamRef.current) return;
    const mimeType = getSupportedVideoMimeType();
    const options = mimeType ? { mimeType } : {};
    let recorder;
    try {
      recorder = new MediaRecorder(videoStreamRef.current, options);
    } catch (err) {
      console.error("MediaRecorder creation failed:", err);
      alert("Video recording is not supported in this browser.");
      return;
    }
    videoChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };
    recorder.start(1000);
    videoRecorderRef.current = recorder;
    setIsRecordingVideo(true);
    setVideoRecordingTime(0);
    videoTimerRef.current = setInterval(() => {
      setVideoRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopAndSendVideo = async () => {
    if (!videoRecorderRef.current || videoRecorderRef.current.state === "inactive") return;
    clearInterval(videoTimerRef.current);
    const recorder = videoRecorderRef.current;
    const mimeType = recorder.mimeType || "video/webm";
    return new Promise((resolve) => {
      recorder.onstop = async () => {
        const chunks = [...videoChunksRef.current];
        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `video_${Date.now()}.${ext}`, { type: mimeType });
        // Clean up camera stream and UI
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach((t) => t.stop());
          videoStreamRef.current = null;
        }
        videoRecorderRef.current = null;
        videoChunksRef.current = [];
        setShowVideoRecorder(false);
        setIsRecordingVideo(false);
        setVideoRecordingTime(0);
        try {
          await api.sendMessage(selectedConversation.id, "", [file]);
          fetchMessages(selectedConversation.id);
          fetchConversations();
        } catch (err) {
          console.error("Failed to send video message:", err);
          alert("Failed to send video message.");
        }
        resolve();
      };
      recorder.stop();
    });
  };

  const closeVideoRecorder = () => {
    clearInterval(videoTimerRef.current);
    if (videoRecorderRef.current && videoRecorderRef.current.state !== "inactive") {
      videoRecorderRef.current.stop();
    }
    videoRecorderRef.current = null;
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    videoChunksRef.current = [];
    setShowVideoRecorder(false);
    setIsRecordingVideo(false);
    setVideoRecordingTime(0);
  };

  const handleInitiateCall = async (type) => {
    try {
      await initiateCall(selectedConversation.id, type);
    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  
  const handleEndCall = async () => {
    try {
      const callData = await endCall();
      
      // Add call ended message to chat
      const callMessage = {
        id: `call-ended-${Date.now()}`,
        text: getCallMessageText('ended', callData),
        sender: { username: 'System' },
        created_at: new Date().toISOString(),
        isCallEvent: true,
        callData: callData,
        event: 'ended'
      };
      
      setMessages(prev => [...prev, callMessage]);
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  };

  // Message actions
  const handleMessageMenu = (e, message) => {
    e.preventDefault();
    e.stopPropagation();
    setMessageMenu({ x: e.clientX, y: e.clientY, message });
  };

  const closeMessageMenu = () => {
    setMessageMenu(null);
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
    setMessageMenu(null);
  };

  const handleSaveEdit = async () => {
    try {
      // Update locally first for immediate feedback
      const updatedMessage = { ...editingMessage, text: editText, edited: true, edited_at: new Date().toISOString() };
      setMessages(prev => 
        prev.map(msg => 
          msg.id === editingMessage.id ? updatedMessage : msg
        )
      );
      
      // Send edit notification in a structured format for processing
      try {
        if (editingMessage.text !== editText) {
          // Create a unique signature for the message using sender, text, and time
          const messageSignature = `${editingMessage.sender?.username}:${editingMessage.text}:${editingMessage.created_at}`;
          const editNotification = `EDIT_MESSAGE:${messageSignature}:${JSON.stringify({
            old: editingMessage.text, 
            new: editText, 
            sender: editingMessage.sender?.username,
            timestamp: editingMessage.created_at
          })}`;
          await api.sendMessage(selectedConversation.id, editNotification, [], null);
        }
      } catch (apiError) {
        console.log("Failed to send edit notification:", apiError);
      }
      
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleCopyMessage = (message) => {
    navigator.clipboard.writeText(message.text);
    setMessageMenu(null);
  };

  const handleForwardMessage = (message) => {
    setForwardMessage(message);
    setMessageMenu(null);
    // Navigate to conversation list or show forward modal
    setView("list");
  };

  const handleReplyMessage = (message) => {
    setReplyToMessage({
      id: message.id,
      text: message.text,
      sender: message.sender?.username
    });
    setMessageMenu(null);
    // Focus on input
    document.getElementById('message-input')?.focus();
  };

  const handleAddReaction = (message, emoji) => {
    // Add reaction to message
    const reactions = message.reactions || [];
    const currentUserId = user?.id || user?.userId || user?.username;
    const existingReaction = reactions.find(r => r.emoji === emoji && String(r.user_id) === String(currentUserId));
    
    if (existingReaction) {
      // Remove reaction
      api.removeReaction(message.id, emoji);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { 
              ...msg, 
              reactions: reactions.filter(r => !(r.emoji === emoji && String(r.user_id) === String(currentUserId)))
            } 
          : msg
      ));
    } else {
      // Add reaction
      api.addReaction(message.id, emoji);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { 
              ...msg, 
              reactions: [...reactions.filter(r => r.emoji !== emoji), { emoji, user_id: currentUserId, username: user.username }]
            } 
          : msg
      ));
    }
    setShowReactions(null);
  };

  const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '👏'];

  const clearReply = () => {
    setReplyToMessage(null);
  };

  const clearForward = () => {
    setForwardMessage(null);
  };

  const renderConversationList = () => (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button onClick={onBack} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          display: "flex",
          color: T.txt,
        }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1, fontSize: 20, fontWeight: 700, color: T.txt }}>
          Messages {forwardMessage && `(Forwarding to...)`}
        </div>
        <button onClick={() => { 
          setContactSearchQuery("");
          setView("contacts"); 
        }} style={{
          background: T.pri,
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}>
          New Message
        </button>
      </div>

      <div style={{ padding: "12px 20px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.bg,
          borderRadius: 12,
          padding: "10px 14px",
        }}>
          <Search size={18} color={T.sub} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              outline: "none",
              fontSize: 14,
              color: T.txt,
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {conversations.filter(conv => 
          conv.other_participant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((conv) => (
          <div
            key={conv.id}
            onClick={() => {
              setSelectedConversation(conv);
              setView("chat");
            }}
            style={{
              padding: "12px 20px",
              borderBottom: `1px solid ${T.border}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: conv.unread_count > 0 ? T.bg : "#fff",
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: T.pri + "30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              flexShrink: 0,
            }}>
              👤
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: conv.unread_count > 0 ? 700 : 600,
                  color: T.txt,
                }}>
                  {conv.other_participant?.username || "Unknown"}
                </div>
                {conv.last_message && (
                  <div style={{ fontSize: 12, color: T.sub }}>
                    {getRelativeTime(conv.last_message.created_at)}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 13,
                color: T.sub,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: conv.unread_count > 0 ? 600 : 400,
              }}>
                {conv.last_message?.text || "No messages yet"}
              </div>
            </div>
            {conv.unread_count > 0 && (
              <div style={{
                background: T.pri,
                color: "#fff",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
              }}>
                {conv.unread_count}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContactsList = () => {
    // Fetch contacts immediately when this view renders (only if user is logged in)
    if (contacts.length === 0 && !loading && user) {
      console.log("Contacts list is empty, fetching now...");
      fetchContacts();
    }

    return (
      <>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <button onClick={() => setView("list")} style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            color: T.txt,
          }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 700, color: T.txt }}>
            New Message
          </div>
        </div>

      <div style={{ padding: "12px 20px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.bg,
          borderRadius: 12,
          padding: "10px 14px",
        }}>
          <Search size={18} color={T.sub} />
          <input
            type="text"
            placeholder="Search followers and following..."
            value={contactSearchQuery}
            onChange={(e) => {
              setContactSearchQuery(e.target.value);
              fetchContacts(e.target.value);
            }}
            style={{
              flex: 1,
              border: "none",
              background: "none",
              outline: "none",
              fontSize: 14,
              color: T.txt,
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.sub }}>
            Loading contacts...
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.sub }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              No contacts found
            </div>
            <div style={{ fontSize: 13 }}>
              Follow users to start messaging them
            </div>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => startConversation(contact.id)}
              style={{
                padding: "12px 20px",
                borderBottom: `1px solid ${T.border}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: T.pri + "30",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}>
                👤
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>
                  {contact.username}
                </div>
                <div style={{ fontSize: 13, color: T.sub }}>
                  {contact.first_name} {contact.last_name}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
    );
  };

  const renderChat = () => (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff", position: "relative" }}>
      <div style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "#fff",
      }}>
        <button onClick={() => setView("list")} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
        }}>
          <ArrowLeft size={24} color={T.txt} />
        </button>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: T.pri + "20",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}>
          👤
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.txt }}>
            {selectedConversation?.other_participant?.username}
          </div>
          <div style={{ fontSize: 12, color: T.sub }}>
            Active now
          </div>
        </div>
        <button onClick={() => {
          console.log("🔄 Manual refresh triggered");
          if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            fetchConversations();
          }
        }} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          marginRight: 4,
        }} title="Refresh messages">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.txt} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
        <button onClick={() => setView("call-history")} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          position: "relative",
        }}>
          <Phone size={22} color={T.txt} />
          {callHistory?.length > 0 && (
            <div style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ff4444",
            }} />
          )}
        </button>
        <button onClick={() => handleInitiateCall("video")} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
        }}>
          <VideoIcon size={22} color={T.txt} />
        </button>
      </div>
      
      <div 
        className="messages-container"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          background: T.bg,
        }}
      >
        {console.log("Rendering messages:", messages.length, messages)}
        {console.log("Current user:", user)}
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: T.sub, marginTop: 40 }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            // Improved ID comparison with fallbacks
            const senderId = msg.sender?.id || msg.sender_id || msg.senderUsername;
            const currentUserId = user?.id || user?.userId || user?.username;
            const isOwn = String(senderId) === String(currentUserId);
            
            console.log(`Message ${msg.id}: sender=${senderId} (${msg.sender?.username}), user=${currentUserId} (${user?.username}), isOwn=${isOwn}`);
            console.log(`Message ${msg.id} attachments:`, msg.attachments);
            console.log(`Message ${msg.id} full data:`, JSON.stringify(msg, null, 2));
            const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== msg.sender?.id;

            return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isOwn ? "flex-end" : "flex-start",
                marginBottom: 8,
                gap: 8,
                width: "100%",
              }}
              onContextMenu={(e) => handleMessageMenu(e, msg)}
            >
              {!isOwn && (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: T.pri + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                  visibility: showAvatar ? "visible" : "hidden",
                }}>
                  👤
                </div>
              )}
              
              <div style={{ 
                maxWidth: "65%",
                display: "flex",
                flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start",
              }}>
                {msg.attachments?.map((att) => (
                  <div key={att.id} style={{
                    marginBottom: 4,
                    borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    overflow: "hidden",
                    maxWidth: "100%",
                  }}>
                    {att.attachment_type === "image" && (
                      <img src={att.file_url} alt="" style={{ width: "100%", display: "block" }} />
                    )}
                    {att.attachment_type === "video" && (
                      <video src={att.file_url} controls style={{ width: "100%", display: "block" }} />
                    )}
                    {att.attachment_type === "audio" && (
                      <div style={{
                        background: isOwn ? T.pri : "#E8E8E8",
                        padding: "10px 14px",
                        borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 220,
                      }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: isOwn ? "rgba(255,255,255,0.25)" : T.pri + "20",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <Mic size={18} color={isOwn ? "#fff" : T.pri} />
                        </div>
                        <audio src={att.file_url} controls style={{
                          flex: 1,
                          height: 32,
                          maxWidth: "100%",
                        }} />
                      </div>
                    )}
                    {!att.attachment_type && att.file_url && (
                      // Fallback for attachments without proper type
                      <div>
                        {att.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={att.file_url} alt="" style={{ width: "100%", display: "block" }} />
                        ) : att.file_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <video src={att.file_url} controls style={{ width: "100%", display: "block" }} />
                        ) : (
                          <div style={{
                            background: isOwn ? T.pri : "#E8E8E8",
                            padding: "10px",
                            borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            color: isOwn ? "#fff" : "#000",
                          }}>
                            📎 {att.file_url.split('/').pop()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Debug: Show if message has attachments but they're not being displayed */}
                {process.env.NODE_ENV === 'development' && msg.attachments && msg.attachments.length > 0 && !msg.attachments[0].file_url && (
                  <div style={{
                    background: "#ffeb3b",
                    color: "#000",
                    padding: "8px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    marginBottom: "4px"
                  }}>
                    DEBUG: Attachment exists but no file_url: {JSON.stringify(msg.attachments[0], null, 2)}
                  </div>
                )}
                
                {msg.shared_reels?.map((sr) => (
                  <div key={sr.id} style={{
                    marginBottom: 4,
                    borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    overflow: "hidden",
                    border: `1px solid ${T.border}`,
                    background: isOwn ? T.pri + "10" : "#fff",
                    padding: 12,
                    maxWidth: "100%",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                      Shared Reel
                    </div>
                    {sr.reel.media && (
                      <video src={sr.reel.media} style={{ width: "100%", borderRadius: 8 }} />
                    )}
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 8 }}>
                      {sr.reel.caption}
                    </div>
                  </div>
                ))}
                
                {(msg.edited && editingMessage?.id !== msg.id) && (
                  <div style={{
                    fontSize: 10,
                    color: isOwn ? "#fff" : "#666",
                    fontStyle: "italic",
                    marginBottom: 2,
                    opacity: 0.7,
                  }}>
                    edited
                  </div>
                )}
                {editingMessage?.id === msg.id ? (
                  <div style={{
                    background: isOwn ? T.pri : "#E8E8E8",
                    padding: "8px 12px",
                    borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    maxWidth: "100%",
                    border: "2px solid #007bff",
                  }}>
                    <div style={{ fontSize: 12, color: isOwn ? "#fff" : "#666", marginBottom: 4 }}>
                      Press Enter to save, Esc to cancel
                    </div>
                    <input
                      id={`edit-${msg.id}`}
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          setEditingMessage(null);
                          setEditText("");
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: isOwn ? "#fff" : "#000",
                        fontSize: 15,
                        outline: "none",
                        width: "100%",
                      }}
                      autoFocus
                    />
                  </div>
                ) : msg.text && (
                  <div style={{
                    background: msg.isCallEvent ? "#f0f8ff" : (isOwn ? T.pri : "#E8E8E8"),
                    color: msg.isCallEvent ? "#0066cc" : (isOwn ? "#fff" : "#000"),
                    padding: msg.isCallEvent ? "6px 12px" : "8px 12px",
                    borderRadius: msg.isCallEvent ? "12px" : (isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px"),
                    fontSize: msg.isCallEvent ? 13 : 15,
                    fontWeight: msg.isCallEvent ? 600 : 400,
                    wordBreak: "break-word",
                    boxShadow: msg.isCallEvent ? "0 1px 3px rgba(0,102,204,0.2)" : "0 1px 2px rgba(0,0,0,0.1)",
                    maxWidth: "100%",
                    position: "relative",
                    fontStyle: msg.isCallEvent ? "italic" : "normal",
                    border: msg.isCallEvent ? "1px solid #b3d9ff" : "none",
                  }}>
                    {msg.text}
                    {msg.reactions && msg.reactions.length > 0 && !msg.isCallEvent && (
                      <div style={{
                        marginTop: 4,
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                      }}>
                        {msg.reactions.map((reaction, idx) => (
                          <span
                            key={idx}
                            onClick={() => handleAddReaction(msg, reaction.emoji)}
                            style={{
                              fontSize: 16,
                              cursor: "pointer",
                              background: (() => {
                                const currentUserId = user?.id || user?.userId || user?.username;
                                return String(reaction.user_id) === String(currentUserId) ? T.pri : "#f0f0f0";
                              })(),
                              padding: "2px 6px",
                              borderRadius: "12px",
                              border: "1px solid #ddd",
                            }}
                          >
                            {reaction.emoji} {reaction.count || 1}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 2,
                  paddingLeft: isOwn ? 0 : 4,
                  paddingRight: isOwn ? 4 : 0,
                  position: "relative",
                }}>
                  <div style={{ fontSize: 11, color: T.sub }}>
                    {getRelativeTime(msg.created_at)}
                  </div>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={(e) => handleMessageMenu(e, msg)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 2,
                        opacity: 0.6,
                      }}
                    >
                      <MoreVertical size={14} color={T.sub} />
                    </button>
                    {/* Context Menu */}
                    {messageMenu && messageMenu.message.id === msg.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          [isOwn ? "right" : "left"]: 0,
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          zIndex: 1000,
                          minWidth: "150px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(() => {
                          const senderId = messageMenu.message.sender?.id || messageMenu.message.sender_id || messageMenu.message.senderUsername;
                          const currentUserId = user?.id || user?.userId || user?.username;
                          return String(senderId) === String(currentUserId);
                        })() && (
                          <button
                            onClick={() => handleEditMessage(messageMenu.message)}
                            style={{
                              width: "100%",
                              padding: "10px 16px",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              fontSize: 14,
                              color: "#333",
                            }}
                          >
                            <Edit size={16} /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleCopyMessage(messageMenu.message)}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 14,
                            color: "#333",
                          }}
                        >
                          <Copy size={16} /> Copy
                        </button>
                        <button
                          onClick={() => handleForwardMessage(messageMenu.message)}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 14,
                            color: "#333",
                          }}
                        >
                          <Forward size={16} /> Forward
                        </button>
                        <button
                          onClick={() => handleReplyMessage(messageMenu.message)}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 14,
                            color: "#333",
                          }}
                        >
                          <Reply size={16} /> Reply
                        </button>
                        <div style={{ padding: "4px", borderBottom: "1px solid #eee" }} />
                        <div style={{ padding: "8px" }}>
                          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>React</div>
                          <div style={{ display: "flex", gap: 4 }}>
                            {REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleAddReaction(messageMenu.message, emoji)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  border: "none",
                                  background: "none",
                                  cursor: "pointer",
                                  fontSize: 18,
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {selectedFiles.length > 0 && (
        <div style={{
          padding: "12px 20px",
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          gap: 8,
          overflowX: "auto",
        }}>
          {selectedFiles.map((file, index) => {
            const thumbnailKey = file.name + file.size;
            const thumbnailUrl = videoThumbnails[thumbnailKey];
            
            return (
            <div key={index} style={{
              position: "relative",
              width: 80,
              height: 80,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {file.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(file)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : file.type.startsWith("video/") ? (
                thumbnailUrl ? (
                  <>
                    <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{
                      position: "absolute",
                      top: 50,
                      left: 50,
                      transform: "translate(-50%, -50%)",
                      background: "rgba(0,0,0,0.6)",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Play size={12} color="#fff" fill="#fff" />
                    </div>
                  </>
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    background: T.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Video size={32} color={T.sub} />
                  </div>
                )
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  background: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Mic size={32} color={T.sub} />
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                  // Clean up thumbnail URL if it exists
                  if (thumbnailUrl) {
                    URL.revokeObjectURL(thumbnailUrl);
                    const newThumbnails = { ...videoThumbnails };
                    delete newThumbnails[thumbnailKey];
                    setVideoThumbnails(newThumbnails);
                  }
                }}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <X size={14} />
              </button>
            </div>
          )})}
        </div>
      )}

      {/* Video Recorder Overlay */}
      {showVideoRecorder && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "#000",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Loading indicator */}
          {!videoStreamRef.current && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#fff",
              textAlign: "center",
              zIndex: 1000,
            }}>
              <div style={{
                width: 60,
                height: 60,
                border: "3px solid #fff",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }} />
              <div>Initializing camera...</div>
            </div>
          )}
          
          {/* Video element */}
          <video
            ref={(el) => {
              console.log("📹 Video element ref callback:", el);
              videoPreviewRef.current = el;
              if (el && videoStreamRef.current) {
                console.log("🔗 Setting stream to video element immediately...");
                el.srcObject = videoStreamRef.current;
                el.play().catch(err => {
                  console.error("❌ Immediate video play failed:", err);
                });
              }
            }}
            autoPlay
            muted
            playsInline
            style={{ flex: 1, objectFit: "cover", width: "100%", height: "100%" }}
            onLoadedMetadata={() => {
              console.log("✅ Video metadata loaded");
            }}
            onError={(e) => {
              console.error("❌ Video element error:", e);
            }}
            onPlay={() => {
              console.log("▶️ Video started playing");
            }}
          />
          <div style={{
            position: "absolute",
            top: 16,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 20px",
            zIndex: 101,
          }}>
            <button onClick={closeVideoRecorder} style={{
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}>
              <X size={22} />
            </button>
            {isRecordingVideo && (
              <div style={{
                background: "rgba(0,0,0,0.5)",
                borderRadius: 20,
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#ff4444",
                  animation: "pulse 1s infinite",
                }} />
                {formatRecordingTime(videoRecordingTime)}
              </div>
            )}
          </div>
          <div style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 30,
            zIndex: 101,
          }}>
            {!isRecordingVideo ? (
              <button onClick={startVideoRecording} style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "4px solid #fff",
                background: "#ff4444",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Circle size={28} color="#fff" fill="#fff" />
              </button>
            ) : (
              <button onClick={stopAndSendVideo} style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "4px solid #fff",
                background: "#ff4444",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Square size={24} color="#fff" fill="#fff" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div style={{
        padding: "12px 20px",
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#fff",
      }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,video/*,audio/*"
          style={{ display: "none" }}
        />

        {isRecordingVoice ? (
          <>
            <button onClick={cancelVoiceRecording} style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              color: "#ff4444",
            }}>
              <X size={22} />
            </button>
            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fff0f0",
              borderRadius: 20,
              padding: "10px 16px",
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ff4444",
                animation: "pulse 1s infinite",
              }} />
              <span style={{ fontSize: 14, color: "#ff4444", fontWeight: 600 }}>
                {formatRecordingTime(voiceRecordingTime)}
              </span>
              <span style={{ fontSize: 13, color: T.sub }}>Recording...</span>
            </div>
            <button onClick={stopAndSendVoice} style={{
              background: T.pri,
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}>
              <Send size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                display: "flex",
                color: T.pri,
              }}
            >
              <Image size={22} />
            </button>
            <button
              onClick={() => {
                fileInputRef.current?.click();
                // You could add a filter for video files only if needed
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 8,
                display: "flex",
                color: T.pri,
              }}
            >
              <Video size={22} />
            </button>
            <div style={{ flex: 1, position: "relative" }}>
              {replyToMessage && (
                <div style={{
                  position: "absolute",
                  top: -30,
                  left: 0,
                  right: 0,
                  background: "#007bff",
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: "12px 12px 0 0",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span>↪ Replying to {replyToMessage.sender}</span>
                  <button
                    onClick={clearReply}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {forwardMessage && (
                <div style={{
                  position: "absolute",
                  top: -30,
                  left: 0,
                  right: 0,
                  background: "#28a745",
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: "12px 12px 0 0",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <span>📎 Forwarding from {forwardMessage.sender?.username}</span>
                  <button
                    onClick={clearForward}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <input
                id="message-input"
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: T.txt,
                  background: T.bg,
                  borderRadius: 20,
                  padding: replyToMessage || forwardMessage ? "40px 16px 10px 16px" : "10px 16px",
                }}
              />
            </div>
            <button onClick={startVoiceRecording} style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              color: T.pri,
            }}>
              <Mic size={22} />
            </button>
            <button onClick={openVideoRecorder} style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              display: "flex",
              color: T.pri,
            }}>
              <Camera size={22} />
            </button>
            {(messageText.trim() || selectedFiles.length > 0) && (
              <button
                onClick={sendMessage}
                style={{
                  background: T.pri,
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <Send size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Pulse animation for recording indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

          </div>
  );

  const renderCall = () => (
    <div style={{
      height: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
    }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          margin: "0 auto 20px",
        }}>
          👤
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          {selectedConversation?.other_participant?.username}
        </div>
        <div style={{ fontSize: 16, opacity: 0.9 }}>
          {activeCall?.call_type === "video" ? "Video calling..." : "Calling..."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <button
          onClick={handleEndCall}
          style={{
            background: "#ff4444",
            border: "none",
            borderRadius: "50%",
            width: 64,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
          }}
        >
          <Phone size={28} />
        </button>
      </div>
    </div>
  );

  // Render video call interface if there's an active or incoming call
  if (activeCall || incomingCall) {
    return (
      <>
        <VideoCallInterface
          call={activeCall || incomingCall}
          user={user}
          onEndCall={handleEndCall}
          isIncoming={!!incomingCall}
          onAcceptCall={acceptIncomingCall}
          onDeclineCall={declineIncomingCall}
        />
              </>
    );
  }

  const renderCallHistory = () => (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <button onClick={() => setView("chat")} style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
        }}>
          <ArrowLeft size={24} color={T.txt} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.txt }}>
          Call History
        </div>
      </div>
      
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
      }}>
        {callHistory?.length === 0 ? (
          <div style={{ textAlign: "center", color: T.sub, marginTop: 40 }}>
            No call history
          </div>
        ) : (
          callHistory?.map((call) => (
            <div key={call.id} style={{
              display: "flex",
              alignItems: "center",
              padding: "12px",
              borderBottom: `1px solid ${T.border}`,
              gap: 12,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: call.call_type === "video" ? "#4CAF50" : "#2196F3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 20,
              }}>
                {call.call_type === "video" ? "📹" : "📞"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.txt }}>
                  {call.caller?.id === user?.id ? `Called ${call.receiver?.username}` : `From ${call.caller?.username}`}
                </div>
                <div style={{ fontSize: 14, color: T.sub }}>
                  {getRelativeTime(call.started_at)} • {call.duration > 0 ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : call.status}
                </div>
              </div>
              <div style={{
                padding: "4px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                background: 
                  call.status === "ongoing" ? "#4CAF50" :
                  call.status === "missed" ? "#f44336" :
                  call.status === "declined" ? "#ff9800" :
                  "#9e9e9e",
                color: "#fff",
              }}>
                {call.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (view === "contacts") return renderContactsList();
  if (view === "chat") return renderChat();
  if (view === "call-history") return renderCallHistory();
  return renderConversationList();
}
