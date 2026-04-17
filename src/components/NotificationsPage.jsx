import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, MessageCircle, UserPlus, Trophy, Bell, ArrowLeft, Video, Send, Trash2 } from "lucide-react";
import api from "../api";
import { getRelativeTime } from "../utils/timeUtils";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ModernSidebar } from "./ModernSidebar";

export function NotificationsPage({ user, onUserClick, onBack, onShowPostPage, onLogout, onShowProfile, onShowSettings, onShowCampaigns }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [realTimeNotifications, setRealTimeNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'polling', 'offline'
  const wsRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastNotificationIdRef = useRef(0);

  useEffect(() => {
    fetchNotifications();
    setupRealTimeNotifications();
    startPolling();
    requestNotificationPermission();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.log('Notification permission request failed:', error);
      }
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await api.getUserNotifications();
      
      // Transform backend data to match component structure
      const transformedNotifications = data.map(notif => ({
        id: notif.id,
        type: notif.type || 'campaign',
        message: notif.message,
        notification_type: notif.notification_type,
        read: notif.read,
        timestamp: new Date(notif.timestamp),
        campaign_id: notif.campaign_id,
        user: notif.user,
        post: notif.post,
        comment: notif.comment,
        reel: notif.reel,
        video_url: notif.video_url,
        thumbnail_url: notif.thumbnail_url,
      }));
      
      setNotifications(transformedNotifications);
      
      // Calculate unread count
      const unread = transformedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Update last notification ID for real-time updates
      if (transformedNotifications.length > 0) {
        lastNotificationIdRef.current = Math.max(...transformedNotifications.map(n => n.id));
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeNotifications = () => {
    if (!user) return;
    
    setConnectionStatus('connecting');
    
    try {
      // Get auth token for WebSocket authentication
      const authToken = api.getToken();
      const tokenParam = authToken ? `?token=${authToken}` : '';
      
      // WebSocket for real-time notifications
      const wsUrl = `ws://localhost:8000/ws/notifications/${user.id}/${tokenParam}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected for notifications');
        setConnectionStatus('connected');
        // Clear polling when WebSocket connects
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('📨 WebSocket notification received:', notification);
          handleNewNotification(notification);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setConnectionStatus('polling');
        // Start polling if WebSocket closes unexpectedly
        if (event.code !== 1000) {
          console.log('🔄 WebSocket closed unexpectedly, starting polling fallback');
          startPolling();
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.log('❌ WebSocket error:', error);
        console.log('💡 Note: WebSocket requires Daphne server instead of Django development server');
        setConnectionStatus('polling');
        // Start polling as fallback
        startPolling();
      };
      
      // Set a timeout to fallback to polling if WebSocket doesn't connect
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.log('⏰ WebSocket connection timeout, falling back to polling');
          wsRef.current.close();
          setConnectionStatus('polling');
          startPolling();
        }
      }, 5000); // 5 second timeout
      
    } catch (error) {
      console.log('❌ WebSocket setup failed, using polling:', error);
      setConnectionStatus('polling');
      startPolling();
    }
  };
  
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setConnectionStatus('polling');
    console.log('🔄 Starting polling for notifications (5-second intervals)');
    
    // Poll for new notifications every 5 seconds for better real-time experience
    pollingIntervalRef.current = setInterval(() => {
      checkForNewNotifications();
    }, 5000);
    
    // Also check immediately
    checkForNewNotifications();
  };
  
  const checkForNewNotifications = async () => {
    if (!user) return;
    
    try {
      const data = await api.getUserNotifications();
      const newNotifications = data.filter(n => n.id > lastNotificationIdRef.current);
      
      if (newNotifications.length > 0) {
        newNotifications.forEach(notif => {
          handleNewNotification(notif);
        });
      }
    } catch (error) {
      console.log('Polling error:', error);
    }
  };
  
  const handleNewNotification = (notification) => {
    // Transform and add the new notification
    const transformedNotif = {
      id: notification.id,
      type: notification.type || 'campaign',
      message: notification.message,
      notification_type: notification.notification_type,
      read: false, // New notifications are unread
      timestamp: new Date(notification.timestamp),
      campaign_id: notification.campaign_id,
      user: notification.user,
      post: notification.post,
      comment: notification.comment,
      reel: notification.reel,
      video_url: notification.video_url,
      thumbnail_url: notification.thumbnail_url,
    };
    
    setNotifications(prev => [transformedNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
    setRealTimeNotifications(prev => [transformedNotif, ...prev.slice(0, 4)]); // Keep only last 5 real-time notifications
    
    // Update last notification ID
    lastNotificationIdRef.current = Math.max(lastNotificationIdRef.current, notification.id);
    
    // Play notification sound
    playNotificationSound();
    
    // Show browser notification if permission granted
    showBrowserNotification(transformedNotif);
  };
  
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound
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
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };
  
  const showBrowserNotification = (notification) => {
    if (Notification.permission === 'granted') {
      const notificationTitle = getNotificationTitle(notification);
      const notificationOptions = {
        body: notification.message,
        icon: notification.user?.profile_photo ? 
        (notification.user.profile_photo.startsWith('http') ? notification.user.profile_photo : `http://localhost:8000${notification.user.profile_photo}`) 
        : '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: false,
      };
      
      const browserNotification = new Notification(notificationTitle, notificationOptions);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
      
      // Handle click
      browserNotification.onclick = () => {
        handleNotificationClick(notification);
        browserNotification.close();
      };
    }
  };
  
  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.user?.username || 'Someone'} liked your ${notification.reel ? 'video' : 'post'}`;
      case 'comment':
        return `${notification.user?.username || 'Someone'} commented on your ${notification.reel ? 'video' : 'post'}`;
      case 'follow':
        return `${notification.user?.username || 'Someone'} started following you`;
      case 'message':
        return `New message from ${notification.user?.username || 'Someone'}`;
      case 'new_video':
        return `New video from ${notification.user?.username || 'Someone you follow'}`;
      case 'campaign':
        return 'Campaign Update';
      default:
        return 'New Notification';
    }
  };
  
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'message' && notification.conversation_id) {
      // Navigate to messages - the app should handle opening the conversation
      // We need to trigger the messages page and pass the conversation ID
      onBack(); // Go back to main app first
      // Then trigger messages navigation with a delay to let the main app render
      setTimeout(() => {
        const event = new CustomEvent('navigateToMessages', { 
          detail: { conversationId: notification.conversation_id } 
        });
        window.dispatchEvent(event);
      }, 100);
    } else if (notification.reel || notification.post) {
      // Navigate to post
      onShowPostPage?.(notification.reel?.id || notification.post?.id);
    } else if (notification.user) {
      // Navigate to user profile
      onUserClick?.(notification.user.id);
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  const deleteNotification = async (notificationId) => {
    try {
      await api.deleteNotification(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart size={20} color="#ED4956" fill="#ED4956" />;
      case "comment":
        return <MessageCircle size={20} color={T.pri} />;
      case "follow":
        return <UserPlus size={20} color={T.pri} />;
      case "message":
        return <Send size={20} color={T.pri} />;
      case "new_video":
        return <Video size={20} color={T.pri} />;
      case "campaign":
        return <Trophy size={20} color="#FFD700" />;
      default:
        return <Bell size={20} color={T.pri} />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === "all") return true;
    return notif.type === activeFilter;
  });

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={{ display: "flex", height: "100vh", background: "linear-gradient(160deg, #060D1F 0%, #0A1628 60%, #0D1E3A 100%)" }}>
      {/* Sidebar */}
      <ModernSidebar
        user={user}
        activeTab="notifications"
        onTabChange={onBack}
        onShowPostPage={onShowPostPage}
        onLogout={onLogout}
        onShowProfile={onShowProfile}
        onShowSettings={onShowSettings}
        onShowCampaigns={onShowCampaigns}
        onShowNotifications={() => {}}
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: 600,
          margin: "0 auto",
        }}>
          {/* Header */}
          <div style={{
            marginBottom: 24,
          }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: T.txt,
              marginBottom: 8,
            }}>
              {t('notifications')}
            </h1>
            <p style={{
              fontSize: 14,
              color: T.sub,
            }}>
              Stay updated with your activity
            </p>
          </div>

          {/* Header Actions */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 14,
              color: T.sub,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              {/* Connection Status Indicator */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: connectionStatus === 'connected' ? '#10B981' : 
                             connectionStatus === 'polling' ? '#0EA5E9' : '#EF4444',
                  animation: connectionStatus === 'polling' ? 'pulse 2s infinite' : 'none',
                }}></div>
                <span style={{ color: T.sub }}>
                  {connectionStatus === 'connected' ? 'Live' : 
                   connectionStatus === 'polling' ? 'Updating' : 'Offline'}
                </span>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: "6px 12px",
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  color: T.txt,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Real-time Notifications Popup */}
          {realTimeNotifications.length > 0 && (
            <div style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 1000,
              maxWidth: 320,
            }}>
              {realTimeNotifications.map((notif, index) => (
                <div
                  key={`${notif.id}-${index}`}
                  style={{
                    background: T.cardBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    animation: "slideInRight 0.3s ease-out",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    handleNotificationClick(notif);
                    setRealTimeNotifications(prev => prev.filter(n => n.id !== notif.id));
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: T.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.txt,
                        marginBottom: 2,
                      }}>
                        {getNotificationTitle(notif)}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: T.sub,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {notif.message}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRealTimeNotifications(prev => prev.filter(n => n.id !== notif.id));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: T.sub,
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            overflowX: "auto",
            paddingBottom: 8,
          }}>
            {[
              { id: "all", label: "All", icon: Bell },
              { id: "like", label: "Likes", icon: Heart },
              { id: "comment", label: "Comments", icon: MessageCircle },
              { id: "follow", label: "Follows", icon: UserPlus },
              { id: "message", label: "Messages", icon: Send },
              { id: "new_video", label: "New Videos", icon: Video },
              { id: "campaign", label: "Campaigns", icon: Trophy },
            ].map(filter => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  style={{
                    padding: "8px 16px",
                    border: `1px solid ${isActive ? T.pri : T.border}`,
                    background: isActive ? T.pri + "20" : "transparent",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: isActive ? T.pri : T.txt,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div style={{
              textAlign: "center",
              padding: 40,
              color: T.sub,
            }}>
              {t('loading')}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 60,
            }}>
              <Bell size={48} color={T.sub} style={{ marginBottom: 16 }} />
              <div style={{
                fontSize: 16,
                fontWeight: 600,
                color: T.txt,
                marginBottom: 8,
              }}>
                No notifications yet
              </div>
              <div style={{
                fontSize: 14,
                color: T.sub,
              }}>
                When you get notifications, they'll show up here
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}>
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: 16,
                    background: notif.read ? "transparent" : T.cardBg,
                    borderRadius: 12,
                    cursor: "pointer",
                    transition: "background 0.2s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.read ? "transparent" : T.cardBg;
                  }}
                >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                {notif.user ? (
                  notif.user.profile_photo ? (
                    <img
                      src={notif.user.profile_photo.startsWith('http') ? notif.user.profile_photo : `http://localhost:8000${notif.user.profile_photo}`}
                      alt={notif.user.username}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: T.pri + "30",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}>
                      👤
                    </div>
                  )
                ) : (
                  getNotificationIcon(notif.type)
                )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  color: T.txt,
                  marginBottom: 4,
                }}>
                  {notif.user && (
                    <span style={{ fontWeight: 700 }}>
                      {notif.user.username}
                    </span>
                  )}{" "}
                  <span style={{ color: T.sub }}>
                    {notif.message}
                  </span>
                </div>
                {notif.comment && (
                  <div style={{
                    fontSize: 13,
                    color: T.txt,
                    marginBottom: 4,
                    fontStyle: "italic",
                  }}>
                    "{notif.comment}"
                  </div>
                )}
                <div style={{
                  fontSize: 12,
                  color: T.sub,
                }}>
                  {getRelativeTime(notif.timestamp)}
                </div>
                </div>

                {/* Post Thumbnail */}
                {notif.post && (
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: T.border,
                  flexShrink: 0,
                  overflow: "hidden",
                }}>
                  {notif.post.thumbnail && (
                    <img
                      src={notif.post.thumbnail}
                      alt="Post"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                )}

                {/* Unread Indicator */}
                {!notif.read && (
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: T.pri,
                  flexShrink: 0,
                  marginTop: 6,
                }}></div>
                )}
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "none",
                    border: "none",
                    color: T.sub,
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 4,
                    opacity: 0.7,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = 1;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = 0.7;
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
}
