import { useState, useEffect } from "react";
import { Trophy, Clock, Users, Gift, Star, Calendar, Tag, TrendingUp, Award, Coins, Crown } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function CampaignsPage({ theme, onCampaignClick }) {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(null);
  const [coinPackages, setCoinPackages] = useState([]);

  useEffect(() => {
    fetchCampaigns();
    fetchUserCoins();
    fetchCoinPackages();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns/');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCoins = async () => {
    try {
      const response = await api.get('/coins/balance/');
      setUserCoins(response.data);
    } catch (error) {
      console.error('Failed to fetch user coins:', error);
    }
  };

  const fetchCoinPackages = async () => {
    try {
      const response = await api.get('/coins/packages/');
      setCoinPackages(response.data);
    } catch (error) {
      console.error('Failed to fetch coin packages:', error);
    }
  };

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'daily': return <Clock size={20} />;
      case 'weekly': return <Calendar size={20} />;
      case 'monthly': return <Trophy size={20} />;
      case 'grand_finale': return <Crown size={20} />;
      case 'flash': return <TrendingUp size={20} />;
      default: return <Gift size={20} />;
    }
  };

  const getCampaignTypeColor = (type) => {
    switch (type) {
      case 'daily': return '#10B981';
      case 'weekly': return '#3B82F6';
      case 'monthly': return '#8B5CF6';
      case 'grand_finale': return '#00D4E0';
      case 'flash': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(budget);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: T.bg }}>
        <div style={{ textAlign: 'center' }}>
          <Trophy size={48} color={T.pri} style={{ marginBottom: 16 }} />
          <div style={{ color: T.sub, fontWeight: 600 }}>Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '16px 24px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>
            <Trophy size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: T.txt, fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Campaigns</h1>
            <p style={{ color: T.sub, fontSize: 13, margin: 0 }}>Win amazing rewards!</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 20px', maxWidth: 900, margin: '0 auto' }}>

      {/* User Coins Balance */}
      {userCoins && (
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 8px 24px rgba(124,58,237,0.3)',
        }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4, fontWeight: 500 }}>Your Balance</div>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.02em' }}>
              <Coins size={22} />{userCoins.balance.toLocaleString()} Coins
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
              {userCoins.subscription_type.toUpperCase()} Plan
            </div>
          </div>
          <button
            style={{
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10, padding: '10px 18px', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
            onClick={() => window.location.href = '#/coins'}
          >Get More Coins</button>
        </div>
      )}

      {/* Campaigns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 20,
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
            onClick={() => onCampaignClick && onCampaignClick(campaign.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(124,58,237,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
            }}
          >
            {/* Campaign Image */}
            {campaign.image && (
              <div style={{ height: 200, overflow: 'hidden' }}>
                <img
                  src={campaign.image}
                  alt={campaign.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Campaign Content */}
            <div style={{ padding: 20 }}>
              {/* Type Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  background: `${getCampaignTypeColor(campaign.campaign_type)}20`,
                  border: `1px solid ${getCampaignTypeColor(campaign.campaign_type)}`,
                  borderRadius: 20,
                  color: getCampaignTypeColor(campaign.campaign_type),
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {getCampaignTypeIcon(campaign.campaign_type)}
                  {campaign.campaign_type.replace('_', ' ').toUpperCase()}
                </div>
                {campaign.is_active_status && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    background: '#10B98120',
                    border: '1px solid #10B981',
                    borderRadius: 12,
                    color: '#10B981',
                    fontSize: 10,
                    fontWeight: 600,
                  }}>
                    <div style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%' }} />
                    ACTIVE
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 style={{ color: '#111827', fontSize: 17, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                {campaign.title}
              </h3>

              {/* Description */}
              <p style={{ color: '#6B7280', fontSize: 13, margin: '0 0 16px 0', lineHeight: 1.55 }}>
                {campaign.description}
              </p>

              {/* Campaign Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.sub, fontSize: 13 }}>
                  <Gift size={16} />
                  <span>{campaign.prize_title || 'Amazing Rewards'}</span>
                  {campaign.prize_value && (
                    <span style={{ color: T.pri, fontWeight: 600 }}>
                      ({formatBudget(campaign.prize_value)})
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.sub, fontSize: 13 }}>
                  <Award size={16} />
                  <span>{campaign.max_winners} Winners</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.sub, fontSize: 13 }}>
                  <Users size={16} />
                  <span>{campaign.entries_count} Entries</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.sub, fontSize: 13 }}>
                  <Clock size={16} />
                  <span>Ends: {formatDate(campaign.end_date)}</span>
                </div>
                {campaign.official_hashtag && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.sub, fontSize: 13 }}>
                    <Tag size={16} />
                    <span>{campaign.official_hashtag}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                style={{
                  width: '100%', padding: '12px',
                  background: campaign.is_active_status
                    ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                    : 'rgba(0,0,0,0.06)',
                  border: 'none', borderRadius: 12,
                  color: campaign.is_active_status ? '#fff' : '#9CA3AF',
                  fontSize: 14, fontWeight: 700,
                  cursor: campaign.is_active_status ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: campaign.is_active_status ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
                disabled={!campaign.is_active_status}
                onClick={(e) => {
                  e.stopPropagation();
                  if (campaign.is_active_status) {
                    window.location.href = `#/campaign/${campaign.id}`;
                  }
                }}
              >
                {campaign.is_active_status ? (
                  <>
                    <Trophy size={16} />
                    Enter Campaign
                  </>
                ) : (
                  campaign.status === 'completed' ? 'Campaign Ended' : 'Coming Soon'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Trophy size={56} color="#D1D5DB" style={{ marginBottom: 16 }} />
          <h3 style={{ color: '#111827', fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>No Active Campaigns</h3>
          <p style={{ color: '#6B7280', fontSize: 15 }}>Check back soon for exciting campaigns!</p>
        </div>
      )}
      </div>
    </div>
  );
}
