import { useState, useRef } from "react";
import { contentFilter } from "../utils/contentFilter";

const T = { pri:"#00D4E0", txt:"#FFFFFF", sub:"#7ABFCC", bg:"rgba(0,212,224,0.08)", dark:"#020810", border:"rgba(0,212,224,0.2)", red:"#FF4B6E" };

export function CreateVideoModal({ onClose, onVideoCreated }) {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef(null);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file first
      const fileValidation = contentFilter.validateFile(file);
      if (!fileValidation.isValid) {
        setErr(fileValidation.reason);
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onload = async (event) => {
        setPreview(event.target?.result);
        
        // Auto-filter content when image is loaded
        if (caption.trim()) {
          const filterResult = await contentFilter.filterContent(file, caption);
          if (!filterResult.isAppropriate) {
            setErr(`Content blocked: ${filterResult.reasons.join(', ')}`);
            setImage(null);
            setPreview(null);
            return;
          }
        }
      };
      reader.readAsDataURL(file);
      setErr("");
    }
  };

  const handleUpload = async () => {
    if (!image || !caption.trim()) {
      setErr("Please select an image and add a caption");
      return;
    }

    setLoading(true);
    try {
      // Final content check before upload
      const filterResult = await contentFilter.filterContent(image, caption);
      if (!filterResult.isAppropriate) {
        setErr(`Content blocked: ${filterResult.reasons.join(', ')}`);
        return;
      }

      // Create a mock video object
      const mockVideo = {
        id: Math.floor(Math.random() * 10000),
        creator: "You",
        handle: "yourhandle",
        avatar: "👤",
        caption: caption,
        likes: 0,
        comments: 0,
        shares: 0,
        image: preview,
        liked: false,
        bookmarked: false,
        contentFiltered: true,
        filterConfidence: filterResult.confidence
      };

      console.log("Video created and filtered:", mockVideo);
      
      // Call the callback with the new video
      onVideoCreated?.(mockVideo);
      
      // Close modal
      onClose();
    } catch(e) {
      console.error("Upload error:", e);
      setErr(e.message || "Failed to upload video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease-out",
      }}>
      <div style={{
        background: "rgba(10,22,40,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(0,212,224,0.2)",
        borderRadius: 20,
        padding: 32,
        maxWidth: 520,
        width: "90%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: `1px solid ${T.border}`,
        animation: "slideUp 0.4s ease-out",
        position: "relative",
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: `2px solid ${T.border}`,
        }}>
          <div style={{ 
            fontSize: 24, 
            fontWeight: 900, 
            color: T.txt,
            background: `linear-gradient(135deg, ${T.txt}, ${T.pri})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>Create Video 📹</div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: T.sub,
            }}
          >
            ✕
          </button>
        </div>

        {/* Image Preview */}
        {preview ? (
          <div style={{
            width: "100%",
            height: 300,
            borderRadius: 12,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            overflow: "hidden",
            position: "relative",
          }}>
            <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => {
                setImage(null);
                setPreview(null);
              }}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.7)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              height: 300,
              borderRadius: 12,
              border: `2px dashed ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              cursor: "pointer",
              background: T.bg,
              marginBottom: 16,
              transition: "all .2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = T.pri}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = T.border}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.txt }}>Click to upload image</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>or drag and drop</div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: "none" }}
        />

        {/* Caption Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption for your video..."
            style={{
              width: "100%",
              minHeight: 100,
              padding: 12,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12,
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
              color: T.txt,
            }}
          />
        </div>

        {/* Error Message */}
        {err && (
          <div style={{
            background: `linear-gradient(135deg, #FEE2E2, #FECACA)`,
            borderRadius: 16,
            padding: 20,
            fontSize: 14,
            color: T.red,
            marginBottom: 16,
            border: `2px solid ${T.red}30`,
            boxShadow: `0 8px 16px ${T.red}15`,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative warning icon in corner */}
            <div style={{
              position: "absolute",
              top: -10,
              right: -10,
              width: 60,
              height: 60,
              background: `${T.red}20`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}>
              🚫
            </div>
            
            {/* Content */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                fontSize: 16,
                fontWeight: 800,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                ILLEGAL CONTENT DETECTED
              </div>
              <div style={{
                fontSize: 13,
                lineHeight: 1.5,
                opacity: 0.9,
              }}>
                {err}
              </div>
            </div>
            
            {/* Decorative bottom border */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${T.red}, ${T.red}60, ${T.red})`,
            }} />
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 12,
              background: T.bg,
              border: "none",
              borderRadius: 8,
              color: T.txt,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={loading || !image || !caption.trim()}
            style={{
              flex: 1,
              padding: 12,
              background: loading ? "rgba(255,255,255,0.1)" : `linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)`,
              boxShadow: loading ? 'none' : '0 4px 18px rgba(255,215,0,0.4)',
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !image || !caption.trim() ? 0.6 : 1,
            }}
          >
            {loading ? "Uploading..." : "Post Video 🚀"}
          </button>
        </div>
      </div>
    </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}
