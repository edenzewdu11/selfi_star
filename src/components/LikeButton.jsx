import { useState } from "react";
import { Heart } from "lucide-react";

export function LikeButton({ liked, count, onLike, size = 24 }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setIsPressed(true);
    if (!liked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    onLike();
    setTimeout(() => setIsAnimating(false), 300);
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: liked 
            ? '#FF0050' 
            : 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          border: liked 
            ? '2px solid #FF0050' 
            : '2px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isPressed 
            ? 'scale(0.95)' 
            : isHovered 
              ? 'scale(1.05)' 
              : isAnimating
                ? 'scale(1.2)'
                : 'scale(1)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: liked
            ? '0 4px 12px rgba(255, 0, 80, 0.4)'
            : isHovered
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Heart
          size={size}
          fill={liked ? "#fff" : "none"}
          stroke="#fff"
          strokeWidth={2}
          style={{
            transition: "all 0.2s ease",
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'
          }}
        />
      </button>
      
      {showHeart && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'heartBurst 1s ease-out forwards',
            pointerEvents: 'none',
          }}
        >
          <Heart
            size={size * 2}
            fill="#FF0050"
            stroke="#FF0050"
            strokeWidth={2}
          />
        </div>
      )}
      
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: '#fff', 
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        lineHeight: 1.2
      }}>
        {count}
      </div>
      
      <style>{`
        @keyframes heartBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.5);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2);
          }
        }
      `}</style>
    </div>
  );
}
