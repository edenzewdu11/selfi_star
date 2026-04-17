import { useState, useEffect, useTransition, lazy, Suspense } from 'react'
import { ModernSidebar } from './components/ModernSidebar'
import { ModernLoginScreen } from "./components/ModernLoginScreen";
import { ModernRegisterScreen } from "./components/ModernRegisterScreen";
import { AdminApp } from './admin/AdminApp'
import api from './api'
import { debugTokens, clearTokenConfusion } from './tokenDebug'

const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const TikTokLayout = lazy(() => import('./components/TikTokLayout').then(m => ({ default: m.TikTokLayout })));
const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
const EnhancedPostPage = lazy(() => import('./components/EnhancedPostPage').then(m => ({ default: m.EnhancedPostPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import('./components/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const FollowersListPage = lazy(() => import('./components/FollowersListPage').then(m => ({ default: m.FollowersListPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('./components/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const MessagingPage = lazy(() => import('./components/MessagingPage').then(m => ({ default: m.MessagingPage })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage').then(m => ({ default: m.CampaignDetailPage })));

export default function WerqRoot() {
  // Check if accessing admin panel
  if (window.location.pathname === '/admin' || window.location.hash === '#/admin') {
    return <AdminApp />;
  }

  const [screen, setScreen] = useState("app");
  const [authUser, setAuthUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showPostPage, setShowPostPage] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileUserId, setProfileUserId] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showFollowersList, setShowFollowersList] = useState(false)
  const [followersListType, setFollowersListType] = useState('followers')
  const [followersListUserId, setFollowersListUserId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [showCampaigns, setShowCampaigns] = useState(false)
  const [showCampaignDetail, setShowCampaignDetail] = useState(false)
  const [campaignId, setCampaignId] = useState(null)
  const [, startTransition] = useTransition()

  // Function to reset all special page states
  const resetAllPages = () => {
    setShowPostPage(false)
    setShowProfile(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
    setShowSettings(false)
    setShowNotifications(false)
    setShowMessages(false)
    setShowCampaigns(false)
    setShowCampaignDetail(false)
  }

  // Load user from localStorage on mount
  useEffect(() => {
    // Debug tokens on app startup
    debugTokens();
    
    // Clear any token confusion
    clearTokenConfusion();
    
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedToken && savedToken.length > 10) {
      api.setAuthToken(savedToken);
      if (savedUser) {
        try {
          setAuthUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse saved user:', e);
        }
      }
      // Test the token by making a simple API call
      api.getProfile().then(profile => {
        // Verify the profile matches what we expect
        if (profile.user && profile.user.username === 'admin' && !window.location.pathname.includes('/admin')) {
          console.warn('Admin token detected in regular app - please log out and back in.');
        }
        setAuthUser(profile.user);
        localStorage.setItem('user', JSON.stringify(profile.user));
      }).catch(err => {
        console.error('Token validation failed:', err);
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        api.setAuthToken(null);
        setAuthUser(null);
      });
    }
  }, [])

  // Handle hash-based routing for campaign details
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      console.log('Hash changed:', hash);
      
      // Check for campaign detail hash like #/campaign/10
      const campaignMatch = hash.match(/^#\/campaign\/(\d+)$/);
      if (campaignMatch) {
        const campaignId = parseInt(campaignMatch[1]);
        console.log('Campaign detail hash detected, campaignId:', campaignId);
        setCampaignId(campaignId);
        setShowCampaigns(false);
        setShowCampaignDetail(true);
      }
    };

    // Check on initial load
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [])

  // Listen for navigate to create post event from campaign modal
  useEffect(() => {
    const handleNavigateToCreatePost = () => {
      setShowPostPage(true)
      setShowProfile(false)
      setShowEditProfile(false)
      setShowFollowersList(false)
      setShowCampaigns(false)
      setShowCampaignDetail(false)
    }
    window.addEventListener('navigateToCreatePost', handleNavigateToCreatePost)
    
    return () => {
      window.removeEventListener('navigateToCreatePost', handleNavigateToCreatePost)
    }
  }, [])

  // Add global notification refresh function
  useEffect(() => {
    window.refreshNotifications = () => {
      console.log('🔄 Global notification refresh triggered');
      // Trigger notification count update in TikTokLayout if it's mounted
      const event = new CustomEvent('refreshNotifications');
      window.dispatchEvent(event);
    };
    
    return () => {
      delete window.refreshNotifications;
    };
  }, []);

  // Listen for navigation to messages with specific conversation
  useEffect(() => {
    const handleNavigateToMessages = (event) => {
      const { conversationId } = event.detail;
      console.log('📨 Navigating to messages with conversation:', conversationId);
      
      // Reset all pages and show messages
      resetAllPages();
      setShowMessages(true);
      
      // Store the conversation ID to be used by MessagingPage
      window.targetConversationId = conversationId;
    };
    
    window.addEventListener('navigateToMessages', handleNavigateToMessages);
    
    return () => {
      window.removeEventListener('navigateToMessages', handleNavigateToMessages);
      delete window.targetConversationId;
    };
  }, []);

  const handleLogout = () => {
    api.setAuthToken(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setAuthUser(null)
    setShowProfile(false)
    setShowPostPage(false)
    setActiveTab('home')
  }

  const handleShowProfile = (userId = null) => {
    setProfileUserId(userId)
    setShowProfile(true)
    setShowPostPage(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
  }

  const handleShowPostPage = () => {
    setShowPostPage(true)
    setShowProfile(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
  }

  const handleShowEditProfile = () => {
    setShowEditProfile(true)
    setShowProfile(false)
    setShowPostPage(false)
    setShowFollowersList(false)
    setShowSettings(false)
  }

  const handleShowFollowers = (userId, type = 'followers') => {
    setFollowersListUserId(userId)
    setFollowersListType(type)
    setShowFollowersList(true)
    setShowProfile(false)
    setShowPostPage(false)
    setShowEditProfile(false)
    setShowSettings(false)
  }

  const handleShowSettings = () => {
    setShowSettings(true)
    setShowProfile(false)
    setShowPostPage(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
    setShowCampaigns(false)
    setShowCampaignDetail(false)
  }

  const handleShowCampaigns = () => {
    setShowCampaigns(true)
    setShowProfile(false)
    setShowPostPage(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
    setShowSettings(false)
    setShowNotifications(false)
    setShowCampaignDetail(false)
  }

  const handleShowNotifications = () => {
    setShowNotifications(true)
    setShowProfile(false)
    setShowPostPage(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
    setShowSettings(false)
    setShowMessages(false)
    setShowCampaigns(false)
    setShowCampaignDetail(false)
  }

  const handleShowMessages = () => {
    setShowMessages(true)
    setShowProfile(false)
    setShowPostPage(false)
    setShowEditProfile(false)
    setShowFollowersList(false)
    setShowSettings(false)
    setShowNotifications(false)
    setShowCampaigns(false)
    setShowCampaignDetail(false)
  }

  const handleProfileSaved = (updatedUser) => {
    setAuthUser(updatedUser)
  }

  const handleRequireAuth = () => {
    setShowLogin(true)
  }

  const fallback = (
    <div style={{ minHeight:"100vh", background:"#060D1F", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>✨</div>
        <div style={{ color:"#00D4E0", fontSize:14, fontWeight:600 }}>Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="App" style={{ minHeight: "100vh", position: "relative" }}>
    <Suspense fallback={fallback}>
      {authUser && !showNotifications && !showMessages && (
        <ModernSidebar
          user={authUser}
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'messages') {
              handleShowMessages()
            } else {
              startTransition(() => {
                resetAllPages()
                setActiveTab(tab)
              })
            }
          }}
          onShowPostPage={handleShowPostPage}
          onLogout={handleLogout}
          onShowProfile={() => handleShowProfile(null)}
          onShowSettings={handleShowSettings}
          onShowCampaigns={handleShowCampaigns}
          onShowNotifications={handleShowNotifications}
        />
      )}
      
      {showSettings ? (
        <SettingsPage
          user={authUser}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      ) : showNotifications ? (
        <NotificationsPage
          user={authUser}
          onUserClick={(userId) => {
            setShowNotifications(false);
            handleShowProfile(userId);
          }}
          onBack={() => setShowNotifications(false)}
          onShowPostPage={handleShowPostPage}
          onLogout={handleLogout}
          onShowProfile={() => handleShowProfile(null)}
          onShowSettings={handleShowSettings}
          onShowCampaigns={handleShowCampaigns}
        />
      ) : showMessages ? (
        <MessagingPage
          user={authUser}
          onBack={() => setShowMessages(false)}
        />
      ) : showEditProfile ? (
        <EditProfilePage
          user={authUser}
          onBack={() => {
            setShowEditProfile(false)
            setShowProfile(true)
          }}
          onSave={handleProfileSaved}
        />
      ) : showFollowersList ? (
        <FollowersListPage
          userId={followersListUserId}
          type={followersListType}
          onBack={() => {
            setShowFollowersList(false)
            setShowProfile(true)
          }}
          onUserClick={(user) => handleShowProfile(user.id)}
        />
      ) : showProfile ? (
        <ProfilePage
          user={authUser}
          userId={profileUserId}
          onBack={() => setShowProfile(false)}
          onEditProfile={handleShowEditProfile}
          onShowFollowers={(userId) => handleShowFollowers(userId, 'followers')}
          onShowFollowing={(userId) => handleShowFollowers(userId, 'following')}
        />
      ) : showCampaignDetail ? (
        <CampaignDetailPage 
          theme={{
            pri: "#00D4E0",
            txt: "#FFFFFF",
            sub: "#7ABFCC",
            bg: "#060D1F",
            card: "#FFFFFF",
            border: "#E7E5E4",
            blue: "#3B82F6",
            green: "#10B981",
            red: "#EF4444",
            orange: "#F5A623",
            purple: "#8B5CF6",
          }}
          campaignId={campaignId}
          onBack={() => {
            setShowCampaignDetail(false);
            setShowCampaigns(true);
          }}
        />
      ) : showCampaigns ? (
        <CampaignsPage 
          theme={{
            pri: "#00D4E0",
            txt: "#FFFFFF",
            sub: "#7ABFCC",
            bg: "#060D1F",
            card: "#FFFFFF",
            border: "#E7E5E4",
            blue: "#3B82F6",
            green: "#10B981",
            red: "#EF4444",
            orange: "#F5A623",
            purple: "#8B5CF6",
          }}
          onCampaignClick={(id) => {
            setCampaignId(id);
            setShowCampaigns(false);
            setShowCampaignDetail(true);
          }}
          onBack={() => setShowCampaigns(false)}
        />
      ) : activeTab === 'home' && !showPostPage && !showProfile && !showSettings && !showNotifications && !showMessages && !showCampaigns && !showCampaignDetail && !showEditProfile && !showFollowersList && screen !== 'landing' ? (
        <HomePage
          user={authUser}
          onShowProfile={handleShowProfile}
          onRequireAuth={handleRequireAuth}
          onShowCampaigns={handleShowCampaigns}
          onSwitchToReels={() => startTransition(() => { resetAllPages(); setActiveTab('reels'); })}
        />
      ) : showPostPage ? (
        <EnhancedPostPage user={authUser} onBack={() => setShowPostPage(false)} />
      ) : screen === "landing" ? (
        <LandingPage 
          onLogin={() => setShowLogin(true)} 
          onRegister={() => setShowRegister(true)}
          onShowCampaigns={handleShowCampaigns}
        />
      ) : (
        <TikTokLayout 
          user={authUser}
          activeTab={activeTab}
          onLogout={handleLogout}
          onRequireAuth={handleRequireAuth}
          onShowPostPage={handleShowPostPage}
          onShowProfile={handleShowProfile}
          onShowSettings={handleShowSettings}
          onShowCampaigns={handleShowCampaigns}
          onShowNotifications={handleShowNotifications}
        />
      )}
      {showLogin && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            overflow: "auto",
          }}
          onClick={() => setShowLogin(false)}
        >
          <div 
            style={{ width: "100%", maxWidth: 480, margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModernLoginScreen 
              onSuccess={u=>{ 
                setAuthUser(u);
                localStorage.setItem('user', JSON.stringify(u));
                // Token is already saved by api.login() in ModernLoginScreen
                setShowLogin(false);
              }} 
              onRegister={()=>{ 
                setShowLogin(false);
                setShowRegister(true);
              }} 
              onBack={()=>setShowLogin(false)} 
            />
          </div>
        </div>
      )}

      {showRegister && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            overflow: "auto",
          }}
          onClick={() => setShowRegister(false)}
        >
          <div 
            style={{ width: "100%", maxWidth: 480, margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModernRegisterScreen 
              onSuccess={u=>{ 
                setAuthUser(u);
                localStorage.setItem('user', JSON.stringify(u));
                // Token is already saved by api.register() in ModernRegisterScreen
                setShowRegister(false);
              }} 
              onLogin={()=>{ 
                setShowRegister(false);
                setShowLogin(true);
              }} 
              onBack={()=>setShowRegister(false)} 
            />
          </div>
        </div>
      )}
      
      {/* Global Mobile Styles */}
      <style>{`
        /* Global mobile styles */
        @media (max-width: 768px) {
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          body {
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
          }
          
          .App {
            overflow-x: hidden;
          }
          
          /* Ensure modals work on mobile */
          .modal-overlay {
            padding: 20px !important;
          }
          
          .modal-content {
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
        
        /* Prevent horizontal scroll on all devices */
        html, body {
          overflow-x: hidden;
          max-width: 100%;
        }
        
        /* Responsive typography */
        @media (max-width: 480px) {
          h1 { font-size: 1.5rem !important; }
          h2 { font-size: 1.25rem !important; }
          h3 { font-size: 1.1rem !important; }
        }
      `}</style>
    </Suspense>
    </div>
  );
}
