export function SplashScreen({ onLogin, onRegister }) {
  const T = {
    pri:"#00D4E0", dark:"#020810", txt:"#FFFFFF", sub:"#7ABFCC",
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg, #020810 0%, #060D1F 50%, #0A1628 100%)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:80, marginBottom:20 }}>⭐</div>
        <div style={{ fontSize:42, fontWeight:900, color:"#fff", marginBottom:8 }}>Selfie Star</div>
        <div style={{ fontSize:16, color:"rgba(255,255,255,0.7)", marginBottom:40 }}>Share · Win · Shine</div>
        
        <button onClick={onRegister} style={{ width:"100%", maxWidth:300, padding:"16px", background:`linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)`, boxShadow:"0 6px 24px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)", border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
          Create Account 🚀
        </button>
        
        <button onClick={onLogin} style={{ width:"100%", maxWidth:300, padding:"16px", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Log In
        </button>
      </div>
    </div>
  );
}
