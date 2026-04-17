import { useState } from 'react';
import { Home, Search, Compass, Film, MessageCircle, Heart, PlusSquare, User, Menu, Trophy, Bell, Settings, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernSidebar({ user, activeTab, onTabChange, onShowPostPage, onLogout, onShowProfile, onShowSettings, onShowCampaigns, onShowNotifications }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "reels", icon: Film, label: "Reels" },
    { id: "explore", icon: Compass, label: t('explore') },
    { id: "messages", icon: MessageCircle, label: t('messages') },
    { id: "notifications", icon: Bell, label: t('notifications') },
    { id: "create", icon: PlusSquare, label: t('create') },
    { id: "profile", icon: User, label: t('profile') },
    { id: "campaigns", icon: Trophy, label: t('campaigns') },
    { id: "settings", icon: Settings, label: t('settings') },
  ];

  const handleItemClick = (itemId) => {
    if (itemId === "create") {
      onShowPostPage?.();
    } else if (itemId === "profile") {
      onShowProfile?.();
    } else if (itemId === "settings") {
      onShowSettings?.();
    } else if (itemId === "campaigns") {
      onShowCampaigns?.();
    } else if (itemId === "notifications") {
      onShowNotifications?.();
    } else {
      onTabChange?.(itemId);
    }
    // Close mobile menu after navigation
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div style={{
        width: 220,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: "#FFFFFF",
        borderRight: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 10px",
        zIndex: 100,
        boxShadow: "2px 0 12px rgba(0,0,0,0.06)",
      }}
      className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: "10px 14px", marginBottom: 24 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "1.5px",
            background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            WorqPost
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, letterSpacing: "0.5px" }}>ወorqPost ✦</div>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", paddingRight: 2 }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 14px",
                  border: "1px solid transparent",
                  background: isActive ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "transparent",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                  boxShadow: isActive ? "0 4px 14px rgba(124,58,237,0.35)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) { e.currentTarget.style.background = "rgba(124,58,237,0.09)"; }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) { e.currentTarget.style.background = "transparent"; }
                }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#FFFFFF" : "#6B7280"} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#FFFFFF" : "#374151", letterSpacing: "0.2px" }}>
                  {item.label}
                </span>
                {isActive && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.7)" }} />}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(0,0,0,0.08)", marginTop:"auto", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              {user.profile_photo ? (
                <img src={user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`} alt="Profile" style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(0,212,224,0.4)" }} />
              ) : (
                <div style={{ width:34, height:34, borderRadius:"50%", background:"rgba(124,58,237,0.12)", border:"2px solid rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>👤</div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.username}</div>
                <div style={{ fontSize:10, color:"#9CA3AF" }}>@{user.username}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ width:"100%", padding:"8px 10px", border:"1px solid rgba(255,75,110,0.3)", background:"rgba(255,75,110,0.08)", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700, color:"#FF4B6E", transition:"all 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,75,110,0.18)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,75,110,0.08)"}>
              {t('logout')}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 200,
            display: "none",
          }}
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Mobile Sidebar */}
          <div style={{ width:280, height:"100vh", position:"fixed", left:0, top:0, background:"#FFFFFF", borderRight:"1px solid rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", padding:"20px 12px", zIndex:201, boxShadow:"4px 0 20px rgba(0,0,0,0.08)" }}
            className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ position:"absolute", top:16, right:12, width:32, height:32, border:"1px solid rgba(0,0,0,0.1)", background:"rgba(0,0,0,0.05)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, color:"#374151" }}>
              <X size={18} />
            </button>
            <div style={{ padding:"10px 14px", marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:900, letterSpacing:"1.5px", background:"linear-gradient(135deg, #7C3AED, #4F46E5)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>WorqPost</div>
              <div style={{ fontSize:10, color:"#9CA3AF", marginTop:2 }}>ወorqPost ✦</div>
            </div>
            <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => handleItemClick(item.id)}
                    onMouseEnter={e => { if(!isActive) e.currentTarget.style.background="rgba(124,58,237,0.09)"; }}
                    onMouseLeave={e => { if(!isActive) e.currentTarget.style.background="transparent"; }}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px", border:"1px solid transparent", background: isActive ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "transparent", borderRadius:12, cursor:"pointer", transition:"all 0.2s", textAlign:"left", boxShadow: isActive ? "0 4px 14px rgba(124,58,237,0.3)" : "none" }}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#FFFFFF" : "#6B7280"} />
                    <span style={{ fontSize:15, fontWeight: isActive ? 700 : 500, color: isActive ? "#FFFFFF" : "#374151" }}>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            {user && (
              <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(0,0,0,0.08)", marginTop:"auto", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"rgba(124,58,237,0.12)", border:"2px solid rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👤</div>
                  <div><div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{user.username}</div><div style={{ fontSize:11, color:"#9CA3AF" }}>@{user.username}</div></div>
                </div>
                <button onClick={onLogout} style={{ width:"100%", padding:"9px 10px", border:"1px solid rgba(255,75,110,0.3)", background:"rgba(255,75,110,0.08)", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700, color:"#FF4B6E" }}>{t('logout')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 65,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        display: "none", alignItems: "center", justifyContent: "space-around",
        padding: "0 8px", zIndex: 100,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }} className="mobile-nav">
        {/* Home */}
        {[
          { id: "home", icon: Home, label: "Home" },
          { id: "reels", icon: Film, label: "Reels" },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => handleItemClick(item.id)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              border:"none", background:"transparent", cursor:"pointer", padding:6, flex:1,
              position:"relative",
            }}>
              {isActive && <div style={{ position:"absolute", top:-1, left:"50%", transform:"translateX(-50%)", width:24, height:2, background:"linear-gradient(90deg, #7C3AED, #4F46E5)", borderRadius:2 }} />}
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#7C3AED" : "#9CA3AF"} />
              <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500, color: isActive ? "#7C3AED" : "#9CA3AF", letterSpacing:"0.3px" }}>{item.label}</span>
            </button>
          );
        })}

        {/* Center Create Button */}
        <button onClick={() => handleItemClick("create")} style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          border:"none", background:"transparent", cursor:"pointer", padding:"0 6px", flex:1,
          position:"relative",
        }}>
          <div style={{
            width: 46, height: 46,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)",
            boxShadow: "0 4px 16px rgba(255,215,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 2,
          }}>
            <PlusSquare size={22} color="#0A1628" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize:9, fontWeight:700, color:"#FFD700", letterSpacing:"0.3px" }}>Create</span>
        </button>

        {/* Messages + Profile */}
        {[
          { id: "messages", icon: MessageCircle, label: "Messages" },
          { id: "profile", icon: User, label: "Profile" },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => handleItemClick(item.id)} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              border:"none", background:"transparent", cursor:"pointer", padding:6, flex:1,
              position:"relative",
            }}>
              {isActive && <div style={{ position:"absolute", top:-1, left:"50%", transform:"translateX(-50%)", width:24, height:2, background:"linear-gradient(90deg, #7C3AED, #4F46E5)", borderRadius:2 }} />}
              <Icon size={21} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#7C3AED" : "#9CA3AF"} />
              <span style={{ fontSize:9, fontWeight: isActive ? 700 : 500, color: isActive ? "#7C3AED" : "#9CA3AF", letterSpacing:"0.3px" }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Menu Toggle Button */}
      <button onClick={() => setIsMobileMenuOpen(true)} style={{
        position:"fixed", top:16, left:16, width:40, height:40,
        border:"1px solid rgba(0,212,224,0.3)",
        background:"rgba(0,212,224,0.1)",
        backdropFilter:"blur(10px)",
        borderRadius:12, cursor:"pointer", display:"none",
        alignItems:"center", justifyContent:"center",
        zIndex:99, boxShadow:"0 2px 12px rgba(0,0,0,0.4)",
      }} className="mobile-menu-toggle">
        <Menu size={18} color="#00D4E0" />
      </button>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-overlay {
            display: flex !important;
          }
          .mobile-nav {
            display: flex !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-menu-overlay {
            display: none !important;
          }
          .mobile-nav {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
