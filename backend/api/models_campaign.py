from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Reel
import uuid

class Campaign(models.Model):
    """Main campaign model for seasonal contests"""
    
    CAMPAIGN_TYPES = [
        ('daily', 'Daily Reward'),
        ('weekly', 'Weekly Reward'), 
        ('monthly', 'Monthly Reward'),
        ('grand_finale', 'Grand Finale'),
        ('flash', 'Flash Challenge'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    campaign_type = models.CharField(max_length=20, choices=CAMPAIGN_TYPES, default='grand_finale')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    image = models.ImageField(upload_to='campaigns/', null=True, blank=True)
    
    # Timeline
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(default=timezone.now)
    
    # Participation Rules
    min_age = models.IntegerField(default=18)
    original_content_required = models.BooleanField(default=True)
    official_hashtag = models.CharField(max_length=100, blank=True)
    max_entries_per_user = models.IntegerField(default=1)
    
    # Campaign criteria (legacy support)
    min_followers = models.IntegerField(default=0, help_text='Minimum followers required')
    min_level = models.IntegerField(default=1, help_text='Minimum user level required')
    min_votes_per_reel = models.IntegerField(default=0, help_text='Minimum votes per reel to qualify')
    required_hashtags = models.CharField(max_length=500, blank=True, help_text='Comma-separated hashtags')
    
    # Reward Structure
    total_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Budget in ETB")
    max_winners = models.IntegerField(default=1)
    
    # Prize information (legacy support)
    prize_title = models.CharField(max_length=200, blank=True)
    prize_description = models.TextField(blank=True)
    prize_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Scoring System (out of 100)
    creativity_weight = models.IntegerField(default=30, validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True)
    engagement_weight = models.IntegerField(default=25, validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True)
    consistency_weight = models.IntegerField(default=20, validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True)
    quality_weight = models.IntegerField(default=15, validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True)
    theme_weight = models.IntegerField(default=10, validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True)
    
    # Selection Process
    judge_weight = models.IntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)])
    public_vote_weight = models.IntegerField(default=30, validators=[MinValueValidator(0), MaxValueValidator(100)])
    
    # Winner information
    winner_count = models.IntegerField(default=1, help_text='Number of winners')
    winners_announced = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_campaigns')
    
    # Stats
    total_entries = models.IntegerField(default=0)
    total_votes = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.status})"
    
    @property
    def is_active(self):
        now = timezone.now()
        return self.status == 'active' and self.start_date <= now <= self.end_date
    
    @property
    def total_entries(self):
        return self.entries.count()
    
    @property
    def total_votes(self):
        return CampaignVote.objects.filter(campaign=self).count()
    
    def is_voting_open(self):
        # Legacy method - use is_active for new campaigns
        return self.is_active

class CampaignEntry(models.Model):
    """User entry to a campaign"""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_entries')
    reel = models.ForeignKey('api.Reel', on_delete=models.CASCADE, related_name='campaign_entries')
    
    # Entry status
    approved = models.BooleanField(default=True)
    disqualified = models.BooleanField(default=False)
    disqualification_reason = models.TextField(blank=True)
    
    # Voting stats
    vote_count = models.IntegerField(default=0)
    rank = models.IntegerField(null=True, blank=True)
    is_winner = models.BooleanField(default=False)
    
    # Metadata
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-vote_count', '-submitted_at']
        unique_together = ['campaign', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.campaign.title}"

class CampaignVote(models.Model):
    """Votes for campaign entries"""
    entry = models.ForeignKey(CampaignEntry, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_votes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['entry', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} voted for {self.entry.user.username}"

class CampaignWinner(models.Model):
    """Winners of campaigns"""
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='winners')
    entry = models.ForeignKey(CampaignEntry, on_delete=models.CASCADE, related_name='winner_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_wins')
    
    rank = models.IntegerField(help_text='1st, 2nd, 3rd place, etc.')
    prize_claimed = models.BooleanField(default=False)
    prize_claimed_at = models.DateTimeField(null=True, blank=True)
    
    announced_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['rank']
        unique_together = ['campaign', 'rank']
    
    def __str__(self):
        return f"{self.user.username} - {self.campaign.title} (Rank {self.rank})"

