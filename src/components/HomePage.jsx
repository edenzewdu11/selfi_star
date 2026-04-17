import { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye, Check, Play } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { ModernCommentSection } from "./ModernCommentSection";
import { getRelativeTime } from "../utils/timeUtils";

const TABS = ["For You", "Campaigns", "Categories"];
const CATEGORIES = ["All", "Nature", "Sports", "Music", "Art", "Travel", "Food", "Fashion", "Tech"];

export function HomePage({ user, onShowProfile, onRequireAuth, onShowCampaigns, onSwitchToReels }) {
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
      background: "#EEF2F8",
      boxSizing: "border-box",
    }}>
      {/* Sponsor Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
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
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>Ethio Telecom</span>
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
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>SkyKin</span>
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
          background: "#F7F8FA", borderRadius: 14,
          padding: 4, border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                  ? "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)"
                  : "transparent",
                color: activeTab === tab ? "#fff" : "#6B7280",
                boxShadow: activeTab === tab ? "0 4px 16px rgba(124,58,237,0.25)" : "none",
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
                    ? "1px solid #7C3AED"
                    : "1px solid rgba(0,0,0,0.12)",
                  background: activeCategory === cat
                    ? "#7C3AED"
                    : "#fff",
                  color: activeCategory === cat ? "#fff" : "#6B7280",
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
            <div style={{ color: "#7C3AED", fontSize: 14 }}>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60,
            background: "#fff", borderRadius: 20,
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
            <div style={{ color: "#111827", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No posts yet</div>
            <div style={{ color: "#6B7280", fontSize: 14 }}>Be the first to share something!</div>
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
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.14)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* Post Header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px",
                  }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}
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
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{username}</span>
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
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                          {post.created_at ? getRelativeTime(post.created_at) : "Recently"}
                        </div>
                      </div>
                    </div>
                    <div style={{ position: "relative" }} ref={menuOpen === post.id ? menuRef : null}>
                      <button
                        onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#9CA3AF", padding: 6, borderRadius: 8,
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpen === post.id && (
                        <div style={{
                          position: "absolute", right: 0, top: "100%", zIndex: 50,
                          background: "#ffffff", backdropFilter: "blur(20px)",
                          border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12,
                          padding: 6, minWidth: 140,
                          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                        }}>
                          {["Report", "Not interested", "Copy link"].map(opt => (
                            <button key={opt} onClick={() => setMenuOpen(null)} style={{
                              display: "block", width: "100%", padding: "8px 12px",
                              background: "none", border: "none", cursor: "pointer",
                              color: opt === "Report" ? "#EF4444" : "#111827",
                              fontSize: 13, textAlign: "left", borderRadius: 8,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
                            onMouseLeave={e => e.currentTarget.style.background = "none"}
                            >{opt}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Media - consistent square aspect ratio */}
                  {mediaUrl && (
                    <div
                      style={{ position: "relative", width: "100%", paddingTop: "100%", background: "#F3F4F6", cursor: isVideo(mediaUrl) ? "pointer" : "default" }}
                      onClick={() => isVideo(mediaUrl) && onSwitchToReels?.()}
                    >
                      {isVideo(mediaUrl) ? (
                        <>
                          <video
                            src={mediaUrl}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            muted playsInline preload="metadata"
                            onError={e => { e.target.closest('[data-media]').style.display = "none"; }}
                          />
                          {/* Play button overlay */}
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(0,0,0,0.25)",
                          }}>
                            <div style={{
                              width: 56, height: 56, borderRadius: "50%",
                              background: "rgba(255,255,255,0.92)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                            }}>
                              <Play size={22} color="#111827" fill="#111827" style={{ marginLeft: 3 }} />
                            </div>
                          </div>
                          {/* Reels badge */}
                          <div style={{
                            position: "absolute", top: 10, left: 10,
                            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                            borderRadius: 20, padding: "3px 10px",
                            fontSize: 11, fontWeight: 700, color: "#fff",
                            letterSpacing: "0.3px",
                          }}>▶ Reel</div>
                        </>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={caption}
                          loading="lazy"
                          decoding="async"
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={e => { e.target.parentElement.style.display = "none"; }}
                        />
                      )}
                      {/* View count overlay */}
                      <div style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                        borderRadius: 20, padding: "4px 10px",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <Eye size={12} color="#fff" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                          {formatCount(viewCount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ padding: "14px 16px 16px" }}>
                    {/* Action buttons row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {/* Like */}
                        <button
                          onClick={() => handleLike(post.id)}
                          onMouseEnter={e => { if (!isLiked) { e.currentTarget.querySelector('svg').style.color = "#EF4444"; e.currentTarget.querySelector('svg').style.stroke = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}}
                          onMouseLeave={e => { if (!isLiked) { e.currentTarget.querySelector('svg').style.color = "#9CA3AF"; e.currentTarget.querySelector('svg').style.stroke = "#9CA3AF"; e.currentTarget.style.background = "transparent"; }}}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: "8px 10px", borderRadius: 10,
                            display: "flex", alignItems: "center", gap: 0,
                            transition: "background 0.18s",
                          }}
                        >
                          <Heart size={24} fill={isLiked ? "#EF4444" : "none"} color={isLiked ? "#EF4444" : "#9CA3AF"}
                            style={{ transition: "all 0.18s", transform: isLiked ? "scale(1.15)" : "scale(1)" }} />
                        </button>

                        {/* Comment */}
                        <button
                          onClick={() => { if (!user) { onRequireAuth?.(); return; } setShowComments(showComments === post.id ? null : post.id); }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.querySelector('svg').style.color = "#7C3AED"; e.currentTarget.querySelector('svg').style.stroke = "#7C3AED"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector('svg').style.color = "#9CA3AF"; e.currentTarget.querySelector('svg').style.stroke = "#9CA3AF"; }}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: "8px 10px", borderRadius: 10,
                            display: "flex", alignItems: "center",
                            transition: "background 0.18s",
                          }}
                        >
                          <MessageCircle size={24} color="#9CA3AF" style={{ transition: "all 0.18s" }} />
                        </button>

                        {/* Share */}
                        <button
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.querySelector('svg').style.color = "#7C3AED"; e.currentTarget.querySelector('svg').style.stroke = "#7C3AED"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector('svg').style.color = "#9CA3AF"; e.currentTarget.querySelector('svg').style.stroke = "#9CA3AF"; }}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            padding: "8px 10px", borderRadius: 10,
                            display: "flex", alignItems: "center",
                            transition: "background 0.18s",
                          }}
                        >
                          <Share2 size={22} color="#9CA3AF" style={{ transition: "all 0.18s" }} />
                        </button>
                      </div>

                      {/* Bookmark */}
                      <button
                        onClick={() => handleSave(post.id)}
                        onMouseEnter={e => { if (!isSaved) { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; e.currentTarget.querySelector('svg').style.color = "#F59E0B"; e.currentTarget.querySelector('svg').style.stroke = "#F59E0B"; }}}
                        onMouseLeave={e => { if (!isSaved) { e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector('svg').style.color = "#9CA3AF"; e.currentTarget.querySelector('svg').style.stroke = "#9CA3AF"; }}}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          padding: "8px 10px", borderRadius: 10,
                          display: "flex", alignItems: "center",
                          transition: "background 0.18s",
                        }}
                      >
                        <Bookmark size={24} fill={isSaved ? "#F59E0B" : "none"} color={isSaved ? "#F59E0B" : "#9CA3AF"}
                          style={{ transition: "all 0.18s" }} />
                      </button>
                    </div>

                    {/* Like count */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 5, letterSpacing: "-0.01em" }}>
                      {likeCount.toLocaleString()} likes
                    </div>

                    {/* Caption — username bold inline */}
                    {caption && (
                      <div style={{ fontSize: 14, color: "#374151", marginBottom: 6, lineHeight: 1.55 }}>
                        <span style={{ fontWeight: 800, color: "#111827", marginRight: 5, letterSpacing: "-0.01em" }}>{username}</span>
                        {caption}
                      </div>
                    )}

                    {/* View all comments */}
                    {commentCount > 0 && (
                      <button
                        onClick={() => { if (!user) { onRequireAuth?.(); return; } setShowComments(showComments === post.id ? null : post.id); }}
                        onMouseEnter={e => e.currentTarget.style.color = "#6D28D9"}
                        onMouseLeave={e => e.currentTarget.style.color = "#7C3AED"}
                        style={{
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                          color: "#7C3AED", fontSize: 13, fontWeight: 600, marginBottom: 8,
                          display: "block", transition: "color 0.15s",
                        }}
                      >
                        View all {commentCount.toLocaleString()} comments
                      </button>
                    )}

                    {/* Hashtag pills */}
                    {hashtags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: commentCount > 0 ? 0 : 6 }}>
                        {hashtags.map((tag, i) => (
                          <span key={i} style={{
                            fontSize: 12, fontWeight: 600, color: "#7C3AED",
                            background: "rgba(124,58,237,0.08)",
                            border: "1px solid rgba(124,58,237,0.18)",
                            borderRadius: 20, padding: "3px 10px",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "#7C3AED"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.color = "#7C3AED"; }}
                          >{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inline comment section */}
                  {showComments === post.id && (
                    <div style={{
                      borderTop: "1px solid rgba(0,0,0,0.08)",
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
        .home-page-root::-webkit-scrollbar { width: 6px; }
        .home-page-root::-webkit-scrollbar-track { background: #EEF2F8; }
        .home-page-root::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>
    </div>
  );
}
