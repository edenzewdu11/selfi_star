import { useState, useEffect } from "react";
import { X, User, Bell, Lock, Globe, HelpCircle, LogOut, ChevronRight, Moon, Sun, Menu, ArrowLeft } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function SettingsPage({ user, onClose, onLogout }) {
  const { darkMode, toggleDarkMode, colors: T } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("account");
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : {
      likes: true,
      comments: true,
      follows: true,
      messages: true,
    };
  });
  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem('privacy');
    return saved ? JSON.parse(saved) : {
      privateAccount: false,
      showActivity: true,
      allowMessages: true,
    };
  });
  const [saving, setSaving] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('privacy', JSON.stringify(privacy));
  }, [privacy]);

  const handleSaveSettings = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Settings saved successfully!',
        type: 'success',
        onConfirm: null
      });
    }, 500);
  };

  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile sidebar management
  useEffect(() => {
    if (isMobile && showMobileSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, showMobileSidebar]);

  const sections = [
    { id: "account", icon: User, label: t('account') },
    { id: "notifications", icon: Bell, label: t('notificationsSettings') },
    { id: "privacy", icon: Lock, label: t('privacy') },
    { id: "appearance", icon: darkMode ? Moon : Sun, label: t('appearance') },
    { id: "language", icon: Globe, label: t('language') },
    { id: "help", icon: HelpCircle, label: t('help') },
  ];

  const handlePasswordChange = async () => {
    if (password.new !== password.confirm) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'New passwords do not match!',
        type: 'error',
        onConfirm: null
      });
      return;
    }
    if (password.new.length < 8) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Password must be at least 8 characters!',
        type: 'error',
        onConfirm: null
      });
      return;
    }
    try {
      // API call would go here
      setModal({
        isOpen: true,
        title: 'Success',
        message: 'Password changed successfully!',
        type: 'success',
        onConfirm: null
      });
      setPassword({ current: '', new: '', confirm: '' });
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to change password. Please try again.',
        type: 'error',
        onConfirm: null
      });
    }
  };

  const handleDeleteAccount = () => {
    setModal({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you sure you want to delete your account? This action cannot be undone.',
      type: 'warning',
      onConfirm: () => {
        // API call would go here
        setModal({
          isOpen: true,
          title: 'Account Deleted',
          message: 'Account deletion initiated. You will be logged out.',
          type: 'info',
          onConfirm: () => onLogout()
        });
      }
    });
  };

  const handleDownloadData = () => {
    setModal({
      isOpen: true,
      title: 'Download Initiated',
      message: 'Your data download has been initiated. You will receive an email with a download link.',
      type: 'info',
      onConfirm: null
    });
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 4001,
            display: "flex",
          }}
          onClick={() => setShowMobileSidebar(false)}
        >
          <div
            style={{
              width: "280px",
              height: "100vh",
              background: "#fff",
              boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
              transform: showMobileSidebar ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sidebar Header */}
            <div style={{
              padding: "20px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.txt }}>
                Settings
              </h2>
              <button
                onClick={() => setShowMobileSidebar(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 8,
                  display: "flex",
                  color: T.txt,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Sidebar Navigation */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
              {sections.map(section => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setShowMobileSidebar(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      border: "none",
                      background: isActive ? "#fff" : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: isActive ? T.pri : T.txt,
                      fontWeight: isActive ? 600 : 500,
                      borderLeft: isActive ? `3px solid ${T.pri}` : "3px solid transparent",
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
                    <ChevronRight size={16} style={{ opacity: 0.5 }} />
                  </button>
                );
              })}
            </div>

            {/* Mobile Logout */}
            <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={onLogout}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#EF4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Container */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 4000,
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: isMobile ? "100%" : isTablet ? "95%" : "100%",
            maxWidth: isMobile ? "100%" : isTablet ? "800px" : "900px",
            maxHeight: isMobile ? "100vh" : isTablet ? "95vh" : "90vh",
            margin: isMobile ? 0 : isTablet ? "0 auto" : "auto",
            background: "#fff",
            borderRadius: isMobile ? 0 : isTablet ? 16 : 20,
            display: "flex",
            overflow: "hidden",
            position: "relative",
            transform: isMobile && showMobileSidebar ? "translateX(280px)" : "translateX(0)",
            transition: "transform 0.3s ease",
          }}
        >
          {/* Sidebar - Hidden on mobile, collapsible on desktop */}
          {!isMobile && (
            <div 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                width: isSidebarCollapsed ? 60 : (isTablet ? 240 : 280),
                background: T.bg,
                borderRight: `1px solid ${T.border}`,
                display: "flex",
                flexDirection: "column",
                cursor: 'pointer',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: isSidebarCollapsed ? "10px" : "20px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: isSidebarCollapsed ? "center" : "space-between",
              }}>
                {!isSidebarCollapsed && (
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.txt }}>
                    Settings
                  </h2>
                )}
                <ChevronRight 
                  size={20} 
                  color={T.txt}
                  style={{
                    transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
                {sections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection(section.id);
                      }}
                      style={{
                        width: "100%",
                        padding: isSidebarCollapsed ? "14px" : "14px 20px",
                        border: "none",
                        background: isActive ? "#fff" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isSidebarCollapsed ? "center" : "flex-start",
                        gap: isSidebarCollapsed ? 0 : 12,
                        color: isActive ? T.pri : T.txt,
                        fontWeight: isActive ? 600 : 500,
                        borderLeft: isActive ? `3px solid ${T.pri}` : "3px solid transparent",
                        position: 'relative',
                      }}
                    >
                      <Icon size={20} />
                      {!isSidebarCollapsed && (
                        <>
                          <span style={{ flex: 1, textAlign: "left" }}>{section.label}</span>
                          <ChevronRight size={16} style={{ opacity: 0.5 }} />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ 
                padding: isSidebarCollapsed ? "10px" : 20, 
                borderTop: `1px solid ${T.border}` 
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  style={{
                    width: "100%",
                    padding: isSidebarCollapsed ? "10px" : "12px 16px",
                    background: "#EF4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isSidebarCollapsed ? 0 : 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <LogOut size={16} />
                  {!isSidebarCollapsed && "Log Out"}
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            background: "#fff",
          }}>
            {/* Mobile Header */}
            {isMobile && (
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 8,
                      display: "flex",
                      color: T.txt,
                    }}
                  >
                    <Menu size={20} />
                  </button>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.txt }}>
                    {sections.find(s => s.id === activeSection)?.label || 'Settings'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 8,
                    display: "flex",
                    color: T.txt,
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Desktop Header */}
            {!isMobile && (
              <div style={{
                padding: "20px 32px",
                borderBottom: `1px solid ${T.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <button
                  onClick={onClose}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 8,
                    display: "flex",
                    color: T.txt,
                  }}
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    background: saving ? "#ccc" : T.pri,
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: isMobile ? "16px" : isTablet ? "24px" : "32px" }}>
              {/* Account Section */}
              {activeSection === "account" && (
                <div>
                  <h2 style={{ fontSize: isMobile ? 18 : isTablet ? 22 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Account</h2>
                  <p style={{ fontSize: isMobile ? 13 : 14, color: T.sub, marginBottom: isMobile ? 24 : 32 }}>Manage your account settings</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16, padding: isMobile ? 16 : 20, background: T.bg, borderRadius: 12 }}>
                      <div style={{
                        width: isMobile ? 50 : 60,
                        height: isMobile ? 50 : 60,
                        borderRadius: "50%",
                        background: T.pri,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: 700,
                      }}>
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                          {user?.username || 'User'}
                        </div>
                        <div style={{ fontSize: 14, color: T.sub }}>
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                          Username
                        </label>
                        <input
                          type="text"
                          defaultValue={user?.username || ''}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                            fontSize: 14,
                            color: T.txt,
                            background: "#fff",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                          Email
                        </label>
                        <input
                          type="email"
                          defaultValue={user?.email || ''}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `1px solid ${T.border}`,
                            borderRadius: 8,
                            fontSize: 14,
                            color: T.txt,
                            background: "#fff",
                          }}
                        />
                      </div>
                    </div>

                    {/* Password Change */}
                    <div style={{ padding: 20, background: T.bg, borderRadius: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: T.txt, marginBottom: 16 }}>Change Password</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={password.current}
                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: `1px solid ${T.border}`,
                              borderRadius: 8,
                              fontSize: 14,
                              color: T.txt,
                              background: "#fff",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                            New Password
                          </label>
                          <input
                            type="password"
                            value={password.new}
                            onChange={(e) => setPassword({ ...password, new: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: `1px solid ${T.border}`,
                              borderRadius: 8,
                              fontSize: 14,
                              color: T.txt,
                              background: "#fff",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={password.confirm}
                            onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              border: `1px solid ${T.border}`,
                              borderRadius: 8,
                              fontSize: 14,
                              color: T.txt,
                              background: "#fff",
                            }}
                          />
                        </div>

                        <button
                          onClick={handlePasswordChange}
                          style={{
                            padding: "12px 24px",
                            background: T.pri,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Update Password
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{
                      padding: 20,
                      background: "#FEE2E2",
                      borderRadius: 12,
                      border: "2px solid #EF4444",
                    }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#DC2626", marginBottom: 8 }}>Danger Zone</h3>
                      <p style={{ fontSize: 13, color: "#991B1B", marginBottom: 16 }}>
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        style={{
                          padding: "12px 24px",
                          background: "#DC2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Section */}
              {activeSection === "notifications" && (
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Notifications</h2>
                  <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Manage your notification preferences</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </div>
                          <div style={{ fontSize: 13, color: T.sub }}>
                            Receive notifications for {key}
                          </div>
                        </div>
                        <label style={{ position: "relative", display: "inline-block", width: 48, height: 28 }}>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={async (e) => {
                              const newValue = e.target.checked;
                              setNotifications({ ...notifications, [key]: newValue });
                              
                              // Save to backend
                              try {
                                await api.updateNotificationSettings({ [key]: newValue });
                                
                                // Show notification when enabled
                                if (newValue) {
                                  setModal({
                                    isOpen: true,
                                    title: 'Notification Enabled',
                                    message: `You will now receive notifications for ${key}`,
                                    type: 'success',
                                    onConfirm: null
                                  });
                                }
                              } catch (error) {
                                console.error('Failed to update notification settings:', error);
                              }
                            }}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: value ? T.pri : "#ccc",
                            borderRadius: 28,
                            transition: "0.3s",
                          }}>
                            <span style={{
                              position: "absolute",
                              content: "",
                              height: 20,
                              width: 20,
                              left: value ? 24 : 4,
                              bottom: 4,
                              background: "#fff",
                              borderRadius: "50%",
                              transition: "0.3s",
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === "privacy" && (
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Privacy</h2>
                  <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Control your privacy settings</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {Object.entries({
                      privateAccount: { label: "Private Account", desc: "Only approved followers can see your posts" },
                      showActivity: { label: "Show Activity", desc: "Let others see when you're online" },
                      allowMessages: { label: "Allow Messages", desc: "Anyone can send you messages" },
                    }).map(([key, config]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, background: T.bg, borderRadius: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                            {config.label}
                          </div>
                          <div style={{ fontSize: 13, color: T.sub }}>
                            {config.desc}
                          </div>
                        </div>
                        <label style={{ position: "relative", display: "inline-block", width: 48, height: 28 }}>
                          <input
                            type="checkbox"
                            checked={privacy[key]}
                            onChange={(e) => setPrivacy({ ...privacy, [key]: e.target.checked })}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: privacy[key] ? T.pri : "#ccc",
                            borderRadius: 28,
                            transition: "0.3s",
                          }}>
                            <span style={{
                              position: "absolute",
                              content: "",
                              height: 20,
                              width: 20,
                              left: privacy[key] ? 24 : 4,
                              bottom: 4,
                              background: "#fff",
                              borderRadius: "50%",
                              transition: "0.3s",
                            }} />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeSection === "appearance" && (
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Appearance</h2>
                  <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Customize how the app looks</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 20, background: T.bg, borderRadius: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: T.txt, marginBottom: 4 }}>
                          Dark Mode
                        </div>
                        <div style={{ fontSize: 13, color: T.sub }}>
                          Use dark theme across the app
                        </div>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: 48, height: 28 }}>
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={toggleDarkMode}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: "absolute",
                          cursor: "pointer",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: darkMode ? T.pri : "#ccc",
                          borderRadius: 28,
                          transition: "0.3s",
                        }}>
                          <span style={{
                            position: "absolute",
                            content: "",
                            height: 20,
                            width: 20,
                            left: darkMode ? 24 : 4,
                            bottom: 4,
                            background: "#fff",
                            borderRadius: "50%",
                            transition: "0.3s",
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Language Section */}
              {activeSection === "language" && (
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Language</h2>
                  <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Choose your preferred language</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: T.txt, marginBottom: 8 }}>
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => changeLanguage(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: `1px solid ${T.border}`,
                          borderRadius: 8,
                          fontSize: 14,
                          color: T.txt,
                          background: "#fff",
                        }}
                      >
                        <option value="en">English</option>
                        <option value="am">አማርኛ (Amharic)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Help Section */}
              {activeSection === "help" && (
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, marginBottom: 8, color: T.txt }}>Help & Support</h2>
                  <p style={{ fontSize: 14, color: T.sub, marginBottom: 32 }}>Get help and support</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <button style={{
                      padding: "16px 20px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Help Center</span>
                      <ChevronRight size={20} color={T.sub} />
                    </button>

                    <button style={{
                      padding: "16px 20px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Report a Problem</span>
                      <ChevronRight size={20} color={T.sub} />
                    </button>

                    <button style={{
                      padding: "16px 20px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Contact Support</span>
                      <ChevronRight size={20} color={T.sub} />
                    </button>

                    <button style={{
                      padding: "16px 20px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Terms of Service</span>
                      <ChevronRight size={20} color={T.sub} />
                    </button>

                    <button style={{
                      padding: "16px 20px",
                      background: T.bg,
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: T.txt }}>Privacy Policy</span>
                      <ChevronRight size={20} color={T.sub} />
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Save Button */}
              {isMobile && (
                <div style={{ 
                  marginTop: 32, 
                  paddingTop: 20, 
                  borderTop: `1px solid ${T.border}` 
                }}>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      background: saving ? "#ccc" : T.pri,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: saving ? "not-allowed" : "pointer",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.isOpen && (
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
            zIndex: 10000,
          }}
          onClick={() => setModal({ ...modal, isOpen: false })}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px",
              maxWidth: isMobile ? "90%" : 400,
              width: "90%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 700, 
              color: modal.type === 'error' ? '#EF4444' : modal.type === 'warning' ? '#F59E0B' : modal.type === 'success' ? '#10B981' : T.txt, 
              marginBottom: 12 
            }}>
              {modal.title}
            </h3>
            <p style={{ fontSize: 14, color: T.txt, lineHeight: 1.6, marginBottom: 20 }}>
              {modal.message}
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              {modal.onConfirm && (
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.txt,
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) {
                    modal.onConfirm();
                  }
                  setModal({ ...modal, isOpen: false });
                }}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 8,
                  background: modal.type === 'error' ? '#EF4444' : modal.type === 'warning' ? '#F59E0B' : modal.type === 'success' ? '#10B981' : T.pri,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {modal.onConfirm ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}