class CampaignNotification(models.Model):
    """Notifications related to campaigns"""
    NOTIFICATION_TYPES = [
        ('new_campaign', 'New Campaign'),
        ('entry_approved', 'Entry Approved'),
        ('voting_started', 'Voting Started'),
        ('winner_announced', 'Winner Announced'),
        ('prize_ready', 'Prize Ready'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} - {self.user.username}"

class UserCoins(models.Model):
    """User coin balance and subscription"""
    
    SUBSCRIPTION_TYPES = [
        ('free', 'Free'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('vip', 'VIP'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='coin_account')
    balance = models.IntegerField(default=0)
    subscription_type = models.CharField(max_length=10, choices=SUBSCRIPTION_TYPES, default='free')
    
    # Subscription details
    subscription_start = models.DateTimeField(null=True, blank=True)
    subscription_end = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=False)
    
    # Daily limits based on subscription
    daily_posts_used = models.IntegerField(default=0)
    daily_posts_reset = models.DateField(auto_now_add=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "User Coin Accounts"
        
    def __str__(self):
        return f"{self.user.username} - {self.balance} coins ({self.get_subscription_type_display()})"
    
    @property
    def daily_post_limit(self):
        limits = {
            'free': 1,
            'silver': 3,
            'gold': -1,  # Unlimited
            'vip': -1,   # Unlimited
        }
        return limits[self.subscription_type]
    
    @property
    def point_multiplier(self):
        multipliers = {
            'free': 1.0,
            'silver': 1.5,
            'gold': 2.0,
            'vip': 3.0,
        }
        return multipliers[self.subscription_type]
    
    def can_post_today(self):
        if self.daily_post_limit == -1:  # Unlimited
            return True
        return self.daily_posts_used < self.daily_post_limit
    
    def reset_daily_posts(self):
        today = timezone.now().date()
        if self.daily_posts_reset < today:
            self.daily_posts_used = 0
            self.daily_posts_reset = today
            self.save()

class CoinTransaction(models.Model):
    """Transaction history for coins"""
    
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('earned', 'Earned'),
        ('spent', 'Spent'),
        ('bonus', 'Bonus'),
        ('refund', 'Refund'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coin_transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.IntegerField()
    balance_before = models.IntegerField()
    balance_after = models.IntegerField()
    
    # Details
    description = models.CharField(max_length=200)
    reference_id = models.CharField(max_length=100, blank=True)  # For payment references
    
    # Payment details for purchases
    payment_method = models.CharField(max_length=20, blank=True)  # telebirr, airtime
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} {self.amount} coins"

class CoinPackage(models.Model):
    """Available coin packages for purchase"""
    
    name = models.CharField(max_length=100)
    coins = models.IntegerField()
    bonus_coins = models.IntegerField(default=0)
    price_etb = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sort_order', 'price_etb']
        
    def __str__(self):
        total_coins = self.coins + self.bonus_coins
        return f"{total_coins} coins - {self.price_etb} ETB"
    
    @property
    def total_coins(self):
        return self.coins + self.bonus_coins
    
    @property
    def value_per_etb(self):
        return self.total_coins / float(self.price_etb)

class UserSubscription(models.Model):
    """User subscription history"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    subscription_type = models.CharField(max_length=10, choices=UserCoins.SUBSCRIPTION_TYPES)
    
    # Subscription period
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Payment details
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2)
    payment_method = models.CharField(max_length=20)
    payment_reference = models.CharField(max_length=100)
    
    # Status
    is_active = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.get_subscription_type_display()}"

class Reward(models.Model):
    """Rewards for campaign winners"""
    
    REWARD_TYPES = [
        ('cash', 'Cash Prize'),
        ('phone', 'Smartphone'),
        ('airtime', 'Airtime'),
        ('data', 'Data Bundle'),
        ('voucher', 'Voucher'),
        ('trip', 'Trip'),
        ('brand_deal', 'Brand Deal'),
        ('other', 'Other'),
    ]
    
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='rewards')
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    value_etb = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    
    # Winner assignment
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_rewards')
    rank = models.IntegerField(help_text="1 for 1st place, 2 for 2nd place, etc.")
    
    # Status
    is_distributed = models.BooleanField(default=False)
    distributed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['rank', 'campaign']
        
    def __str__(self):
        return f"{self.title} - {self.campaign.title}"
