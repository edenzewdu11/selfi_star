from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models_campaign import Campaign, CampaignEntry, CampaignVote, Reward, UserCoins, CoinTransaction, CoinPackage, UserSubscription
from .models import Reel

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class CampaignSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Campaign
        fields = '__all__'
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add computed fields
        try:
            data['entries_count'] = instance.entries.count()
            data['votes_count'] = CampaignVote.objects.filter(campaign=instance).count()
            data['is_active_status'] = instance.is_active
        except Exception as e:
            # Fallback values if there's an error
            data['entries_count'] = 0
            data['votes_count'] = 0
            # Calculate is_active manually if the property fails
            from django.utils import timezone
            now = timezone.now()
            data['is_active_status'] = instance.status == 'active' and instance.start_date <= now <= instance.end_date
        return data

class CampaignEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    campaign = CampaignSerializer(read_only=True)
    reel_data = serializers.SerializerMethodField()
    
    class Meta:
        model = CampaignEntry
        fields = '__all__'
    
    def get_reel_data(self, obj):
        if obj.reel:
            return {
                'id': obj.reel.id,
                'caption': obj.reel.caption,
                'image': obj.reel.image.url if obj.reel.image else None,
                'media': obj.reel.media.url if obj.reel.media else None,
            }
        return None

class CampaignVoteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    entry = CampaignEntrySerializer(read_only=True)
    
    class Meta:
        model = CampaignVote
        fields = '__all__'

class RewardSerializer(serializers.ModelSerializer):
    campaign = CampaignSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    
    class Meta:
        model = Reward
        fields = '__all__'

class UserCoinsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserCoins
        fields = '__all__'

class CoinTransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CoinTransaction
        fields = '__all__'

class CoinPackageSerializer(serializers.ModelSerializer):
    total_coins = serializers.ReadOnlyField()
    value_per_etb = serializers.ReadOnlyField()
    
    class Meta:
        model = CoinPackage
        fields = '__all__'

class UserSubscriptionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = '__all__'

class CampaignCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating campaigns"""
    
    class Meta:
        model = Campaign
        exclude = ['created_by']
    
    def validate(self, data):
        # Add validation for required fields
        if not data.get('description', '').strip():
            raise serializers.ValidationError("Description is required")
        if not data.get('start_date'):
            raise serializers.ValidationError("Start date is required")
        if not data.get('end_date'):
            raise serializers.ValidationError("End date is required")
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        # Add default values for optional fields
        if not validated_data.get('min_age'):
            validated_data['min_age'] = 18
        if not validated_data.get('original_content_required'):
            validated_data['original_content_required'] = True
        if not validated_data.get('max_entries_per_user'):
            validated_data['max_entries_per_user'] = 1
        if not validated_data.get('min_followers'):
            validated_data['min_followers'] = 0
        if not validated_data.get('min_level'):
            validated_data['min_level'] = 1
        if not validated_data.get('min_votes_per_reel'):
            validated_data['min_votes_per_reel'] = 0
        if not validated_data.get('max_winners'):
            validated_data['max_winners'] = 1
        if not validated_data.get('winner_count'):
            validated_data['winner_count'] = 1
        if not validated_data.get('campaign_type'):
            validated_data['campaign_type'] = 'daily'
        if not validated_data.get('status'):
            validated_data['status'] = 'draft'
        
        return super().create(validated_data)

class CampaignEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating campaign entries"""
    
    class Meta:
        model = CampaignEntry
        fields = ['campaign', 'reel']
    
    def validate(self, data):
        campaign = data['campaign']
        user = self.context['request'].user
        
        # Check if user already entered
        if CampaignEntry.objects.filter(campaign=campaign, user=user).exists():
            raise serializers.ValidationError("You have already entered this campaign")
        
        # Check if campaign is active
        if not campaign.is_active:
            raise serializers.ValidationError("This campaign is not active")
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class CoinPurchaseSerializer(serializers.Serializer):
    """Serializer for purchasing coins"""
    package_id = serializers.IntegerField()
    payment_method = serializers.CharField(max_length=20)
    
    def validate_package_id(self, value):
        try:
            package = CoinPackage.objects.get(id=value, is_active=True)
            return value
        except CoinPackage.DoesNotExist:
            raise serializers.ValidationError("Invalid coin package")
    
    def validate_payment_method(self, value):
        valid_methods = ['telebirr', 'airtime']
        if value not in valid_methods:
            raise serializers.ValidationError(f"Payment method must be one of: {valid_methods}")
        return value

class SubscriptionPurchaseSerializer(serializers.Serializer):
    """Serializer for purchasing subscriptions"""
    subscription_type = serializers.CharField(max_length=10)
    payment_method = serializers.CharField(max_length=20)
    
    def validate_subscription_type(self, value):
        valid_types = ['silver', 'gold', 'vip']
        if value not in valid_types:
            raise serializers.ValidationError(f"Subscription type must be one of: {valid_types}")
        return value
    
    def validate_payment_method(self, value):
        valid_methods = ['telebirr', 'airtime']
        if value not in valid_methods:
            raise serializers.ValidationError(f"Payment method must be one of: {valid_methods}")
        return value
