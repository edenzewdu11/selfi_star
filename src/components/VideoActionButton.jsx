import { useState } from 'react';

export function VideoActionButton({ 
  icon: Icon, 
  count, 
  onClick, 
  isActive = false, 
  activeColor = "#FF0050",
  size = 28,
  label,
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onClick?.();
    setTimeout(() => setIsPressed(false), 150);
  };

  return (
    <div style={{ 
      position: 'relative', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 6 
    }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: isActive 
            ? activeColor 
            : 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          border: isActive 
            ? `2px solid ${activeColor}` 
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
              : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isActive
            ? `0 4px 12px ${activeColor}40`
            : isHovered
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 2px 8px rgba(0, 0, 0, 0.2)',
          ...props.style
        }}
        {...props}
      >
        <Icon
          size={size}
          color="#fff"
          fill={isActive ? "#fff" : "none"}
          strokeWidth={2}
          style={{
            transition: 'all 0.2s ease',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
          }}
        />
      </button>
      
      <div style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        color: '#fff', 
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        lineHeight: 1.2
      }}>
        {count || label}
      </div>
    </div>
  );
}

export function VideoLikeButton({ liked, count, onLike, size = 24 }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    if (!liked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
    onLike?.();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <VideoActionButton
        icon={() => (
          <div style={{
            transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}>
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={liked ? "#FF0050" : "none"}
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))'
              }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        )}
        onClick={handleClick}
        isActive={liked}
        activeColor="#FF0050"
        size={size}
      />
      
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
          <svg
            width={size * 2}
            height={size * 2}
            viewBox="0 0 24 24"
            fill="#FF0050"
            stroke="#FF0050"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
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
