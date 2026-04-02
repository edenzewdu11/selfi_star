import { useState, useEffect, useRef } from "react";
import { MessageCircle, Share2, Bookmark, MoreVertical, Flag, Info, UserPlus, UserCheck, UserX, Trash2, Edit, Bell } from "lucide-react";
import api from "../api";
import { ModernCommentSection } from "./ModernCommentSection";
import { WinnersSection } from "./WinnersSection";
import { VideoActionButton, VideoLikeButton } from "./VideoActionButton";
import { SearchBar } from "./SearchBar";
import { UserSuggestions } from "./UserSuggestions";
import { AlertModal } from "./AlertModal";
import { EditPostModal } from "./EditPostModal";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function TikTokLayout({ user, activeTab: propActiveTab, onLogout, onRequireAuth, onShowPostPage, onShowProfile, onShowSettings, onShowCampaigns, onShowNotifications }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  
  // Map external tab names to internal tab names
  const mapTabName = (tab) => {
    const tabMap = {
      'home': 'foryou',
      'search': 'search',
      'explore': 'explore',
      'reels': 'foryou',
      'messages': 'inbox',
      'notifications': 'notifications',
      'following': 'following',
      'bookmarks': 'bookmarks'
    };
    return tabMap[tab] || tab;
  };
  
  const [activeTab, setActiveTab] = useState(mapTabName(propActiveTab) || "foryou");
  
  // Update internal state when prop changes
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(mapTabName(propActiveTab));
    }
  }, [propActiveTab]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "", type: "info", onConfirm: null, showCancel: false });
  const [playingVideos, setPlayingVideos] = useState({});
  const [showPauseIcon, setShowPauseIcon] = useState({});
  const [showMenu, setShowMenu] = useState(null);
  const [followingUsers, setFollowingUsers] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [hoveredFollowButton, setHoveredFollowButton] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);
  const [followingList, setFollowingList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const videoRefs = useRef({});
  const videoContainerRefs = useRef({});
  const lastActiveTabRef = useRef(null);

  const fetchVideos = async (force = false) => {
    // Prevent multiple simultaneous fetches unless forced
    if (loading && !force) {
      console.log("🔄 fetchVideos: Already loading, skipping");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Fetching videos from API for tab:", activeTab);
      console.log("Current auth token:", api.getToken() ? api.getToken().substring(0, 10) + '...' : 'NONE');
      
      let reelsData = [];
      
      // Fetch different content based on active tab
      if (activeTab === "following") {
        // Fetch reels from followed users
        console.log("🎬 Fetching following reels...");
        reelsData = await api.request('/reels/following/');
      } else if (activeTab === "bookmarks") {
        // Fetch saved/bookmarked reels
        console.log("🎬 Fetching saved reels...");
        reelsData = await api.request('/reels/saved/');
      } else if (activeTab === "explore") {
        // Fetch trending/popular reels
        console.log("🎬 Fetching trending reels...");
        reelsData = await api.request('/reels/trending/');
      } else {
        // Default: For You feed
        console.log("🎬 Calling api.getReels() for 'foryou' tab...");
        reelsData = await api.getReels();
      }
      
      console.log("✅ API response received:", reelsData);
      console.log("Response type:", typeof reelsData);
      console.log("Is array?", Array.isArray(reelsData));
      
      // Handle different response formats
      const reelsList = Array.isArray(reelsData) ? reelsData : (reelsData.results || []);
      console.log("📝 Reels list length:", reelsList.length);
      
      if (reelsList.length === 0) {
        console.log("⚠️ No reels found in response");
        setVideos([]);
        return;
      }
      
      // Transform backend data to match frontend format
      const formattedVideos = reelsList.map(reel => {
        // Use media field first (for videos), then image field (for images)
        const videoUrl = reel.media || reel.image;
        
        // Better logic to determine if it's a video or image
        let isVideo = false;
        if (videoUrl) {
          // Primary: check file extension
          const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.ogg', '.mkv', '.flv'];
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
          const isVideoFile = videoExtensions.some(ext => videoUrl.toLowerCase().endsWith(ext));
          const isImageFile = imageExtensions.some(ext => videoUrl.toLowerCase().endsWith(ext));
          
          // If it's clearly an image file, mark as image regardless of field
          if (isImageFile) {
            isVideo = false;
          } 
          // If it's clearly a video file, mark as video
          else if (isVideoFile) {
            isVideo = true;
          }
          // Fallback: use field names if extension is unclear
          else if (reel.media !== null && reel.image === null) {
            // If media field exists and image doesn't, it's probably a video
            isVideo = true;
          } else if (reel.image !== null && reel.media === null) {
            // If image field exists and media doesn't, it's probably an image
            isVideo = false;
          } else {
            // Default to video if uncertain
            isVideo = true;
          }
          
          console.log(`🔍 File type detection for ${videoUrl}: isVideo=${isVideo}, isVideoFile=${isVideoFile}, isImageFile=${isImageFile}`);
        }
        
        // Initialize following status from backend data
        if (reel.user && reel.user.id !== undefined) {
          setFollowingUsers(prev => ({
            ...prev,
            [reel.user.id]: reel.user.is_following || false
          }));
        }
        
        console.log("🎬 Processing reel:", {
          id: reel.id,
          user: reel.user?.username,
          media: reel.media,
          image: reel.image,
          finalUrl: videoUrl,
          isVideo: isVideo,
          caption: reel.caption,
          isFollowing: reel.user?.is_following
        });
        
        return {
          id: reel.id,
          user: reel.user,
          creator: reel.user?.username || "Unknown User",
          handle: `@${reel.user?.username || "unknown"}`,
          avatar: "👤",
          caption: reel.caption,
          hashtags: reel.hashtags_list || [],
          likes: reel.votes || 0,
          comments: reel.comment_count || 0,
          shares: 0,
          imageUrl: videoUrl,
          isVideo: isVideo,
          liked: reel.is_liked || false,
          saved: reel.is_saved || false,
          created_at: reel.created_at,
        };
      });
      console.log("🎯 Formatted videos:", formattedVideos);
      console.log("🎯 Setting videos state with", formattedVideos.length, "items");
      setVideos(formattedVideos);
    } catch (error) {
      console.error("❌ Failed to fetch videos:", error);
      console.error("❌ Error details:", error.message, error.stack);
      // Don't use fallback data - show error instead
      setVideos([]);
    } finally {
      console.log("🏁 fetchVideos completed, setting loading to false");
      setLoading(false);
    }
  };

  // Refresh function that can be called from outside
  const refreshVideos = () => {
    console.log("🔄 Manual refresh triggered");
    console.log("🔍 Current followingUsers state before refresh:", followingUsers);
    setLoading(false); // Reset loading state
    fetchVideos(true); // Force the fetch
  };

  // Make refresh available globally
  useEffect(() => {
    window.refreshFeed = refreshVideos;
    return () => {
      window.refreshFeed = null;
    };
  }, [activeTab]);

  useEffect(() => {
    // Only fetch if the tab has actually changed
    if (lastActiveTabRef.current !== activeTab) {
      console.log("🔄 Tab changed from", lastActiveTabRef.current, "to", activeTab);
      lastActiveTabRef.current = activeTab;
      // Reset loading state before fetching
      setLoading(false);
      fetchVideos();
    } else {
      console.log("🔄 Tab unchanged, skipping fetch");
    }
  }, [activeTab]);

  // Also fetch on component mount
  useEffect(() => {
    console.log("🔄 Component mount effect triggered");
    console.log("Current loading state:", loading);
    console.log("Current videos length:", videos.length);
    
    // Force reset loading and fetch
    setLoading(false);
    console.log("🔄 Force reset loading, calling fetchVideos with force=true");
    fetchVideos(true); // Force the fetch
  }, []);

  // Fetch notification and message counts
  useEffect(() => {
    if (user) {
      fetchNotificationCounts();
      const interval = setInterval(fetchNotificationCounts, 5000); // Update every 5 seconds for better real-time experience
      
      // Listen for global notification refresh events
      const handleRefreshNotifications = () => {
        console.log('🔄 TikTokLayout received notification refresh event');
        fetchNotificationCounts();
      };
      window.addEventListener('refreshNotifications', handleRefreshNotifications);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshNotifications', handleRefreshNotifications);
      };
    }
  }, [user]);

  const fetchNotificationCounts = async () => {
    try {
      // Fetch notifications
      const notifications = await api.getUserNotifications();
      const unreadNotifications = notifications.filter(n => !n.read).length;
      setNotificationCount(unreadNotifications);

      // Fetch conversations for message count
      const conversations = await api.getConversations();
      const unreadMessages = conversations.filter(c => !c.is_read).length;
      setMessageCount(unreadMessages);
    } catch (error) {
      console.log('Failed to fetch notification counts:', error);
      // Don't show error to user, just log it and continue
    }
  };

  // IntersectionObserver to control video playback - only play visible video
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.7 // Video must be 70% visible to play
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        const videoId = entry.target.dataset.videoId;
        const videoElement = videoRefs.current[videoId];
        
        if (!videoElement) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          // Video is in view - play it
          videoElement.play().catch(err => console.log('Play prevented:', err));
          setPlayingVideos(prev => ({ ...prev, [videoId]: true }));
        } else {
          // Video is out of view - pause it
          videoElement.pause();
          setPlayingVideos(prev => ({ ...prev, [videoId]: false }));
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe all video containers
    Object.keys(videoContainerRefs.current).forEach(videoId => {
      const container = videoContainerRefs.current[videoId];
      if (container) {
        observer.observe(container);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [videos]);

  const handleCommentPosted = (comment) => {
    // Update the comment count for the specific video
    setVideos(prev => prev.map(video => 
      video.id === comment.reel 
        ? { ...video, comments: video.comments + 1 }
        : video
    ));
  };

  const toggleVideoPlayback = (videoId) => {
    const videoElement = videoRefs.current[videoId];
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
      setPlayingVideos(prev => ({ ...prev, [videoId]: true }));
    } else {
      videoElement.pause();
      setPlayingVideos(prev => ({ ...prev, [videoId]: false }));
    }

    // Show pause/play icon animation
    setShowPauseIcon(prev => ({ ...prev, [videoId]: true }));
    setTimeout(() => {
      setShowPauseIcon(prev => ({ ...prev, [videoId]: false }));
    }, 500);
  };

  const handleFollow = async (videoId, userId, username) => {
    if (!user) {
      setAlertModal({
        isOpen: true,
        title: "Login Required",
        message: "Please login to follow users.",
        type: "warning",
        onConfirm: onRequireAuth,
        showCancel: false
      });
      return;
    }

    try {
      const isCurrentlyFollowing = followingUsers[userId] || false;
      console.log(`👥 Follow action: user=${userId}, currentlyFollowing=${isCurrentlyFollowing}`);
      
      if (isCurrentlyFollowing) {
        await api.unfollowUser(userId);
        setFollowingUsers(prev => ({ ...prev, [userId]: false }));
        console.log(`✅ Unfollowed user ${userId}`);
      } else {
        await api.followUser(userId);
        setFollowingUsers(prev => ({ ...prev, [userId]: true }));
        console.log(`✅ Followed user ${userId}`);
      }
    } catch (error) {
      console.error('Follow error:', error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update follow status. Please try again.",
        type: "error",
        onConfirm: null,
        showCancel: false
      });
    }
  };

  const handleReport = (videoId) => {
    setShowMenu(null);
    setShowReportModal(videoId);
  };

  const submitReport = async (videoId, category) => {
    setShowReportModal(null);
    try {
      // Add report API call here when backend is ready
      console.log('Reported video:', videoId, 'Category:', category);
      setAlertModal({
        isOpen: true,
        title: "Reported",
        message: "Thank you for reporting. We'll review this content within 24 hours.",
        type: "success",
        onConfirm: null,
        showCancel: false
      });
    } catch (error) {
      console.error('Report error:', error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to submit report. Please try again.",
        type: "error",
        onConfirm: null,
        showCancel: false
      });
    }
  };

  const fetchFollowingUsers = async () => {
    try {
      console.log("👥 Fetching following users for share modal...");
      
      // Use the FollowViewSet endpoint which returns users you follow
      try {
        const response = await api.request('/follows/');
        console.log("📊 Follows endpoint response:", response);
        
        // The FollowViewSet returns Follow objects, we need to extract the following user data
        const followingUsers = response.map(follow => follow.following).filter(Boolean);
        
        setFollowingList(followingUsers);
        console.log("✅ Final following users loaded:", followingUsers?.length || 0);
        console.log("👥 Final following users:", followingUsers.map(u => ({ 
          id: u.id, 
          username: u.username, 
          followers_count: u.followers_count,
          is_following: true 
        })));
        
      } catch (e) {
        console.error("❌ Follows endpoint failed:", e);
        setFollowingList([]);
      }
      
    } catch (error) {
      console.error("❌ Failed to fetch following users:", error);
      setFollowingList([]);
    }
  };

  const handleShare = (videoId) => {
    setShowShareModal(videoId);
    fetchFollowingUsers();
  };

  const shareWithUser = async (videoId, userId, username) => {
    try {
      console.log(`📤 Sharing reel ${videoId} with user ${username} (${userId})`);
      
      // Check if user is authenticated
      if (!user) {
        console.error('❌ Cannot share: User not authenticated');
        setAlertModal({
          isOpen: true,
          title: "Login Required",
          message: "Please login to share reels with other users.",
          type: "error",
          onConfirm: null,
          showCancel: false
        });
        return;
      }
      
      // First, start or get conversation with the user
      const conversation = await api.startConversation(userId);
      console.log('📝 Conversation started/retrieved:', conversation);
      
      // Create share message
      const shareMessage = `Check out this amazing reel! ${window.location.origin}/post/${videoId}`;
      
      // Send message to the conversation
      await api.sendMessage(conversation.id || conversation.conversation_id, shareMessage, [], videoId);
      
      setShowShareModal(null);
      setAlertModal({
        isOpen: true,
        title: "Shared!",
        message: `Reel shared with ${username}`,
        type: "success",
        onConfirm: null,
        showCancel: false
      });
    } catch (error) {
      console.error('❌ Failed to share reel:', error);
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to share reel. Please try again.",
        type: "error",
        onConfirm: null,
        showCancel: false
      });
    }
  };

  const copyShareLink = (videoId) => {
    const postUrl = `${window.location.origin}/post/${videoId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setAlertModal({
        isOpen: true,
        title: "Success",
        message: "Link copied to clipboard!",
        type: "success",
        showCancel: false
      });
    }).catch(() => {
      setAlertModal({
        isOpen: true,
        title: "Error",
        message: "Failed to copy link",
        type: "error",
        showCancel: false
      });
    });
  };

  const handleNotInterested = (videoId) => {
    setShowMenu(null);
    // Remove video from feed
    setVideos(prev => prev.filter(v => v.id !== videoId));
    setAlertModal({
      isOpen: true,
      title: "Noted",
      message: "We'll show you less content like this.",
      type: "info",
      onConfirm: null,
      showCancel: false
    });
  };

  const handleInfo = (video) => {
    setShowMenu(null);
    setAlertModal({
      isOpen: true,
      title: "Video Information",
      message: `Creator: ${video.creator}\nLikes: ${video.likes}\nComments: ${video.comments}\nPosted: ${getRelativeTime(video.created_at)}`,
      type: "info",
      onConfirm: null,
      showCancel: false
    });
  };

  const handleDeletePost = (videoId) => {
    setShowMenu(null);
    setAlertModal({
      isOpen: true,
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      type: "warning",
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.deletePost(videoId);
          setVideos(prev => prev.filter(v => v.id !== videoId));
          setAlertModal({
            isOpen: true,
            title: "Deleted",
            message: "Your post has been deleted successfully.",
            type: "info",
            onConfirm: null,
            showCancel: false
          });
        } catch (error) {
          console.error("Failed to delete post:", error);
          setAlertModal({
            isOpen: true,
            title: "Error",
            message: error.error || "Failed to delete post. Please try again.",
            type: "warning",
            onConfirm: null,
            showCancel: false
          });
        }
      }
    });
  };

  const handleEditPost = (video) => {
    setShowMenu(null);
    setShowEditModal(video);
  };

  const handleUpdatePost = (updatedVideo) => {
    // Update the video in the state
    setVideos(prev => prev.map(v => 
      v.id === updatedVideo.id 
        ? { 
            ...v, 
            caption: updatedVideo.caption,
            hashtags: updatedVideo.hashtags_list || [],
            imageUrl: updatedVideo.media || updatedVideo.image || v.imageUrl
          }
        : v
    ));
    
    setAlertModal({
      isOpen: true,
      title: "Post Updated",
      message: "Your post has been updated successfully.",
      type: "success",
      onConfirm: null,
      showCancel: false
    });
  };

  const handleLike = async (videoId) => {
    if (!user) {
      setAlertModal({
        isOpen: true,
        title: "Login Required",
        message: "Please login to like posts. Click OK to go to login page or click outside to dismiss.",
        type: "warning",
        onConfirm: onRequireAuth,
        showCancel: false
      });
      return;
    }
    try {
      await api.voteReel(videoId);
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, liked: !v.liked, likes: v.liked ? v.likes - 1 : v.likes + 1 }
          : v
      ));
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleHashtagClick = async (hashtag) => {
    try {
      setLoading(true);
      console.log("Searching for hashtag:", hashtag);
      const results = await api.searchByHashtag(hashtag);
      const formattedVideos = results.map(reel => ({
        id: reel.id,
        creator: reel.user?.username || "Unknown User",
        handle: `@${reel.user?.username || "unknown"}`,
        avatar: "👤",
        caption: reel.caption,
        hashtags: reel.hashtags_list || [],
        likes: reel.votes || 0,
        comments: reel.comment_count || 0,
        shares: 0,
        imageUrl: reel.media || reel.image,
        liked: false,
      activeTab})) // Refetch when tab changes;
      setVideos(formattedVideos);
      setActiveTab(`hashtag-${hashtag}`);
    } catch (error) {
      console.error("Failed to search hashtag:", error);
      setAlertModal({
        isOpen: true,
        title: "Search Failed",
        message: "Failed to search. Please try again.",
        type: "error",
        showCancel: false
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove duplicate useEffect - fetchVideos is already called by the useEffect above

  // Expose fetchVideos function so it can be called from parent
  useEffect(() => {
    window.refreshFeed = fetchVideos;
  }, []);

  const recommendations = [
    { id: 1, name: "Sarah Creator", handle: "@sarahcreator", avatar: "👩", followers: "1.2M" },
    { id: 2, name: "Tech Guru", handle: "@techguru", avatar: "👨", followers: "2.5M" },
    { id: 3, name: "Cooking with Love", handle: "@cookingwithlove", avatar: "👩‍🍳", followers: "890K" },
    { id: 4, name: "Travel Vlogger", handle: "@travelvlogger", avatar: "✈️", followers: "3.1M" },
    { id: 5, name: "Fitness Coach", handle: "@fitnesscoachjohn", avatar: "💪", followers: "1.8M" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }

        /* Desktop styles */
        @media (min-width: 769px) {
          .desktop-tiktok-sidebar {
            display: flex !important;
          }
          .right-sidebar {
            display: block !important;
          }
          .video-feed {
            margin-left: 250px !important;
            margin-right: 320px !important;
          }
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .desktop-tiktok-sidebar {
            display: none !important;
          }
          .right-sidebar {
            display: none !important;
          }
          .video-feed {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: 60px 0 80px 0 !important; /* Account for mobile nav and header */
          }
          
          /* Show mobile notification button */
          .mobile-notification-bell {
            display: flex !important;
          }
          
          /* Adjust video containers for mobile */
          .video-feed > div > div > div {
            max-width: 100% !important;
            margin: 0 10px !important;
          }
          
          /* Make videos full width on mobile */
          .video-feed video,
          .video-feed img {
            width: 100% !important;
            height: auto !important;
            max-height: 70vh !important;
            object-fit: contain !important;
          }
        }

        /* Tablet styles */
        @media (min-width: 769px) and (max-width: 1024px) {
          .right-sidebar {
            width: 280px !important;
          }
          .video-feed {
            margin-right: 280px !important;
          }
        }
      `}</style>
      <div style={{ display: "flex", height: "100vh", background: T.bg }}>
      {/* LEFT SIDEBAR - Navigation - Hidden on mobile */}
      <div style={{
        width: 250,
        borderRight: `1px solid ${T.border}`,
        padding: "20px 0",
        overflowY: "auto",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        background: T.cardBg,
        display: "none",
      }}
      className="desktop-tiktok-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: "0 20px", marginBottom: 30 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.pri }}>⭐</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.txt, marginTop: 4 }}>Selfie Star</div>
        </div>

        {/* Navigation Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { id: "foryou", icon: "🏠", label: t('forYou') },
            { id: "explore", icon: "🔍", label: t('explore') },
            { id: "following", icon: "👥", label: t('following') },
            { id: "inbox", icon: "💬", label: t('inbox'), badge: messageCount },
            { id: "notifications", icon: "🔔", label: "Notifications", badge: notificationCount, action: "notifications" },
            { id: "bookmarks", icon: "🔖", label: t('bookmarks') },
            { id: "settings", icon: "⚙️", label: t('settings'), action: "settings" },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action === "settings") {
                  if (!user) {
                    onRequireAuth();
                  } else {
                    onShowSettings();
                  }
                } else if (item.action === "notifications") {
                  if (!user) {
                    onRequireAuth();
                  } else {
                    onShowNotifications?.();
                  }
                } else {
                  setActiveTab(item.id);
                }
              }}
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
                position: "relative",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
              {item.badge && item.badge > 0 && (
                <div style={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#ED4956",
                  color: "white",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 20,
                }}>
                  {item.badge > 99 ? "99+" : item.badge}
                </div>
              )}
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
            📹 {t('post')}
          </button>
        </div>

        {/* User Profile or Login */}
        <div style={{ padding: "20px", borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
          {user ? (
            <>
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username || user?.name}</div>
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
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRequireAuth}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: T.pri,
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                {t('login')}
              </button>
              <button
                onClick={onRequireAuth}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  border: `2px solid ${T.pri}`,
                  borderRadius: 8,
                  color: T.pri,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t('signUp')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* CENTER - Video Feed - Mobile Responsive */}
      <div className="video-feed" style={{
        marginLeft: 0,
        marginRight: 0,
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0",
        background: "#fff",
        minHeight: "100vh",
      }}>
        {/* Feed Header */}
        <div style={{ width: "100%", maxWidth: 600, padding: "0 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.txt, marginBottom: activeTab === "explore" ? 16 : 0 }}>
            {activeTab === "foryou" && "For You"}
            {activeTab === "explore" && "Explore"}
            {activeTab === "following" && "Following"}
            {activeTab === "inbox" && "Messages"}
            {activeTab === "bookmarks" && "Saved"}
          </div>
          
          {/* Search Bar - Only on Explore Tab */}
          {activeTab === "explore" && (
            <SearchBar
              onUserClick={(user) => {
                setSelectedUser(user);
                onShowProfile?.(user.id);
              }}
              onHashtagClick={(tag) => handleHashtagClick(tag)}
              onPostClick={(post) => {
                console.log("Post clicked:", post);
              }}
            />
          )}
        </div>

        {/* Messages/Inbox Tab */}
        {activeTab === "inbox" ? (
          <div style={{ width: "100%", maxWidth: 600, padding: "0 20px" }}>
            <div style={{
              background: T.cardBg,
              borderRadius: 16,
              padding: 60,
              textAlign: "center",
              border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 12 }}>
                Messages Coming Soon
              </h3>
              <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
                Direct messaging feature will be available soon. Stay tuned!
              </p>
            </div>
          </div>
        ) : (
          /* Videos Feed */
          <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 20, padding: "0 20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: T.sub }}>
                Loading {activeTab === "following" ? "following" : activeTab === "bookmarks" ? "saved" : activeTab === "explore" ? "trending" : ""}...
              </div>
            ) : videos.length === 0 ? (
              <div style={{
                background: T.cardBg,
                borderRadius: 16,
                padding: 60,
                textAlign: "center",
                border: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>
                  {activeTab === "following" && "👥"}
                  {activeTab === "bookmarks" && "🔖"}
                  {activeTab === "explore" && "🔍"}
                  {activeTab === "foryou" && "🎬"}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 12 }}>
                  {activeTab === "following" && "No posts from people you follow"}
                  {activeTab === "bookmarks" && "No saved posts yet"}
                  {activeTab === "explore" && "No trending posts"}
                  {activeTab === "foryou" && "No videos yet"}
                </h3>
                <p style={{ fontSize: 14, color: T.sub, margin: 0 }}>
                  {activeTab === "following" && "Follow creators to see their posts here"}
                  {activeTab === "bookmarks" && "Save posts to view them later"}
                  {activeTab === "explore" && "Check back soon for trending content"}
                  {activeTab === "foryou" && "Be the first to post!"}
                </p>
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
                maxHeight: 750,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Video/Image Background */}
              {video.imageUrl ? (
                video.isVideo ? (
                  <div 
                    ref={(el) => videoContainerRefs.current[video.id] = el}
                    data-video-id={video.id}
                    style={{ position: "relative", width: "100%", height: "100%", cursor: "pointer" }}
                    onClick={() => toggleVideoPlayback(video.id)}
                  >
                    <video
                      key={video.id}
                      ref={(el) => videoRefs.current[video.id] = el}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loop
                      playsInline
                      preload="auto"
                      crossOrigin="anonymous"
                      onLoadedData={(e) => {
                        console.log('✅ Video loaded successfully:', video.imageUrl);
                      }}
                      onError={(e) => {
                        const errorDetails = {
                          url: video.imageUrl,
                          errorCode: e.target.error?.code,
                          errorMessage: e.target.error?.message,
                          networkState: e.target.networkState,
                          readyState: e.target.readyState,
                          src: e.target.src
                        };
                        console.error('❌ Video load error:', errorDetails);
                        console.error('Error codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED');
                        if (e.target) {
                          e.target.style.display = "none";
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = "flex";
                          }
                        }
                      }}
                    >
                      <source 
                        src={video.imageUrl.startsWith('http') ? video.imageUrl : `http://localhost:8000${video.imageUrl}`}
                        type={video.imageUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'}
                      />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Pause/Play Animation - TikTok Style */}
                    {showPauseIcon[video.id] && (
                      <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "rgba(0, 0, 0, 0.3)",
                        backdropFilter: "blur(10px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "fadeInOut 0.6s ease-out",
                        pointerEvents: "none",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      }}>
                        <div style={{
                          fontSize: 32,
                          color: "#fff",
                          fontWeight: 300,
                        }}>
                          {playingVideos[video.id] ? "▶" : "❚❚"}
                        </div>
                      </div>
                    )}
                    
                    {/* Three Dots Menu - Top Right */}
                    <div style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      zIndex: 10,
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === video.id ? null : video.id);
                        }}
                        style={{
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
                        }}
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showMenu === video.id && (
                        <div style={{
                          position: "absolute",
                          top: 48,
                          right: 0,
                          background: "#fff",
                          borderRadius: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          minWidth: 180,
                          overflow: "hidden",
                          zIndex: 100,
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReport(video.id);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              fontSize: 14,
                              color: "#EF4444",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#FEE2E2"}
                            onMouseLeave={(e) => e.target.style.background = "none"}
                          >
                            <Flag size={16} />
                            Report
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotInterested(video.id);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              fontSize: 14,
                              color: T.txt,
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#F5F5F4"}
                            onMouseLeave={(e) => e.target.style.background = "none"}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="15" y1="9" x2="9" y2="15"/>
                            </svg>
                            Not Interested
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInfo(video);
                            }}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              fontSize: 14,
                              color: T.txt,
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => e.target.style.background = "#F5F5F4"}
                            onMouseLeave={(e) => e.target.style.background = "none"}
                          >
                            <Info size={16} />
                            Info
                          </button>
                          {user && video.user?.id === user.id && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(video);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
                                  border: "none",
                                  background: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  fontSize: 14,
                                  color: T.txt,
                                  borderTop: "1px solid #E5E5E5",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#F5F5F4"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              >
                                <Edit size={16} />
                                Edit Post
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(video.id);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "12px 16px",
                                  border: "none",
                                  background: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  fontSize: 14,
                                  color: "#EF4444",
                                  borderTop: "1px solid #E5E5E5",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#FEE2E2"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                              >
                                <Trash2 size={16} />
                                Delete Post
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <img
                    src={video.imageUrl.startsWith('http') ? video.imageUrl : `http://localhost:8000${video.imageUrl}`}
                    alt={video.caption}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                )
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
                paddingBottom: "24px",
                color: "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div 
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (video.user?.id) {
                        onShowProfile(video.user.id);
                      }
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: T.pri,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      border: "2px solid rgba(255,255,255,0.2)",
                    }}>
                      {video.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{video.creator}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{video.handle}</div>
                    </div>
                  </div>
                  
                  {/* Follow Button */}
                  {user && video.user?.id && video.creator !== user.username && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(video.id, video.user.id, video.creator);
                      }}
                      onMouseEnter={() => setHoveredFollowButton(video.user.id)}
                      onMouseLeave={() => setHoveredFollowButton(null)}
                      style={{
                        padding: "8px 20px",
                        border: (followingUsers[video.user.id] || video.user?.is_following) ? "1px solid rgba(255,255,255,0.4)" : "none",
                        background: (followingUsers[video.user.id] || video.user?.is_following) ? "rgba(255,255,255,0.15)" : T.pri,
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.2s",
                        boxShadow: (followingUsers[video.user.id] || video.user?.is_following) ? "none" : "0 2px 8px rgba(218, 155, 42, 0.4)",
                      }}
                    >
                      {(followingUsers[video.user.id] || video.user?.is_following) ? (
                        hoveredFollowButton === video.user.id ? (
                          <>
                            <UserX size={15} />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserCheck size={15} />
                            Following
                          </>
                        )
                      ) : (
                        <>
                          <UserPlus size={15} />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.4, marginBottom: 4 }}>
                  {video.caption}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                  {getRelativeTime(video.created_at)}
                </div>
                {video.hashtags && video.hashtags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {video.hashtags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleHashtagClick(tag)}
                        style={{
                          background: "rgba(218, 155, 42, 0.3)",
                          border: "none",
                          borderRadius: 12,
                          padding: "4px 10px",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all .2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(218, 155, 42, 0.5)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(218, 155, 42, 0.3)"}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions - Right Side */}
              <div style={{
                position: "absolute",
                right: 16,
                bottom: 100,
                display: "flex",
                flexDirection: "column",
                gap: 24,
                zIndex: 10,
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <VideoLikeButton
                    liked={video.liked}
                    count={video.likes}
                    onLike={() => handleLike(video.id)}
                    size={28}
                  />
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <VideoActionButton
                    icon={MessageCircle}
                    count={video.comments}
                    onClick={() => {
                      if (!user) {
                        setAlertModal({
                          isOpen: true,
                          title: "Login Required",
                          message: "Please login to comment on posts. Click OK to go to login page or click outside to dismiss.",
                          type: "warning",
                          onConfirm: onRequireAuth,
                          showCancel: false
                        });
                        return;
                      }
                      setShowComments(video.id);
                    }}
                    size={28}
                  />
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <VideoActionButton
                    icon={Share2}
                    count="Share"
                    onClick={() => handleShare(video.id)}
                    size={28}
                  />
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <VideoActionButton
                    icon={Bookmark}
                    count={video.saved ? "Saved" : "Save"}
                    onClick={async () => {
                      if (!user) {
                        setAlertModal({
                          isOpen: true,
                          title: "Login Required",
                          message: "Please login to save posts. Click OK to go to login page or click outside to dismiss.",
                          type: "warning",
                          onConfirm: onRequireAuth,
                          showCancel: false
                        });
                        return;
                      }
                      try {
                        const response = await api.toggleSavePost(video.id);
                        setVideos(videos.map(v => 
                          v.id === video.id 
                            ? { ...v, saved: response.saved }
                            : v
                        ));
                      } catch (error) {
                        console.error('Failed to save post:', error);
                      }
                    }}
                    isActive={video.saved}
                    activeColor={T.pri}
                    size={28}
                  />
                </div>
              </div>
            </div>
            ))
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Recommendations - Hidden on mobile */}
      <div className="right-sidebar" style={{
        width: 320,
        borderLeft: `1px solid ${T.border}`,
        padding: "20px",
        overflowY: "auto",
        position: "fixed",
        right: 0,
        top: 0,
        height: "100vh",
        background: "#fff",
        display: "none",
      }}>
        {/* User Suggestions */}
        <div>
          <UserSuggestions
            onUserClick={(user) => {
              setSelectedUser(user);
              onShowProfile?.(user.id);
            }}
          />
        </div>

        {/* Winners Section */}
        <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <WinnersSection />
        </div>

        {/* Footer Links */}
        <div style={{ marginTop: 30, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: T.sub }}>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>About</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Newsroom</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Contact</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Careers</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: T.sub, textDecoration: "none" }}>Terms</a>
          </div>
          <div style={{ fontSize: 10, color: T.sub, marginTop: 12 }}>
            © 2024 WorqPost (ወorqPost)
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <ModernCommentSection
          reelId={showComments}
          user={user}
          onClose={() => setShowComments(null)}
          onCommentPosted={handleCommentPosted}
        />
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <EditPostModal
          video={showEditModal}
          onClose={() => setShowEditModal(null)}
          onUpdate={handleUpdatePost}
        />
      )}

      {/* Report Category Modal */}
      {showReportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setShowReportModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, color: T.txt, marginBottom: 8 }}>
              Report Content
            </h3>
            <p style={{ fontSize: 14, color: T.sub, marginBottom: 20 }}>
              Why are you reporting this content?
            </p>
            
            {[
              { id: 'adult', label: 'Adult Content', icon: '🔞' },
              { id: 'spam', label: 'Spam or Misleading', icon: '⚠️' },
              { id: 'harassment', label: 'Harassment or Bullying', icon: '😢' },
              { id: 'violence', label: 'Violence or Dangerous', icon: '⚔️' },
              { id: 'hate', label: 'Hate Speech', icon: '🚫' },
              { id: 'copyright', label: 'Copyright Violation', icon: '©️' },
              { id: 'other', label: 'Other', icon: '❓' },
            ].map((category) => (
              <button
                key={category.id}
                onClick={() => submitReport(showReportModal, category.id)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  marginBottom: 8,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                  color: T.txt,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F5F5F4";
                  e.currentTarget.style.borderColor = T.pri;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.borderColor = T.border;
                }}
              >
                <span style={{ fontSize: 20 }}>{category.icon}</span>
                <span style={{ fontWeight: 500 }}>{category.label}</span>
              </button>
            ))}
            
            <button
              onClick={() => setShowReportModal(null)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: 12,
                border: "none",
                borderRadius: 8,
                background: T.border,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: T.txt,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        showCancel={alertModal.showCancel}
      />
      
      {/* Share Modal */}
      {showShareModal && (
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
          zIndex: 1000,
        }}>
          <div style={{
            background: T.cardBg,
            borderRadius: 16,
            padding: 24,
            maxWidth: 400,
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.txt, margin: 0 }}>
                Share Reel
              </h3>
              <button
                onClick={() => setShowShareModal(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.sub,
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            
            {/* Debug Info */}
            <div style={{
              fontSize: 10,
              color: T.sub,
              marginBottom: 16,
              padding: 8,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 4,
            }}>
              Debug: followingList.length={followingList.length}, followingUsers={Object.keys(followingUsers).length}
            </div>
            
            {/* Copy Link Option */}
            <button
              onClick={() => copyShareLink(showShareModal)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: T.pri,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Share2 size={16} />
              Copy Link
            </button>
            
            {/* Share with Followers */}
            {followingList.length > 0 && (
              <>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.txt,
                  marginBottom: 12,
                  marginTop: 8,
                }}>
                  Share with followers:
                </div>
                <div style={{
                  maxHeight: 300,
                  overflow: "auto",
                }}>
                  {followingList.map(user => (
                    <button
                      key={user.id}
                      onClick={() => shareWithUser(showShareModal, user.id, user.username)}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "transparent",
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        marginBottom: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = T.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: T.pri,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: 600,
                      }}>
                        {user.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div style={{
                        flex: 1,
                        textAlign: "left",
                      }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: T.txt,
                          marginBottom: 2,
                        }}>
                          {user.username}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: T.sub,
                        }}>
                          {user.followers_count || 0} followers
                        </div>
                      </div>
                      <Share2 size={16} style={{ color: T.sub }} />
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {followingList.length === 0 && (
              <div style={{
                textAlign: "center",
                padding: "20px 0",
                color: T.sub,
                fontSize: 14,
              }}>
                No followers to share with yet. Start following people to share reels!
                <br />
                <small>Debug: followingList={followingList.length}, followingUsers={Object.keys(followingUsers).length}</small>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Floating Notification Button for Mobile */}
      {user && (
        <button
          onClick={() => onShowNotifications?.()}
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: T.pri,
            border: "none",
            color: "#fff",
            fontSize: 24,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            display: "none", // Hidden on desktop, shown on mobile via CSS
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          className="mobile-notification-bell"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          🔔
          {notificationCount > 0 && (
            <div style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ED4956",
              color: "white",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              minWidth: 20,
            }}>
              {notificationCount > 99 ? "99+" : notificationCount}
            </div>
          )}
        </button>
      )}
    </div>
    </>
  );
}
