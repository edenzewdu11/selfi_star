import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader, Home, Search, Compass, Film, MessageCircle, Bell, Bookmark, Settings } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernLoginScreen({ onSuccess, onRegister, onBack }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e?.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const username = email.includes("@") ? email.split("@")[0] : email;
      console.log('🔐 Attempting login for username:', username);
      const res = await api.login(username, password);
      
      console.log('✅ Login successful:', {
        userId: res.user.id,
        username: res.user.username,
        token: res.token ? res.token.substring(0, 10) + '...' : 'NONE'
      });
      
      api.setAuthToken(res.token);
      console.log('🔑 Token set via api.setAuthToken');
      
      const userData = {
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        first_name: res.user.first_name || "",
        last_name: res.user.last_name || "",
        name: res.user.first_name || res.user.username,
      };
      
      console.log('👤 Calling onSuccess with user data:', userData);
      onSuccess(userData);
    } catch (e) {
      console.error('❌ Login error:', e);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 4,
  }));

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #060D1F 0%, #0A1628 60%, #0D1E3A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Star particles */}
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute",
          top: `${s.top}%`,
          left: `${s.left}%`,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: "#ffffff",
          opacity: 0.4,
          animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Teal glow orbs */}
      <div style={{ position:"absolute", top:"-10%", right:"-5%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,212,224,0.12) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"5%", left:"-8%", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0,212,224,0.2) 0%, rgba(0,100,130,0.3) 100%)",
            border: "2px solid rgba(0,212,224,0.4)",
            boxShadow: "0 0 30px rgba(0,212,224,0.25)",
            fontSize: 36,
            marginBottom: 16,
            animation: "float 4s ease-in-out infinite",
          }}>⭐</div>
          <div style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: "2px",
            background: "linear-gradient(135deg, #00D4E0, #ffffff 50%, #FFD700)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 6,
          }}>
            WorqPost
          </div>
          <div style={{ fontSize: 13, color: "#7ABFCC", letterSpacing: "0.5px" }}>
            Sign in to your account
          </div>
        </div>

        {/* Glass Card */}
        <div style={{
          background: "rgba(10,22,40,0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0,212,224,0.2)",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{
                padding: "12px 16px",
                background: "rgba(255,75,110,0.15)",
                border: "1px solid rgba(255,75,110,0.4)",
                borderRadius: 10,
                color: "#FF4B6E",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#7ABFCC", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Username or Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#7ABFCC" }} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  style={{
                    width: "100%",
                    padding: "13px 16px 13px 42px",
                    background: "rgba(0,20,50,0.6)",
                    border: "1px solid rgba(0,212,224,0.2)",
                    borderRadius: 12,
                    fontSize: 14,
                    color: "#FFFFFF",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,224,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,212,224,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(0,212,224,0.2)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#7ABFCC", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#7ABFCC" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    padding: "13px 44px 13px 42px",
                    background: "rgba(0,20,50,0.6)",
                    border: "1px solid rgba(0,212,224,0.2)",
                    borderRadius: 12,
                    fontSize: 14,
                    color: "#FFFFFF",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,212,224,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,212,224,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(0,212,224,0.2)"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#7ABFCC", display:"flex" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginBottom: 26 }}>
              <button type="button" style={{ background:"none", border:"none", color:"#00D4E0", fontSize:12, fontWeight:700, cursor:"pointer", letterSpacing:"0.3px" }}>
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)",
                boxShadow: loading ? "none" : "0 6px 24px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: 14,
                color: "#0A1628",
                fontSize: 15,
                fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                letterSpacing: "1px",
                marginBottom: 20,
                textTransform: "uppercase",
              }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Signing In...
                </>
              ) : "Sign In"}
            </button>

            <div style={{ textAlign: "center", fontSize: 13, color: "#7ABFCC" }}>
              Need an account?{" "}
              <button type="button" onClick={onRegister} style={{ background:"none", border:"none", color:"#00D4E0", fontWeight:700, cursor:"pointer", fontSize:13 }}>
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes twinkle { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        input::placeholder { color: rgba(122,191,204,0.5) !important; }
      `}</style>
    </div>
  );
}
