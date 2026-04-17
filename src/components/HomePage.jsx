import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye, Check, ChevronDown } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { ModernCommentSection } from "./ModernCommentSection";
import { getRelativeTime } from "../utils/timeUtils";

const TABS = ["For You", "Campaigns", "Categories"];
const CATEGORIES = ["All", "Nature", "Sports", "Music", "Art", "Travel", "Food", "Fashion", "Tech"];

export function HomePage({ user, onShowProfile, onRequireAuth, onShowCampaigns }) {
  const { colors: T } = useTheme();
  const [activeTab, setActiveTab] = useState("For You");
  const [activeCategory, setActiveCategory] = useState("All");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [showComments, setShowComments] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    loadPosts();
  }, [activeTab, activeCategory]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await api.getReels();
      setPosts(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error("Failed to load posts:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) { onRequireAuth?.(); return; }
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    try {
      await api.voteReel(postId);
    } catch (e) {
      setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    }
  };

  const handleSave = (postId) => {
    if (!user) { onRequireAuth?.(); return; }
    setSavedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toString();
  };

  const getMediaUrl = (post) => {
    if (post.image) return post.image.startsWith("http") ? post.image : `http://localhost:8000${post.image}`;
    if (post.media) return post.media.startsWith("http") ? post.media : `http://localhost:8000${post.media}`;
    return null;
  };

  const isVideo = (url) => url && (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov"));

  const getAvatarUrl = (post) => {
    const avatar = post.user?.profile?.avatar_url || post.user?.avatar;
    if (!avatar) return null;
    return avatar.startsWith("http") ? avatar : `http://localhost:8000${avatar}`;
  };

  return (
    <div className="home-page-root" style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #060D1F 0%, #0A1628 60%, #0D1E3A 100%)",
      boxSizing: "border-box",
    }}>
      {/* Sponsor Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(6,13,31,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,212,224,0.15)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        {/* Left sponsor */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #00B4D8, #0077B6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
          }}>ET</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#7ABFCC" }}>Ethio Telecom</span>
        </div>

        {/* Center: App brand + notification */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            fontSize: 18, fontWeight: 900, letterSpacing: "1px",
            background: "linear-gradient(135deg, #00D4E0, #ffffff 50%, #FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>WorqPost</div>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFD700, #F5A623)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 4px 12px rgba(255,215,0,0.3)",
            }}>
              🔔
            </div>
            {user && (
              <div style={{
                position: "absolute", top: -4, right: -4,
                width: 16, height: 16, borderRadius: "50%",
                background: "#FF4B6E", fontSize: 9, fontWeight: 800,
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              }}>3</div>
            )}
          </div>
        </div>

        {/* Right sponsor */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#7ABFCC" }}>SkyKin</span>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #1E40AF, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#fff",
          }}>SK</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px 80px", width: "100%" }}>

        {/* Tab Navigation */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "rgba(10,22,40,0.6)", borderRadius: 14,
          padding: 4, border: "1px solid rgba(0,212,224,0.12)",
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (tab === "Campaigns") { onShowCampaigns?.(); return; }
                setActiveTab(tab);
              }}
              style={{
                flex: 1, padding: "10px 8px",
                borderRadius: 10, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
                background: activeTab === tab
                  ? "linear-gradient(135deg, #7C3AED 0%, #00D4E0 100%)"
                  : "transparent",
                color: activeTab === tab ? "#fff" : "#7ABFCC",
                boxShadow: activeTab === tab ? "0 4px 16px rgba(124,58,237,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >{tab}</button>
          ))}
        </div>

        {/* Categories filter (only on For You) */}
        {activeTab === "For You" && (
          <div style={{
            display: "flex", gap: 8, overflowX: "auto", marginBottom: 20,
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px", borderRadius: 20,
                  border: activeCategory === cat
                    ? "1px solid rgba(0,212,224,0.6)"
                    : "1px solid rgba(0,212,224,0.15)",
                  background: activeCategory === cat
                    ? "rgba(0,212,224,0.15)"
                    : "rgba(10,22,40,0.5)",
                  color: activeCategory === cat ? "#00D4E0" : "#7ABFCC",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >{cat}</button>
            ))}
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
            <div style={{ color: "#7ABFCC", fontSize: 14 }}>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60,
            background: "rgba(10,22,40,0.6)", borderRadius: 20,
            border: "1px solid rgba(0,212,224,0.1)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No posts yet</div>
            <div style={{ color: "#7ABFCC", fontSize: 14 }}>Be the first to share something!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {posts.map(post => {
              const mediaUrl = getMediaUrl(post);
              const avatarUrl = getAvatarUrl(post);
              const isLiked = likedPosts[post.id];
              const isSaved = savedPosts[post.id];
              const likeCount = (post.votes || 0) + (isLiked ? 1 : 0);
              const commentCount = post.comments_count || post.comment_count || 0;
              const viewCount = post.view_count || Math.floor(Math.random() * 200000 + 10000);
              const username = post.user?.username || "user";
              const isVerified = post.user?.profile?.is_verified || false;
              const caption = post.caption || "";
              const hashtags = post.hashtags ? post.hashtags.split(" ").filter(h => h.startsWith("#")) : [];

              return (
                <div
                  key={post.id}
                  style={{
                    background: "rgba(10,22,40,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(0,212,224,0.12)",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,224,0.2)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                  }}
                >
                  {/* Post Header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px",
                  }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                      onClick={() => onShowProfile?.(post.user?.id)}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username}
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(0,212,224,0.4)" }}
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%",
                          background: "linear-gradient(135deg, #00D4E0, #7C3AED)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 700, color: "#fff",
                          border: "2px solid rgba(0,212,224,0.4)",
                        }}>{username[0]?.toUpperCase()}</div>
                      )}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{username}</span>
                          {isVerified && (
                            <div style={{
                              width: 16, height: 16, borderRadius: "50%",
                              background: "#00D4E0",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Check size={10} color="#fff" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#7ABFCC", marginTop: 1 }}>
                          {post.created_at ? getRelativeTime(post.created_at) : "Recently"}
                        </div>
                      </div>
                    </div>
                    <div style={{ position: "relative" }} ref={menuOpen === post.id ? menuRef : null}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#7ABFCC", padding: 6, borderRadius: 8,
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpen === post.id && (
                        <div style={{
                          position: "absolute", right: 0, top: "100%", zIndex: 50,
                          background: "rgba(6,13,31,0.98)", backdropFilter: "blur(20px)",
                          border: "1px solid rgba(0,212,224,0.2)", borderRadius: 12,
                          padding: 6, minWidth: 140,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}>
                          {["Report", "Not interested", "Copy link"].map(opt => (
                            <button key={opt} onClick={() => setMenuOpen(null)} style={{
                              display: "block", width: "100%", padding: "8px 12px",
                              background: "none", border: "none", cursor: "pointer",
                              color: opt === "Report" ? "#FF4B6E" : "#FFFFFF",
                              fontSize: 13, textAlign: "left", borderRadius: 8,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,224,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >{opt}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media */}
                  {mediaUrl && (
                    <div style={{ position: "relative", width: "100%", background: "#000" }}>
                      {isVideo(mediaUrl) ? (
                        <video
                          src={mediaUrl}
                          style={{ width: "100%", maxHeight: 520, objectFit: "cover", display: "block" }}
                          controls muted playsInline preload="none"
                          onError={e => { e.target.parentElement.style.display = "none"; }}
                        />
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={caption}
                          loading="lazy"
                          decoding="async"
                          style={{ width: "100%", maxHeight: 520, objectFit: "cover", display: "block" }}
                          onError={e => { e.target.parentElement.style.display = "none"; }}
                        />
                      )}
                      {/* View count overlay */}
                      <div style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
                        borderRadius: 20, padding: "4px 10px",
                        display: "flex", alignItems: "center", gap: 5,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}>
                        <Eye size={12} color="#fff" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                          {formatCount(viewCount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: "12px 16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                        <button
                          onClick={() => handleLike(post.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: 0,
                            display: "flex", alignItems: "center", gap: 6,
                            color: isLiked ? "#FF4B6E" : "#7ABFCC",
                            transition: "all 0.2s",
                          }}
                        >
                          <Heart
                            size={22}
                            fill={isLiked ? "#FF4B6E" : "none"}
                            color={isLiked ? "#FF4B6E" : "#7ABFCC"}
                          />
                        </button>
                        <button
                          onClick={() => {
                            if (!user) { onRequireAuth?.(); return; }
                            setShowComments(showComments === post.id ? null : post.id);
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#7ABFCC" }}
                        >
                          <MessageCircle size={22} />
                        </button>
                        <button
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#7ABFCC" }}
                        >
                          <Share2 size={20} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleSave(post.id)}
                        style={{
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                          color: isSaved ? "#FFD700" : "#7ABFCC",
                        }}
                      >
                        <Bookmark size={22} fill={isSaved ? "#FFD700" : "none"} color={isSaved ? "#FFD700" : "#7ABFCC"} />
                      </button>
                    </div>

                    {/* Like count */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>
                      {formatCount(likeCount)} likes
                    </div>

                    {/* Caption */}
                    {caption && (
                      <div style={{ fontSize: 14, color: "#E2E8F0", marginBottom: 6, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700, color: "#FFFFFF", marginRight: 6 }}>{username}</span>
                        {caption}
                      </div>
                    )}

                    {/* View all comments */}
                    {commentCount > 0 && (
                      <button
                        onClick={() => {
                          if (!user) { onRequireAuth?.(); return; }
                          setShowComments(showComments === post.id ? null : post.id);
                        }}
                        style={{
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                          color: "#7ABFCC", fontSize: 13, marginBottom: 6,
                        }}
                      >
                        View all {commentCount} comments
                      </button>
                    )}

                    {/* Hashtags */}
                    {hashtags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 14 }}>
                        {hashtags.map((tag, i) => (
                          <span key={i} style={{ fontSize: 13, color: "#00D4E0", fontWeight: 500 }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    {hashtags.length === 0 && <div style={{ paddingBottom: 14 }} />}
                  </div>

                  {/* Inline comment section */}
                  {showComments === post.id && (
                    <div style={{
                      borderTop: "1px solid rgba(0,212,224,0.1)",
                      padding: "0 0 4px",
                    }}>
                      <ModernCommentSection
                        reelId={post.id}
                        user={user}
                        onClose={() => setShowComments(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .home-page-root { padding-left: 220px; }
        @media (max-width: 768px) {
          .home-page-root { padding-left: 0 !important; padding-bottom: 80px; }
        }
      `}</style>
    </div>
  );
}
