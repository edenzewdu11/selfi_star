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
      case 'grand_finale': return '#F59E0B';
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <div style={{ color: T.sub }}>Loading campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Trophy size={32} style={{ color: T.pri }} />
          <h1 style={{ color: T.txt, fontSize: 28, fontWeight: 800, margin: 0 }}>
            Campaigns & Contests
          </h1>
        </div>
        <p style={{ color: T.sub, fontSize: 16, margin: 0 }}>
          Participate in exciting campaigns and win amazing rewards!
        </p>
      </div>

      {/* User Coins Balance */}
      {userCoins && (
        <div style={{
          background: `linear-gradient(135deg, ${T.pri}, ${T.dark})`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ color: '#fff', fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Your Balance</div>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={24} />
              {userCoins.balance.toLocaleString()} Coins
            </div>
            <div style={{ color: '#fff', fontSize: 12, opacity: 0.8, marginTop: 4 }}>
              {userCoins.subscription_type.toUpperCase()} Plan
            </div>
          </div>
          <button
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 8,
              padding: '8px 16px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => window.location.href = '#/coins'}
          >
            Get More Coins
          </button>
        </div>
      )}

      {/* Campaigns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onClick={() => onCampaignClick && onCampaignClick(campaign.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
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
              <h3 style={{ color: T.txt, fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                {campaign.title}
              </h3>

              {/* Description */}
              <p style={{ color: T.sub, fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.5 }}>
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
                  width: '100%',
                  padding: '12px',
                  background: campaign.is_active_status ? T.pri : T.sub,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: campaign.is_active_status ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
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
          <Trophy size={64} style={{ color: T.sub, marginBottom: 16 }} />
          <h3 style={{ color: T.txt, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            No Active Campaigns
          </h3>
          <p style={{ color: T.sub, fontSize: 16 }}>
            Check back soon for new exciting campaigns and contests!
          </p>
        </div>
      )}
    </div>
  );
}
