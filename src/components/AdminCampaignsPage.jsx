import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Trophy, Clock, Users, Gift, Star, Calendar, Tag, TrendingUp, Award, Settings, BarChart3, Coins, Crown, Eye } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function AdminCampaignsPage() {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaign_type: 'daily',
    status: 'draft',
    start_date: '',
    end_date: '',
    total_budget: '',
    max_winners: 1,
    official_hashtag: '',
    min_age: 18,
    original_content_required: true,
    max_entries_per_user: 1,
    prize_title: '',
    prize_value: '',
    creativity_weight: 30,
    engagement_weight: 25,
    consistency_weight: 20,
    quality_weight: 15,
    theme_weight: 10,
    judge_weight: 70,
    public_vote_weight: 30,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/admin/campaigns/');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/campaigns/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getCampaignTypeIcon = (type) => {
    switch (type) {
      case 'daily': return <Clock size={16} />;
      case 'weekly': return <Calendar size={16} />;
      case 'monthly': return <Trophy size={16} />;
      case 'grand_finale': return <Crown size={16} />;
      case 'flash': return <TrendingUp size={16} />;
      default: return <Gift size={16} />;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#6B7280';
      case 'paused': return '#F59E0B';
      case 'completed': return '#3B82F6';
      case 'cancelled': return '#EF4444';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCampaign) {
        await api.put(`/admin/campaigns/${editingCampaign.id}/`, formData);
      } else {
        await api.post('/admin/campaigns/', formData);
      }
      setShowCreateModal(false);
      setEditingCampaign(null);
      setFormData({
        title: '',
        description: '',
        campaign_type: 'daily',
        status: 'draft',
        start_date: '',
        end_date: '',
        total_budget: '',
        max_winners: 1,
        official_hashtag: '',
        min_age: 18,
        original_content_required: true,
        max_entries_per_user: 1,
        prize_title: '',
        prize_value: '',
        creativity_weight: 30,
        engagement_weight: 25,
        consistency_weight: 20,
        quality_weight: 15,
        theme_weight: 10,
        judge_weight: 70,
        public_vote_weight: 30,
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      campaign_type: campaign.campaign_type,
      status: campaign.status,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      total_budget: campaign.total_budget,
      max_winners: campaign.max_winners,
      official_hashtag: campaign.official_hashtag,
      min_age: campaign.min_age,
      original_content_required: campaign.original_content_required,
      max_entries_per_user: campaign.max_entries_per_user,
      prize_title: campaign.prize_title,
      prize_value: campaign.prize_value,
      creativity_weight: campaign.creativity_weight,
      engagement_weight: campaign.engagement_weight,
      consistency_weight: campaign.consistency_weight,
      quality_weight: campaign.quality_weight,
      theme_weight: campaign.theme_weight,
      judge_weight: campaign.judge_weight,
      public_vote_weight: campaign.public_vote_weight,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await api.delete(`/admin/campaigns/${campaignId}/`);
        fetchCampaigns();
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Trophy size={32} style={{ color: T.pri }} />
            <h1 style={{ color: T.txt, fontSize: 28, fontWeight: 800, margin: 0 }}>
              Campaign Management
            </h1>
          </div>
          <p style={{ color: T.sub, fontSize: 16, margin: 0 }}>
            Create and manage campaigns and contests
          </p>
        </div>
        <button
          style={{
            background: T.pri,
            border: 'none',
            borderRadius: 8,
            padding: '12px 20px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create Campaign
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: `${T.pri}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={20} style={{ color: T.pri }} />
              </div>
              <div>
                <div style={{ color: T.txt, fontSize: 24, fontWeight: 700 }}>{stats.total_campaigns}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>Total Campaigns</div>
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: '#10B98120', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} style={{ color: '#10B981' }} />
              </div>
              <div>
                <div style={{ color: T.txt, fontSize: 24, fontWeight: 700 }}>{stats.active_campaigns}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>Active Campaigns</div>
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: '#3B82F620', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <div style={{ color: T.txt, fontSize: 24, fontWeight: 700 }}>{stats.total_entries}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>Total Entries</div>
              </div>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: '#F59E0B20', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={20} style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <div style={{ color: T.txt, fontSize: 24, fontWeight: 700 }}>{stats.total_votes}</div>
                <div style={{ color: T.sub, fontSize: 12 }}>Total Votes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.txt, fontSize: 18, fontWeight: 600, margin: 0 }}>All Campaigns</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: `${T.bg}50` }}>
                <th style={{ padding: 12, textAlign: 'left', color: T.txt, fontSize: 12, fontWeight: 600 }}>Campaign</th>
                <th style={{ padding: 12, textAlign: 'left', color: T.txt, fontSize: 12, fontWeight: 600 }}>Type</th>
                <th style={{ padding: 12, textAlign: 'left', color: T.txt, fontSize: 12, fontWeight: 600 }}>Status</th>
                <th style={{ padding: 12, textAlign: 'left', color: T.txt, fontSize: 12, fontWeight: 600 }}>Budget</th>
                <th style={{ padding: 12, textAlign: 'left', color: T.txt, fontSize: 12, fontWeight: 600 }}>Entries</th>
                <th style={{ padding: 12, textAlign: 'left', color: T.txt, fontSize: 12, fontWeight: 600 }}>End Date</th>
                <th style={{ padding: 12, textAlign: 'center', color: T.txt, fontSize: 12, fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: 12 }}>
                    <div>
                      <div style={{ color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        {campaign.title}
                      </div>
                      <div style={{ color: T.sub, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {campaign.description}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getCampaignTypeIcon(campaign.campaign_type)}
                      <span style={{ color: getCampaignTypeColor(campaign.campaign_type), fontSize: 12, fontWeight: 600 }}>
                        {campaign.campaign_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      background: `${getStatusColor(campaign.status)}20`,
                      border: `1px solid ${getStatusColor(campaign.status)}`,
                      borderRadius: 12,
                      color: getStatusColor(campaign.status),
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {campaign.status.toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: 12, color: T.txt, fontSize: 14 }}>
                    {formatBudget(campaign.total_budget)}
                  </td>
                  <td style={{ padding: 12, color: T.txt, fontSize: 14 }}>
                    {campaign.entries_count}
                  </td>
                  <td style={{ padding: 12, color: T.txt, fontSize: 14 }}>
                    {formatDate(campaign.end_date)}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: T.pri,
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        onClick={() => window.location.href = `#/admin/campaigns/${campaign.id}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: T.pri,
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        onClick={() => handleEdit(campaign)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                        onClick={() => handleDelete(campaign.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ padding: 24, borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ color: T.txt, fontSize: 20, fontWeight: 700, margin: 0 }}>
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Campaign Type *
                  </label>
                  <select
                    value={formData.campaign_type}
                    onChange={(e) => setFormData({...formData, campaign_type: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  >
                    <option value="daily">Daily Reward</option>
                    <option value="weekly">Weekly Reward</option>
                    <option value="monthly">Monthly Reward</option>
                    <option value="grand_finale">Grand Finale</option>
                    <option value="flash">Flash Challenge</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    background: T.bg,
                    color: T.txt,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Official Hashtag
                  </label>
                  <input
                    type="text"
                    value={formData.official_hashtag}
                    onChange={(e) => setFormData({...formData, official_hashtag: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Total Budget (ETB) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.total_budget}
                    onChange={(e) => setFormData({...formData, total_budget: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    Max Winners *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_winners}
                    onChange={(e) => setFormData({...formData, max_winners: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      fontSize: 14,
                      background: T.bg,
                      color: T.txt,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCampaign(null);
                    setFormData({
                      title: '',
                      description: '',
                      campaign_type: 'daily',
                      status: 'draft',
                      start_date: '',
                      end_date: '',
                      total_budget: '',
                      max_winners: 1,
                      official_hashtag: '',
                      min_age: 18,
                      original_content_required: true,
                      max_entries_per_user: 1,
                      prize_title: '',
                      prize_value: '',
                      creativity_weight: 30,
                      engagement_weight: 25,
                      consistency_weight: 20,
                      quality_weight: 15,
                      theme_weight: 10,
                      judge_weight: 70,
                      public_vote_weight: 30,
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: `1px solid ${T.border}`,
                    borderRadius: 6,
                    color: T.txt,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: T.pri,
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
