import { useState, useEffect } from 'react';
import { Trophy, Calendar, Award, Users, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../api';

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
`;
if (!document.head.querySelector('style[data-campaigns]')) {
  style.setAttribute('data-campaigns', 'true');
  document.head.appendChild(style);
}

export function CampaignsPage({ theme, onCampaignClick, onBack }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.request(`/campaigns/?status=${filter}`);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.green;
      case 'voting': return theme.blue;
      case 'upcoming': return theme.orange;
      case 'completed': return theme.sub;
      default: return theme.sub;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.pri}08 100%)`,
      padding: isMobile ? '16px' : '20px',
      boxSizing: 'border-box',
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '16px 0',
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              color: theme.txt,
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: 20, 
            fontWeight: 800, 
            color: theme.txt,
            background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Campaigns
          </h1>
          <div style={{ width: 40 }} />
        </div>
      )}

      {/* Hero Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? 24 : 32,
        padding: isMobile ? '24px 16px' : '32px 20px',
        background: `linear-gradient(135deg, ${theme.pri}15, ${theme.orange}15)`,
        borderRadius: isMobile ? 12 : 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
          margin: '0 auto 16px',
          background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
          borderRadius: '50%',
          boxShadow: `0 8px 32px ${theme.pri}40`,
          animation: 'float 3s ease-in-out infinite',
        }}>
          <Trophy size={isMobile ? 24 : 32} color="#fff" strokeWidth={2.5} />
        </div>
        
        <h1 style={{ 
          margin: 0, 
          fontSize: isMobile ? 28 : 36, 
          fontWeight: 900, 
          background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 16,
        }}>
          Campaign Hub
        </h1>
        
        <p style={{
          margin: 0,
          fontSize: isMobile ? 16 : 18,
          color: theme.sub,
          maxWidth: isMobile ? '300px' : '500px',
          lineHeight: 1.6,
        }}>
          Participate in exciting competitions and win amazing prizes!
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 24 : 32,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        padding: isMobile ? '0 8px' : '0',
      }}>
        {[
          { id: 'active', label: 'Active Now', icon: Trophy, color: theme.green },
          { id: 'voting', label: 'Voting Open', icon: Award, color: theme.blue },
          { id: 'upcoming', label: 'Coming Soon', icon: Clock, color: theme.orange },
          { id: 'completed', label: 'Completed', icon: Calendar, color: theme.sub },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                background: isActive ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)` : theme.card,
                border: `2px solid ${isActive ? tab.color : theme.border}`,
                borderRadius: isMobile ? 12 : 16,
                color: isActive ? '#fff' : theme.txt,
                fontSize: isMobile ? 13 : 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 8 : 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? `0 8px 20px ${tab.color}40` : '0 2px 8px rgba(0,0,0,0.05)',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                }
              }}
            >
              <Icon size={isMobile ? 18 : 20} strokeWidth={2.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          maxWidth: '1200px',
          margin: '0 auto',
          marginTop: '32px',
        }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                background: '#fff',
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{
                width: '100%',
                height: 160,
                background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite',
              }} />
              <div style={{ padding: 16 }}>
                <div style={{
                  height: 16,
                  background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                  backgroundSize: '1000px 100%',
                  animation: 'shimmer 2s infinite',
                  borderRadius: 8,
                  marginBottom: 8,
                }} />
                <div style={{
                  height: 24,
                  background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                  backgroundSize: '1000px 100%',
                  animation: 'shimmer 2s infinite',
                  borderRadius: 8,
                  marginBottom: 12,
                }} />
                <div style={{
                  height: 40,
                  background: `linear-gradient(90deg, ${theme.bg} 0%, ${theme.border} 50%, ${theme.bg} 100%)`,
                  backgroundSize: '1000px 100%',
                  animation: 'shimmer 2s infinite',
                  borderRadius: 12,
                }} />
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{
          background: theme.card,
          borderRadius: 16,
          padding: isMobile ? 24 : 40,
          textAlign: 'center',
          border: `1px solid ${theme.border}`,
          marginTop: '32px',
        }}>
          <Trophy size={isMobile ? 40 : 48} color={theme.sub} style={{ marginBottom: 16 }} />
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: theme.txt,
            marginBottom: 8,
          }}>
            No {filter} campaigns
          </h3>
          <p style={{
            margin: 0,
            fontSize: isMobile ? 13 : 14,
            color: theme.sub,
          }}>
            Check back later for new opportunities!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          maxWidth: '1200px',
          margin: '0 auto',
          marginTop: '32px',
        }}>
          {campaigns.map(campaign => {
            const statusColor = getStatusColor(campaign.status);
            
            return (
              <div
                key={campaign.id}
                style={{
                  background: '#fff',
                  borderRadius: isMobile ? 12 : 16,
                  overflow: 'hidden',
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
                onClick={() => onCampaignClick?.(campaign)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                }}
              >
                {/* Campaign Image */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: isMobile ? 140 : 160,
                  background: `linear-gradient(135deg, ${theme.pri}10, ${theme.orange}10)`,
                  overflow: 'hidden',
                }}>
                  {campaign.image && (
                    <img
                      src={campaign.image}
                      alt={campaign.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  
                  {/* Status Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: statusColor,
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: `0 2px 8px ${statusColor}40`,
                  }}>
                    {campaign.status}
                  </div>
                </div>

                {/* Campaign Content */}
                <div style={{ padding: isMobile ? 16 : 20 }}>
                  {/* Title */}
                  <h3 style={{
                    margin: 0,
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 800,
                    color: theme.txt,
                    marginBottom: 8,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {campaign.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    margin: 0,
                    fontSize: isMobile ? 12 : 13,
                    color: theme.sub,
                    marginBottom: 12,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {campaign.description}
                  </p>

                  {/* Prize */}
                  <div style={{
                    padding: 10,
                    background: `linear-gradient(135deg, ${theme.pri}12, ${theme.orange}12)`,
                    borderRadius: 8,
                    marginBottom: 12,
                    border: `1px solid ${theme.pri}25`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      position: 'relative',
                    }}>
                      <div style={{
                        width: isMobile ? 32 : 36,
                        height: isMobile ? 32 : 36,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 2px 8px ${theme.pri}40`,
                      }}>
                        <Award size={isMobile ? 16 : 18} color="#fff" strokeWidth={2.5} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: isMobile ? 9 : 10,
                          color: theme.sub,
                          marginBottom: 2,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Grand Prize
                        </div>
                        <div style={{
                          fontSize: isMobile ? 16 : 18,
                          fontWeight: 900,
                          background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          lineHeight: 1,
                          marginBottom: 4,
                        }}>
                          ${campaign.prize_value}
                        </div>
                        <div style={{
                          fontSize: isMobile ? 12 : 13,
                          color: theme.txt,
                          fontWeight: 600,
                        }}>
                          {campaign.prize_title}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginBottom: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${theme.border}`,
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '8px 4px',
                      background: theme.bg,
                      borderRadius: 6,
                    }}>
                      <div style={{
                        fontSize: isMobile ? 8 : 9,
                        color: theme.sub,
                        marginBottom: 4,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Entries
                      </div>
                      <div style={{
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 800,
                        color: theme.txt,
                      }}>
                        {campaign.entries_count || 0}
                      </div>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '8px 4px',
                      background: theme.bg,
                      borderRadius: 6,
                    }}>
                      <div style={{
                        fontSize: isMobile ? 8 : 9,
                        color: theme.sub,
                        marginBottom: 4,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Days Left
                      </div>
                      <div style={{
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 800,
                        color: statusColor,
                      }}>
                        {getTimeRemaining(campaign.voting_end || campaign.entry_deadline).split(' ')[0]}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      padding: '8px 4px',
                      background: theme.bg,
                      borderRadius: 6,
                    }}>
                      <div style={{
                        fontSize: isMobile ? 8 : 9,
                        color: theme.sub,
                        marginBottom: 4,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Prize
                      </div>
                      <div style={{
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 800,
                        color: theme.pri,
                      }}>
                        ${campaign.prize_value}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    style={{
                      width: '100%',
                      padding: isMobile ? '12px' : '14px',
                      background: `linear-gradient(135deg, ${theme.pri}, ${theme.orange})`,
                      border: 'none',
                      borderRadius: isMobile ? 10 : 12,
                      color: '#fff',
                      fontSize: isMobile ? 14 : 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: `0 4px 16px ${theme.pri}40`,
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${theme.pri}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 4px 16px ${theme.pri}40`;
                    }}
                  >
                    View Campaign
                    <ChevronRight size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
