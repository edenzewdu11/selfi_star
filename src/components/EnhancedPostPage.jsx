import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Sparkles, X, Play, Square, RotateCw, Check } from "lucide-react";
import api from "../api";

const T = { pri:"#00D4E0", txt:"#FFFFFF", sub:"#7ABFCC", bg:"rgba(0,212,224,0.08)", dark:"#020810", border:"rgba(0,212,224,0.2)" };

const FILTERS = [
  { id: 'none', name: 'Original', filter: 'none' },
  { id: 'grayscale', name: 'B&W', filter: 'grayscale(100%)' },
  { id: 'sepia', name: 'Vintage', filter: 'sepia(80%)' },
  { id: 'warm', name: 'Warm', filter: 'saturate(1.3) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', filter: 'saturate(1.2) hue-rotate(10deg)' },
  { id: 'vibrant', name: 'Vibrant', filter: 'saturate(1.5) contrast(1.1)' },
  { id: 'fade', name: 'Fade', filter: 'brightness(1.1) contrast(0.9)' },
  { id: 'dramatic', name: 'Drama', filter: 'contrast(1.3) brightness(0.9)' },
];

const TEMPLATES = [
  { id: 'story', name: '📱 Story', ratio: '9/16', desc: 'Vertical story format' },
  { id: 'post', name: '📷 Post', ratio: '1/1', desc: 'Square post format' },
  { id: 'landscape', name: '🎬 Landscape', ratio: '16/9', desc: 'Horizontal video' },
  { id: 'reel', name: '🎥 Reel', ratio: '9/16', desc: 'Short-form vertical' },
];

