import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function ModernRegisterScreen({ onSuccess, onLogin, onBack }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const res = await api.register(
        formData.username,
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      
      api.setAuthToken(res.token);
      
      onSuccess({
        id: res.user.id,
        username: res.user.username,
        email: res.user.email,
        first_name: res.user.first_name || "",
        last_name: res.user.last_name || "",
        name: res.user.first_name || res.user.username,
      });
    } catch (e) {
      console.error('Registration error:', e);
      setError("Registration failed. Username or email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px 12px 42px",
    background: "rgba(0,20,50,0.6)",
    border: "1px solid rgba(0,212,224,0.2)",
    borderRadius: 12,
    fontSize: 14,
    color: "#FFFFFF",
    outline: "none",
    transition: "all 0.2s",
  };
  const labelStyle = { display:"block", fontSize:11, fontWeight:700, color:"#7ABFCC", marginBottom:6, letterSpacing:"0.5px", textTransform:"uppercase" };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #060D1F 0%, #0A1628 60%, #0D1E3A 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{ position:"absolute", top:"-5%", right:"-5%", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,212,224,0.1) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"0%", left:"-5%", width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:460, position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:28, fontWeight:900, letterSpacing:"2px", background:"linear-gradient(135deg, #00D4E0, #ffffff 50%, #FFD700)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", marginBottom:4 }}>
            WorqPost
          </div>
          <div style={{ fontSize:13, color:"#7ABFCC" }}>Create your account and join the sky</div>
        </div>

        {/* Glass Card */}
        <div style={{ background:"rgba(10,22,40,0.8)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(0,212,224,0.2)", borderRadius:24, padding:"32px", boxShadow:"0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        <form onSubmit={handleRegister}>
          {error && (
            <div style={{ padding:"12px 16px", background:"rgba(255,75,110,0.15)", border:"1px solid rgba(255,75,110,0.4)", borderRadius:10, color:"#FF4B6E", fontSize:13, fontWeight:600, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Username *</label>
            <div style={{ position:"relative" }}>
              <User size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#7ABFCC" }} />
              <input type="text" value={formData.username} onChange={(e) => handleChange("username", e.target.value)} placeholder="Choose a username" style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor="rgba(0,212,224,0.6)"; e.target.style.boxShadow="0 0 0 3px rgba(0,212,224,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor="rgba(0,212,224,0.2)"; e.target.style.boxShadow="none"; }} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email *</label>
            <div style={{ position:"relative" }}>
              <Mail size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#7ABFCC" }} />
              <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="your@email.com" style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor="rgba(0,212,224,0.6)"; e.target.style.boxShadow="0 0 0 3px rgba(0,212,224,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor="rgba(0,212,224,0.2)"; e.target.style.boxShadow="none"; }} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input type="text" value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} placeholder="First" style={{ ...inputStyle, padding:"12px 16px" }}
                onFocus={(e) => { e.target.style.borderColor="rgba(0,212,224,0.6)"; }} onBlur={(e) => { e.target.style.borderColor="rgba(0,212,224,0.2)"; }} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input type="text" value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} placeholder="Last" style={{ ...inputStyle, padding:"12px 16px" }}
                onFocus={(e) => { e.target.style.borderColor="rgba(0,212,224,0.6)"; }} onBlur={(e) => { e.target.style.borderColor="rgba(0,212,224,0.2)"; }} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Password *</label>
            <div style={{ position:"relative" }}>
              <Lock size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#7ABFCC" }} />
              <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Create a password (min 6 chars)" style={{ ...inputStyle, paddingRight:44 }}
                onFocus={(e) => { e.target.style.borderColor="rgba(0,212,224,0.6)"; e.target.style.boxShadow="0 0 0 3px rgba(0,212,224,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor="rgba(0,212,224,0.2)"; e.target.style.boxShadow="none"; }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#7ABFCC", display:"flex" }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"15px",
            background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)",
            boxShadow: loading ? "none" : "0 6px 24px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            border:"none", borderRadius:14, color:"#0A1628", fontSize:15, fontWeight:900, cursor: loading ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8, letterSpacing:"1px", marginBottom:18, textTransform:"uppercase",
          }}>
            {loading ? (<><Loader size={18} style={{ animation:"spin 1s linear infinite" }} />Creating Account...</>) : "Join the Sky"}
          </button>

          <div style={{ textAlign:"center", fontSize:13, color:"#7ABFCC" }}>
            Already have an account?{" "}
            <button type="button" onClick={onLogin} style={{ background:"none", border:"none", color:"#00D4E0", fontWeight:700, cursor:"pointer", fontSize:13 }}>
              Sign In
            </button>
          </div>
        </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(122,191,204,0.5) !important; }
      `}</style>
    </div>
  );
}
