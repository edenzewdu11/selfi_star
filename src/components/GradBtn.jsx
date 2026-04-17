export function GradBtn({ children, onClick, disabled, style={}, small, gold }) {
  const grad = gold
    ? `linear-gradient(135deg, #FFD700 0%, #F5A623 60%, #E08B00 100%)`
    : `linear-gradient(135deg, #00D4E0 0%, #0891B2 60%, #065F7A 100%)`;
  const shadow = gold
    ? '0 4px 20px rgba(255,215,0,0.45), 0 1px 0 rgba(255,255,255,0.15) inset'
    : '0 4px 20px rgba(0,212,224,0.4), 0 1px 0 rgba(255,255,255,0.15) inset';

  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%",
      padding: small ? "10px 16px" : "14px 20px",
      background: disabled ? 'rgba(255,255,255,0.1)' : grad,
      boxShadow: disabled ? 'none' : shadow,
      textShadow: '0 1px 4px rgba(0,0,0,0.4)',
      border:"none",
      borderRadius:14,
      color: gold ? "#0A1628" : "#fff",
      fontSize: small ? 13 : 15,
      fontWeight:800,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      letterSpacing: "0.5px",
      transition:"all .2s",
      ...style
    }}>
      {children}
    </button>
  );
}
