import { useState } from "react";
import api from "../api";

const T = { pri:"#DA9B2A", txt:"#1C1917", sub:"#78716C", bg:"#FAFAF7", dark:"#0C1A12", border:"#E7E5E4" };

export function PostPage({ user, onBack }) {
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestPost = async () => {
    console.log("Testing post without file...");
    try {
      // Create a simple text file for testing
      const testBlob = new Blob(['test content'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append("file", testFile);
      formData.append("caption", "Test post");
      
      console.log("Test FormData created");
      const response = await api.createPost(formData);
      console.log("Test post successful:", response);
      
      alert("Test post successful!");
      
      if (window.refreshFeed) {
        window.refreshFeed();
      }
      
      onBack();
    } catch (error) {
      console.error("Test post error:", error);
      alert("Test post failed: " + JSON.stringify(error));
    }
  };

  const handlePost = async () => {
    if (!selectedFile) {
      alert("Please select a video or image to post");
      return;
    }

    setIsUploading(true);
    
    try {
      console.log("Starting post upload...");
      console.log("Selected file:", selectedFile);
      console.log("Caption:", caption);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("caption", caption);
      
      console.log("FormData created, calling API...");
      const response = await api.createPost(formData);
      console.log("API response:", response);
      
      alert("Post uploaded successfully!");
      
      // Refresh the feed to show the new post
      if (window.refreshFeed) {
        window.refreshFeed();
      }
      
      onBack();
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      const errorMessage = typeof error === 'string' ? JSON.parse(error).error : error.message || 'Failed to upload post. Please try again.';
      alert(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#fff",
      zIndex: 4000,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 20px",
        borderBottom: `1px solid ${T.border}`,
        background: "#fff",
      }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: "pointer",
            marginRight: 16,
          }}
        >
          ←
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.txt }}>
          Create Post
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleTestPost}
          style={{
            background: "#28a745",
            border: "none",
            borderRadius: 20,
            color: "#fff",
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginRight: 8,
          }}
        >
          Test Post
        </button>
        <button
          onClick={handlePost}
          disabled={!selectedFile || isUploading}
          style={{
            background: selectedFile && !isUploading ? T.pri : T.sub + "40",
            border: "none",
            borderRadius: 20,
            color: selectedFile && !isUploading ? "#fff" : T.sub,
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: selectedFile && !isUploading ? "pointer" : "not-allowed",
          }}
        >
          {isUploading ? "Posting..." : "Post"}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {/* Preview Area */}
        <div style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
          aspectRatio: "9/16",
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div style={{
              textAlign: "center",
              color: "#666",
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📹</div>
              <div style={{ fontSize: 14 }}>No media selected</div>
            </div>
          )}
        </div>

        {/* File Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="file-input"
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              background: T.bg,
              border: `2px dashed ${T.border}`,
              borderRadius: 8,
              textAlign: "center",
              cursor: "pointer",
              fontSize: 14,
              color: T.txt,
            }}
          >
            {selectedFile ? `Selected: ${selectedFile.name}` : "Click to select video or image"}
          </label>
          <input
            id="file-input"
            type="file"
            accept="video/*,image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </div>

        {/* Caption Input */}
        <div style={{ marginBottom: 20 }}>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{
              width: "100%",
              minHeight: 100,
              padding: "12px",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              fontSize: 14,
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Post Options */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: T.bg,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14, color: T.txt }}>Allow comments</span>
            <input type="checkbox" defaultChecked style={{ cursor: "pointer" }} />
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: T.bg,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14, color: T.txt }}>Allow duets</span>
            <input type="checkbox" defaultChecked style={{ cursor: "pointer" }} />
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            background: T.bg,
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 14, color: T.txt }}>Allow stitches</span>
            <input type="checkbox" defaultChecked style={{ cursor: "pointer" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
