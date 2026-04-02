import { useState } from 'react';
import { Home, Search, Compass, Film, MessageCircle, Heart, PlusSquare, User, Menu, Trophy, Bell, Settings, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernSidebar({ user, activeTab, onTabChange, onShowPostPage, onLogout, onShowProfile, onShowSettings, onShowCampaigns, onShowNotifications }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { id: "home", icon: Home, label: t('home') },
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
        width: 240,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        background: T.cardBg,
        borderRight: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        zIndex: 100,
      }}
      className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{
          padding: "12px 16px",
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${T.pri}, ${T.dark})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            WorqPost
          </div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>ወorqPost</div>
        </div>

        {/* Menu Items */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", paddingRight: 4 }}>
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
                  gap: 12,
                  padding: "10px 14px",
                  border: "none",
                  background: isActive ? T.bg : "transparent",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = T.bg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? T.pri : T.txt}
                />
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.txt : T.txt,
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        {user && (
          <div style={{
            padding: "10px 14px",
            borderTop: `1px solid ${T.border}`,
            marginTop: "auto",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              {user.profile_photo ? (
                <img
                  src={user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`}
                  alt="Profile"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: T.pri + "30",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}>
                  👤
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.username}
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>
                  @{user.username}
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: `1px solid ${T.border}`,
                background: "transparent",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: T.txt,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
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
          <div
            style={{
              width: 280,
              height: "100vh",
              position: "fixed",
              left: 0,
              top: 0,
              background: T.cardBg,
              borderRight: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              padding: "20px 12px",
              zIndex: 201,
            }}
            className="mobile-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: "absolute",
                top: 20,
                right: 12,
                width: 32,
                height: 32,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                color: T.txt,
              }}
            >
              <X size={20} />
            </button>

            {/* Logo */}
            <div style={{
              padding: "12px 16px",
              marginBottom: 20,
            }}>
              <div style={{
                fontSize: 24,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${T.pri}, ${T.dark})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                WorqPost
              </div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>ወorqPost</div>
            </div>

            {/* Menu Items */}
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", paddingRight: 4 }}>
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
                      gap: 12,
                      padding: "12px 14px",
                      border: "none",
                      background: isActive ? T.bg : "transparent",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      textAlign: "left",
                    }}
                  >
                    <Icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2}
                      color={isActive ? T.pri : T.txt}
                    />
                    <span style={{
                      fontSize: 16,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? T.txt : T.txt,
                    }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* User Section */}
            {user && (
              <div style={{
                padding: "10px 14px",
                borderTop: `1px solid ${T.border}`,
                marginTop: "auto",
                flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {user.profile_photo ? (
                    <img
                      src={user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`}
                      alt="Profile"
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
                      fontSize: 20,
                    }}>
                      👤
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: 12, color: T.sub }}>
                      @{user.username}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: `1px solid ${T.border}`,
                    background: "transparent",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.txt,
                    transition: "all 0.2s",
                  }}
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 65,
        background: T.cardBg,
        borderTop: `1px solid ${T.border}`,
        display: "none",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 10px",
        zIndex: 100,
      }}
      className="mobile-nav"
      >
        {[menuItems[0], menuItems[1], menuItems[6], menuItems[4], menuItems[7]].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 6,
                flex: 1,
              }}
            >
              <Icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? T.pri : T.txt}
              />
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? T.pri : T.txt,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          width: 44,
          height: 44,
          border: "none",
          background: T.cardBg,
          borderRadius: 12,
          cursor: "pointer",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        className="mobile-menu-toggle"
      >
        <Menu size={20} color={T.txt} />
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
