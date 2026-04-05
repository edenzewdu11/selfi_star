import { useState, useEffect } from "react";
import { Coins, ShoppingCart, TrendingUp, Gift, Crown, Star, History, CreditCard, Smartphone, Zap } from "lucide-react";
import api from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export function CoinsPage() {
  const { colors: T } = useTheme();
  const { t } = useLanguage();
  const [userCoins, setUserCoins] = useState(null);
  const [coinPackages, setCoinPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchUserCoins();
    fetchCoinPackages();
    fetchTransactions();
  }, []);

  const fetchUserCoins = async () => {
    try {
      const response = await api.get('/coins/balance/');
      setUserCoins(response.data);
    } catch (error) {
      console.error('Failed to fetch user coins:', error);
    } finally {
      setLoading(false);
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

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/coins/transactions/');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setProcessingPayment(true);
    try {
      const response = await api.post('/coins/purchase/', {
        package_id: selectedPackage.id,
        payment_method: paymentMethod,
      });
      
      // Refresh data
      await fetchUserCoins();
      await fetchTransactions();
      
      setShowPurchaseModal(false);
      setSelectedPackage(null);
      
      // Show success message
      alert(`Successfully purchased ${response.data.new_balance} coins!`);
    } catch (error) {
      console.error('Failed to purchase coins:', error);
      alert('Failed to purchase coins. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getSubscriptionIcon = (type) => {
    switch (type) {
      case 'free': return <Star size={20} />;
      case 'silver': return <Gift size={20} />;
      case 'gold': return <Crown size={20} />;
      case 'vip': return <Zap size={20} />;
      default: return <Coins size={20} />;
    }
  };

  const getSubscriptionColor = (type) => {
    switch (type) {
      case 'free': return '#6B7280';
      case 'silver': return '#9CA3AF';
      case 'gold': return '#F59E0B';
      case 'vip': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase': return <ShoppingCart size={16} />;
      case 'earned': return <TrendingUp size={16} />;
      case 'spent': return <Gift size={16} />;
      case 'bonus': return <Star size={16} />;
      case 'refund': return <CreditCard size={16} />;
      default: return <Coins size={16} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'purchase': return '#10B981';
      case 'earned': return '#10B981';
      case 'spent': return '#EF4444';
      case 'bonus': return '#10B981';
      case 'refund': return '#F59E0B';
      default: return '#6B7280';
    }
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <div style={{ color: T.sub }}>Loading coins...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Coins size={32} style={{ color: T.pri }} />
          <h1 style={{ color: T.txt, fontSize: 28, fontWeight: 800, margin: 0 }}>
            Coins & Rewards
          </h1>
        </div>
        <p style={{ color: T.sub, fontSize: 16, margin: 0 }}>
          Purchase coins and unlock premium features
        </p>
      </div>

      {/* User Balance Card */}
      {userCoins && (
        <div style={{
          background: `linear-gradient(135deg, ${T.pri}, ${T.dark})`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 16, opacity: 0.9, marginBottom: 8 }}>Your Balance</div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Coins size={32} />
                {userCoins.balance.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Subscription</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                {getSubscriptionIcon(userCoins.subscription_type)}
                <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
                  {userCoins.subscription_type.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#fff', fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                {userCoins.point_multiplier}x Points • {userCoins.daily_post_limit === -1 ? 'Unlimited' : `${userCoins.daily_post_limit}`} posts/day
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coin Packages */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: T.txt, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Purchase Coins</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {coinPackages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 20,
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onClick={() => {
                setSelectedPackage(pkg);
                setShowPurchaseModal(true);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {pkg.bonus_coins > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 12,
                }}>
                  +{pkg.bonus_coins} BONUS
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: T.txt, marginBottom: 4 }}>
                  {pkg.total_coins.toLocaleString()}
                </div>
                <div style={{ color: T.sub, fontSize: 14 }}>Coins</div>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.pri }}>
                  {new Intl.NumberFormat('en-ET', {
                    style: 'currency',
                    currency: 'ETB',
                    minimumFractionDigits: 0,
                  }).format(pkg.price_etb)}
                </div>
                {pkg.value_per_etb && (
                  <div style={{ color: T.sub, fontSize: 12, marginTop: 4 }}>
                    {pkg.value_per_etb.toFixed(1)} coins/ETB
                  </div>
                )}
              </div>
              
              <button
                style={{
                  width: '100%',
                  padding: '10px',
                  background: T.pri,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ShoppingCart size={16} />
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 style={{ color: T.txt, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Transaction History</h2>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {transactions.length > 0 ? (
            <div>
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 16,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: `${getTransactionColor(transaction.transaction_type)}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                    <div style={{ color: getTransactionColor(transaction.transaction_type) }}>
                      {getTransactionIcon(transaction.transaction_type)}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {transaction.description}
                    </div>
                    <div style={{ color: T.sub, fontSize: 12 }}>
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: getTransactionColor(transaction.transaction_type),
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}>
                      {transaction.transaction_type === 'spent' ? '-' : '+'}{transaction.amount}
                    </div>
                    <div style={{ color: T.sub, fontSize: 12 }}>
                      Balance: {transaction.balance_after}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <History size={48} style={{ color: T.sub, marginBottom: 16 }} />
              <div style={{ color: T.txt, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                No transactions yet
              </div>
              <div style={{ color: T.sub, fontSize: 14 }}>
                Purchase coins to see your transaction history
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPackage && (
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
            maxWidth: 400,
          }}>
            <div style={{ padding: 24, borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ color: T.txt, fontSize: 20, fontWeight: 700, margin: 0 }}>
                Purchase Coins
              </h3>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: T.txt, marginBottom: 8 }}>
                  {selectedPackage.total_coins.toLocaleString()} Coins
                </div>
                {selectedPackage.bonus_coins > 0 && (
                  <div style={{ color: '#10B981', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    +{selectedPackage.bonus_coins} Bonus Coins
                  </div>
                )}
                <div style={{ fontSize: 24, fontWeight: 700, color: T.pri }}>
                  {new Intl.NumberFormat('en-ET', {
                    style: 'currency',
                    currency: 'ETB',
                    minimumFractionDigits: 0,
                  }).format(selectedPackage.price_etb)}
                </div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: T.txt, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Payment Method
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="telebirr"
                      checked={paymentMethod === 'telebirr'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Smartphone size={20} style={{ color: '#10B981' }} />
                      <div>
                        <div style={{ color: T.txt, fontSize: 14, fontWeight: 600 }}>Telebirr</div>
                        <div style={{ color: T.sub, fontSize: 12 }}>Instant payment via Telebirr</div>
                      </div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="airtime"
                      checked={paymentMethod === 'airtime'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={20} style={{ color: '#3B82F6' }} />
                      <div>
                        <div style={{ color: T.txt, fontSize: 14, fontWeight: 600 }}>Airtime</div>
                        <div style={{ color: T.sub, fontSize: 12 }}>Deduct from mobile balance</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setSelectedPackage(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    color: T.txt,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={processingPayment}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: T.pri,
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: processingPayment ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {processingPayment ? (
                    'Processing...'
                  ) : (
                    <>
                      <ShoppingCart size={16} />
                      Purchase Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
