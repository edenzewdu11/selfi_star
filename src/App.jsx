import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { AppShell } from "./components/AppShell";
import { TikTokLayout } from "./components/TikTokLayout";
import { PostPage } from "./components/PostPage";

export default function WerqRoot() {
  const [screen, setScreen] = useState("app");
  const [authUser, setAuthUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showPostPage, setShowPostPage] = useState(false);

  const handleRequireAuth = () => {
    setShowLoginModal(true);
  };

  const handleShowPostPage = () => {
    if (authUser) {
      setShowPostPage(true);
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <div style={{ width: "100%", margin:"0 auto", minHeight:"100vh" }}>
      <style>{`
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes fd{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{from{opacity:0;transform:translateX(-50%) scale(.88)}to{opacity:1;transform:translateX(-50%) scale(1)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes blob{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(20px,-30px) scale(1.05)}66%{transform:translate(-15px,15px) scale(0.97)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        *{box-sizing:border-box} ::-webkit-scrollbar{display:none} button{transition:all .15s} button:active{opacity:.78}
      `}</style>
      
      {/* Main App - Always visible */}
      {authUser ? (
        <AppShell user={authUser} onLogout={()=>{ setAuthUser(null); }} onRequireAuth={handleRequireAuth} onShowPostPage={handleShowPostPage} />
      ) : (
        <TikTokLayout user={null} onLogout={()=>{}} onRequireAuth={handleRequireAuth} onShowPostPage={handleShowPostPage} />
      )}

      {/* Post Page Modal */}
      {showPostPage && authUser && (
        <PostPage 
          user={authUser}
          onBack={() => setShowPostPage(false)}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && !authUser && (
        <div style={{
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
        }}>
          <div style={{ width: "100%", maxWidth: 480, margin: "auto" }}>
            <LoginScreen 
              onSuccess={u=>{ 
                setAuthUser(u); 
                setShowLoginModal(false);
              }} 
              onRegister={()=>{ 
                setShowLoginModal(false);
                setShowRegisterModal(true);
              }} 
              onBack={()=>setShowLoginModal(false)} 
            />
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && !authUser && (
        <div style={{
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
        }}>
          <div style={{ width: "100%", maxWidth: 480, margin: "auto" }}>
            <RegisterScreen 
              onSuccess={u=>{ 
                setAuthUser(u); 
                setShowRegisterModal(false);
              }} 
              onLogin={()=>{ 
                setShowRegisterModal(false);
                setShowLoginModal(true);
              }} 
              onBack={()=>setShowRegisterModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