export function EnhancedPostPage({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('upload'); // upload, camera, templates
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Camera states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [isRetryingCamera, setIsRetryingCamera] = useState(false);
  
  // Effects states
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    setIsRetryingCamera(true);
    
    try {
      // First check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Try to get camera permissions with fallback options
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true
        });
      } catch (initialError) {
        console.warn('Initial camera access failed, trying basic settings:', initialError);
        // Fallback to basic camera settings
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      setStream(mediaStream);
      setCameraError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Could not access camera. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is already in use by another application or hardware error. Please close other apps using the camera and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera device found. Please ensure your camera is connected and working.';
      } else if (error.name === 'NotSupportedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera does not support the requested settings. Try a different browser or device.';
      } else if (error.message === 'Camera API not supported in this browser') {
        errorMessage += 'Your browser does not support camera access. Please try a modern browser like Chrome, Firefox, or Safari.';
      } else {
        errorMessage += 'Please check camera permissions and ensure no other app is using the camera.';
      }
      
      setCameraError(errorMessage);
    } finally {
      setIsRetryingCamera(false);
    }
  };

  // Retry camera function
  const retryCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 1000);
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Switch camera
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Start recording
  const startRecording = () => {
    if (!stream) return;
    
    // Clear previous chunks
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });
    
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      console.log('📹 Data available:', event.data.size, 'bytes');
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
        console.log('📦 Total chunks collected:', chunksRef.current.length);
      }
    };
    
    mediaRecorder.onstop = () => {
      console.log('🛑 Recording stopped. Total chunks:', chunksRef.current.length);
      
      if (chunksRef.current.length === 0) {
        console.error('❌ No chunks recorded!');
        alert('Recording failed. Please try again.');
        return;
      }
      
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      console.log('📦 Blob created, size:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        console.error('❌ Blob is empty!');
        alert('Recording failed - empty video. Please try again.');
        return;
      }
      
      const file = new File([blob], `recorded-${Date.now()}.webm`, { type: 'video/webm' });
      
      console.log('✅ Recording complete:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        chunks: chunksRef.current.length
      });
      
      setSelectedFile(file);
      
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setActiveTab('upload');
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('❌ MediaRecorder error:', event.error);
      alert('Recording error: ' + event.error);
    };
    
    console.log('▶️ Starting recording...');
    mediaRecorder.start(100); // Collect data every 100ms for better reliability
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping recording...');
      
      // Request final data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        
        // Small delay to ensure final chunk is collected
        setTimeout(() => {
          mediaRecorderRef.current.stop();
          console.log('✅ MediaRecorder stopped');
        }, 100);
      }
      
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle file upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        alert("Please select a video or image file");
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      
      if (file.size === 0) {
        alert("File is empty. Please try recording again.");
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle post
  const handlePost = async () => {
    if (!selectedFile) {
      alert("Please select or record a video/image to post");
      return;
    }

    console.log('📤 Starting post upload...');
    console.log('👤 Current user:', user);
    console.log('🔑 Current token:', api.getToken() ? api.getToken().substring(0, 10) + '...' : 'NONE');
    console.log('💾 LocalStorage authToken:', localStorage.getItem('authToken') ? localStorage.getItem('authToken').substring(0, 10) + '...' : 'NONE');
    console.log('👥 LocalStorage user:', localStorage.getItem('user'));

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("caption", caption);
      formData.append("hashtags", hashtags);
      
      console.log('📦 FormData prepared, calling api.createPost...');
      const response = await api.createPost(formData);
      console.log('Post created successfully:', response);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset after a delay
      setTimeout(() => {
        setCaption("");
        setHashtags("");
        setSelectedFile(null);
        setPreview(null);
        setSelectedFilter('none');
        setShowSuccessModal(false);
        
        if (window.refreshFeed) {
          window.refreshFeed();
        }
        
        onBack();
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setShowSuccessModal(false);
      
      // Handle specific token conflict errors
      if (error.token_conflict) {
        alert("🔐 Authentication Conflict Detected!\n\nYour session got confused between admin and demo accounts.\n\nPlease:\n1. Go to: http://localhost:5173/clear_tokens.html\n2. Click 'Clear All Tokens'\n3. Log back in as demo user\n4. Try posting again");
      } else if (error.admin_attribution) {
        alert("🚨 Post Attribution Error!\n\nYour post was incorrectly attributed to admin due to a token conflict.\n\nPlease:\n1. Go to: http://localhost:5173/clear_tokens.html\n2. Click 'Clear All Tokens'\n3. Log back in as demo user\n4. Try posting again");
      } else if (error.moderation_blocked) {
        alert("⚠️ ILLEGAL CONTENT DETECTED\n\n" + (error.error || "This content contains inappropriate or explicit material and cannot be posted. Please follow our community guidelines."));
      } else {
        alert("Failed to upload post: " + (error.error || error.message || 'Please try again.'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeTab, facingMode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const template = TEMPLATES.find(t => t.id === selectedTemplate) || { ratio: '9/16' };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "linear-gradient(160deg, #060D1F 0%, #0A1628 60%, #0D1E3A 100%)",
      zIndex: 4000,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        background: "rgba(6,13,31,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,212,224,0.15)",
      }}>
        <button
          onClick={onBack}
          style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            marginRight: 16,
          }}
        >
          <X size={20} color={T.txt} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>
          Create
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handlePost}
          disabled={!selectedFile || isUploading}
          style={{
            background: selectedFile && !isUploading ? T.pri : T.border,
            border: "none",
            borderRadius: 20,
            color: selectedFile && !isUploading ? "#fff" : T.sub,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: selectedFile && !isUploading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isUploading ? "Posting..." : (
            <>
              <Check size={16} />
              Post
            </>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "12px 20px",
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
      }}>
        {[
          { id: 'upload', icon: Upload, label: 'Upload' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'templates', icon: Sparkles, label: 'Templates' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px",
                background: isActive ? "rgba(0,212,224,0.15)" : "rgba(255,255,255,0.05)",
                border: isActive ? "2px solid rgba(0,212,224,0.6)" : "2px solid rgba(0,212,224,0.15)",
                borderRadius: 12,
                color: isActive ? T.pri : T.txt,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            {/* Preview */}
            <div style={{
              width: "100%",
              aspectRatio: template.ratio,
              background: T.bg,
              border: `2px solid ${T.border}`,
              borderRadius: 16,
              overflow: "hidden",
              marginBottom: 24,
              position: "relative",
            }}>
              {preview ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {selectedFile?.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      controls
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: FILTERS.find(f => f.id === selectedFilter)?.filter,
                      }}
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: FILTERS.find(f => f.id === selectedFilter)?.filter,
                      }}
                    />
                  )}
                </div>
              ) : (
                <label style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  gap: 16,
                  background: "linear-gradient(160deg, rgba(0,212,224,0.08) 0%, rgba(0,20,50,0.6) 100%)",
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%",
                    background: "linear-gradient(135deg, #00D4E0 0%, #0891B2 60%, #065F7A 100%)",
                    boxShadow: "0 8px 24px rgba(0,212,224,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Upload size={36} color="#fff" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.txt }}>Tap to pick a photo or video</div>
                  <div style={{ fontSize: 13, color: T.sub }}>Image or Video · Max 50MB</div>
                  <div style={{
                    padding: "12px 32px",
                    background: "linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)",
                    boxShadow: "0 6px 20px rgba(255,215,0,0.4)",
                    borderRadius: 30, color: "#0A1628", fontSize: 14, fontWeight: 800,
                  }}>Choose File</div>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>

            {/* Filters */}
            {preview && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 12 }}>
                  Filters
                </div>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                  {FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      style={{
                        minWidth: 80,
                        padding: "8px 16px",
                        background: selectedFilter === filter.id ? T.pri : "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: 20,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caption */}
            <div style={{ marginBottom: 16 }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                style={{
                  width: "100%",
                  padding: 16,
                  background: "rgba(0,20,50,0.5)",
                  border: "2px solid rgba(0,212,224,0.2)",
                  borderRadius: 12,
                  color: "#FFFFFF",
                  fontSize: 14,
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            {/* Hashtags */}
            <div>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#hashtags"
                style={{
                  width: "100%",
                  padding: 16,
                  background: "rgba(0,20,50,0.5)",
                  border: "2px solid rgba(0,212,224,0.2)",
                  borderRadius: 12,
                  color: "#FFFFFF",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            {/* Camera Error Display */}
            {cameraError && (
              <div style={{
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                color: "#c33",
                fontSize: 13,
                lineHeight: 1.4
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>📷 Camera Error</div>
                <div style={{ marginBottom: 12 }}>{cameraError}</div>
                <button
                  onClick={retryCamera}
                  disabled={isRetryingCamera}
                  style={{
                    background: "#c33",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isRetryingCamera ? "not-allowed" : "pointer",
                    opacity: isRetryingCamera ? 0.7 : 1,
                    marginRight: 8
                  }}
                >
                  {isRetryingCamera ? "Retrying..." : "Retry Camera"}
                </button>
                <button
                  onClick={() => setCameraError(null)}
                  style={{
                    background: "#666",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Dismiss
                </button>
              </div>
            )}

            <div style={{
              width: "100%",
              aspectRatio: "9/16",
              background: T.bg,
              border: `2px solid ${T.border}`,
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
            }}>
              {stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: FILTERS.find(f => f.id === selectedFilter)?.filter,
                  }}
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#000",
                  color: "#fff"
                }}>
                  {isRetryingCamera ? (
                    <>
                      <div style={{
                        width: 40,
                        height: 40,
                        border: "3px solid #333",
                        borderTop: "3px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginBottom: 16
                      }} />
                      <div style={{ fontSize: 14, opacity: 0.7 }}>Initializing camera...</div>
                    </>
                  ) : (
                    <>
                      <Camera size={48} color="#666" style={{ marginBottom: 16 }} />
                      <div style={{ fontSize: 14, opacity: 0.7, textAlign: "center", padding: "0 20px" }}>
                        {cameraError ? "Camera unavailable" : "Click allow when prompted for camera access"}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Recording indicator */}
              {isRecording && (
                <div style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  background: "rgba(255,0,0,0.8)",
                  padding: "8px 16px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "pulse 1s infinite",
                  }} />
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}

              {/* Controls */}
              <div style={{
                position: "absolute",
                bottom: 30,
                left: 0,
                right: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
              }}>
                {/* Switch camera */}
                <button
                  onClick={switchCamera}
                  disabled={isRecording || !stream}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: (isRecording || !stream) ? "not-allowed" : "pointer",
                    opacity: (isRecording || !stream) ? 0.5 : 1,
                  }}
                >
                  <RotateCw size={24} color="#fff" />
                </button>

                {/* Record button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!stream}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: isRecording ? "#ff0000" : (!stream ? "#666" : "#fff"),
                    border: isRecording ? "none" : `4px solid ${!stream ? "#333" : "rgba(255,255,255,0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: !stream ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {isRecording ? (
                    <Square size={28} color="#fff" fill="#fff" />
                  ) : (
                    <div style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: !stream ? "#666" : "#ff0000",
                    }} />
                  )}
                </button>

                {/* Retry camera button */}
                {!stream && !isRetryingCamera && (
                  <button
                    onClick={retryCamera}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.2)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCw size={24} color="#fff" />
                  </button>
                )}

                {/* Placeholder for symmetry when stream is active */}
                {stream && <div style={{ width: 50, height: 50 }} />}
              </div>
            </div>

            {/* Filter selection for camera */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 12 }}>
                Live Filters
              </div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {FILTERS.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    style={{
                      minWidth: 80,
                      padding: "8px 16px",
                      background: selectedFilter === filter.id ? T.pri : T.bg,
                      border: `1px solid ${selectedFilter === filter.id ? T.pri : T.border}`,
                      borderRadius: 20,
                      color: selectedFilter === filter.id ? "#fff" : T.txt,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 20 }}>
              Choose Format
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {TEMPLATES.map(temp => (
                <button
                  key={temp.id}
                  onClick={() => {
                    setSelectedTemplate(temp.id);
                    setActiveTab('upload');
                  }}
                  style={{
                    padding: 20,
                    background: selectedTemplate === temp.id ? "rgba(0,212,224,0.15)" : "rgba(255,255,255,0.05)",
                    border: selectedTemplate === temp.id ? "2px solid rgba(0,212,224,0.6)" : "2px solid rgba(0,212,224,0.15)",
                    borderRadius: 16,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{temp.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.txt, marginBottom: 4 }}>
                    {temp.name.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: 12, color: T.sub }}>{temp.desc}</div>
                  <div style={{ fontSize: 11, color: T.pri, marginTop: 8, fontWeight: 600 }}>
                    {temp.ratio}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5000,
        }}>
          <div style={{
            background: "rgba(10,22,40,0.95)",
            border: "1px solid rgba(0,212,224,0.2)",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            maxWidth: 400,
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 8 }}>
              Post Uploaded Successfully!
            </div>
            <div style={{ fontSize: 14, color: T.sub }}>
              Your content is now live
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
