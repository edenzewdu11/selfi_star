import { useState, useEffect } from "react";
import api from "../api";
import { CommentSection } from "./CommentSection";

const T = { pri:"#DA9B2A", txt:"#1C1917", sub:"#78716C", bg:"#FAFAF7", dark:"#0C1A12", border:"#E7E5E4" };

export function TikTokLayout({ user, onLogout, onRequireAuth, onShowPostPage }) {
  const [activeTab, setActiveTab] = useState("foryou");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log("Fetching videos from API...");
      const reelsData = await api.getReels();
      console.log("API response:", reelsData);
      // Transform backend data to match frontend format
      const formattedVideos = reelsData.map(reel => ({
        id: reel.id,
        creator: reel.user?.username || "Unknown User",
        handle: `@${reel.user?.username || "unknown"}`,
        avatar: "👤", // Default avatar, could be updated based on user profile
        caption: reel.caption,
        likes: reel.votes || 0,
        comments: reel.comment_count || 0, // Will be updated from backend
        shares: 0, // Backend doesn't have shares count yet
        imageUrl: reel.image, // Add image URL for displaying actual content
      }));
      console.log("Formatted videos:", formattedVideos);
      setVideos(formattedVideos);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      // Fallback to static data if API fails
      setVideos([
        { id: 1, creator: "Sarah Creator", handle: "sarahcreator", avatar: "👩", caption: "Just finished my morning workout! 💪", likes: 1234, comments: 89, shares: 45 },
        { id: 2, creator: "Tech Guru", handle: "techguru", avatar: "👨", caption: "New iPhone 15 Pro Max unboxing! 📱", likes: 5678, comments: 234, shares: 123 },
        { id: 3, creator: "Cooking with Love", handle: "cookingwithlove", avatar: "👩‍🍳", caption: "Easy 5-minute pasta recipe 🍝", likes: 3456, comments: 156, shares: 78 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Expose fetchVideos function so it can be called from parent
  useEffect(() => {
    if (window.refreshFeed) {
      window.refreshFeed = fetchVideos;
    }
  }, [fetchVideos]);

  const recommendations = [
    { id: 1, name: "Sarah Creator", handle: "@sarahcreator", avatar: "👩", followers: "1.2M" },
    { id: 2, name: "Tech Guru", handle: "@techguru", avatar: "👨", followers: "2.5M" },
    { id: 3, name: "Cooking with Love", handle: "@cookingwithlove", avatar: "👩‍🍳", followers: "890K" },
    { id: 4, name: "Travel Vlogger", handle: "@travelvlogger", avatar: "✈️", followers: "3.1M" },
    { id: 5, name: "Fitness Coach", handle: "@fitnesscoachjohn", avatar: "💪", followers: "1.8M" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff" }}>
      {/* LEFT SIDEBAR - Navigation */}
      <div style={{
        width: 250,
        borderRight: `1px solid ${T.border}`,
        padding: "20px 0",
        overflowY: "auto",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        background: "#fff",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px", marginBottom: 30 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.pri }}>⭐</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginTop: 4 }}>Selfie Star</div>
        </div>

        {/* Navigation Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { id: "foryou", icon: "🏠", label: "For You" },
            { id: "explore", icon: "🔍", label: "Explore" },
            { id: "following", icon: "👥", label: "Following" },
            { id: "inbox", icon: "💬", label: "Inbox" },
            { id: "bookmarks", icon: "🔖", label: "Bookmarks" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: activeTab === item.id ? T.pri + "15" : "transparent",
                border: "none",
                borderLeft: activeTab === item.id ? `3px solid ${T.pri}` : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 15,
                fontWeight: activeTab === item.id ? 700 : 500,
                color: T.txt,
                transition: "all .2s",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Create Button */}
        <div style={{ padding: "20px", marginTop: 20, borderTop: `1px solid ${T.border}` }}>
          <button 
            onClick={() => {
              if (!user) {
                onRequireAuth();
              } else {
                onShowPostPage();
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              background: `linear-gradient(135deg, ${T.pri}, #B8821E)`,
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}>
            📹 Post
          </button>
        </div>

        {/* User Profile */}
        <div style={{ padding: "20px", borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: T.pri + "30",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}>
              👤
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "8px",
              background: "#FEE2E2",
              border: "none",
              borderRadius: 6,
              color: "#EF4444",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* CENTER - Video Feed */}
      <div style={{
        marginLeft: 250,
        marginRight: 320,
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        background: "#fff",
      }}>
        {/* Feed Header */}
        <div style={{ width: "100%", maxWidth: 600, padding: "0 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.txt }}>
            {activeTab === "foryou" && "For You"}
            {activeTab === "explore" && "Explore"}
            {activeTab === "following" && "Following"}
            {activeTab === "inbox" && "Inbox"}
            {activeTab === "bookmarks" && "Bookmarks"}
          </div>
          <button
            onClick={() => {
              console.log("Test API call...");
              fetch('http://localhost:8000/api/reels/')
                .then(response => response.json())
                .then(data => console.log("Direct API call result:", data))
                .catch(error => console.error("Direct API call error:", error));
            }}
            style={{
              padding: "4px 8px",
              background: T.pri,
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
              marginTop: 8,
              marginRight: 8,
            }}
          >
            Test API
          </button>
          <button
            onClick={fetchVideos}
            style={{
              padding: "4px 8px",
              background: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Refresh Feed
          </button>
        </div>

        {/* Videos Feed */}
        <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 20, padding: "0 20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: T.sub }}>
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: T.sub }}>
              No videos yet. Be the first to post!
            </div>
          ) : (
            videos.map(video => (
            <div
              key={video.id}
              style={{
                background: "#000",
                borderRadius: 12,
                overflow: "hidden",
                aspectRatio: "9/16",
                maxHeight: 600,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Video/Image Background */}
              {video.imageUrl ? (
                <img
                  src={video.imageUrl.startsWith('http') ? video.imageUrl : `http://localhost:8000${video.imageUrl}`}
                  alt={video.caption}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
                display: video.imageUrl ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 80,
              }}>
                🎬
              </div>

              {/* Creator Info - Bottom Left */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                padding: "20px",
                color: "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: T.pri,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}>
                    {video.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{video.creator}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{video.handle}</div>
                  </div>
                  <button style={{
                    marginLeft: "auto",
                    background: T.pri,
                    border: "none",
                    borderRadius: 20,
                    color: "#fff",
                    padding: "6px 16px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}>
                    Follow
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.4 }}>
                  {video.caption}
                </div>
              </div>

              {/* Actions - Right Side */}
              <div style={{
                position: "absolute",
                right: 12,
                bottom: 100,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
                <button style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  color: "#fff",
                }}>
                  <div style={{ fontSize: 32 }}>🤍</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{video.likes}</div>
                </button>
                <button 
                  onClick={() => setShowComments(video.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    color: "#fff",
                  }}>
                  <div style={{ fontSize: 32 }}>💬</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{video.comments}</div>
                </button>
                <button style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  color: "#fff",
                }}>
                  <div style={{ fontSize: 32 }}>📤</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{video.shares}</div>
                </button>
                <button style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  color: "#fff",
                }}>
                  <div style={{ fontSize: 32 }}>🔖</div>
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Recommendations */}
      <div style={{
        width: 320,
        borderLeft: `1px solid ${T.border}`,
        padding: "20px",
        overflowY: "auto",
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        background: "#fff",
      }}>
        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search creators..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              fontSize: 13,
              outline: "none",
              background: T.bg,
            }}
          />
        </div>

        {/* Recommended Creators */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginBottom: 12 }}>
            Recommended Creators
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recommendations.map(creator => (
              <div
                key={creator.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px",
                  borderRadius: 8,
                  background: T.bg,
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: T.pri + "30",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {creator.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {creator.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {creator.handle}
                  </div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>
                    {creator.followers} followers
                  </div>
                </div>
                <button style={{
                  background: T.pri,
                  border: "none",
                  borderRadius: 4,
                  color: "#fff",
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}>
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: T.sub }}>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>About</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Newsroom</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Contact</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Careers</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>ByteDance</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Terms</a>
          </div>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 12 }}>
            © 2026 Selfie Star
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <CommentSection
          reelId={showComments}
          user={user}
          onClose={() => setShowComments(null)}
        />
      )}
    </div>
  );
}
