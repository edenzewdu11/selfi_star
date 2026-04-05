from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Q, Count, Sum, Avg
from django.contrib.auth.models import User
from .models_campaign import Campaign, CampaignEntry, CampaignVote, Reward, UserCoins, CoinTransaction, CoinPackage, UserSubscription
from .serializers_campaign import (
    CampaignSerializer, CampaignCreateSerializer, CampaignEntrySerializer,
    CampaignVoteSerializer, RewardSerializer, UserCoinsSerializer,
    CoinTransactionSerializer, CoinPackageSerializer, UserSubscriptionSerializer,
    CampaignEntryCreateSerializer, CoinPurchaseSerializer, SubscriptionPurchaseSerializer
)

# ============= CAMPAIGN MANAGEMENT =============

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_campaigns_list(request):
    """List all campaigns or create new campaign"""
    if request.method == 'GET':
        campaigns = Campaign.objects.all().order_by('-created_at')
        serializer = CampaignSerializer(campaigns, many=True)
        return Response({
            'data': serializer.data,
            'total': campaigns.count()
        })
    
    elif request.method == 'POST':
        serializer = CampaignCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            campaign = serializer.save()
            return Response(CampaignSerializer(campaign).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_campaign_detail(request, campaign_id):
    """Get, update or delete specific campaign"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CampaignSerializer(campaign)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CampaignCreateSerializer(campaign, data=request.data, context={'request': request})
        if serializer.is_valid():
            campaign = serializer.save()
            return Response(CampaignSerializer(campaign).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        campaign.delete()
        return Response({'message': 'Campaign deleted successfully'})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_campaign_entries(request, campaign_id):
    """Get all entries for a specific campaign"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        entries = campaign.entries.select_related('user', 'reel').order_by('-submitted_at')
        serializer = CampaignEntrySerializer(entries, many=True)
        return Response({
            'data': serializer.data,
            'total': entries.count(),
            'campaign': CampaignSerializer(campaign).data
        })
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_campaign_stats(request):
    """Get campaign statistics"""
    stats = {
        'total_campaigns': Campaign.objects.count(),
        'active_campaigns': Campaign.objects.filter(status='active').count(),
        'total_entries': CampaignEntry.objects.count(),
        'total_votes': CampaignVote.objects.count(),
        'campaign_types': list(Campaign.objects.values('campaign_type').annotate(count=Count('id'))),
        'recent_campaigns': CampaignSerializer(Campaign.objects.all().order_by('-created_at')[:5], many=True).data
    }
    return Response(stats)

# ============= REWARD MANAGEMENT =============

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_rewards_list(request):
    """List all rewards or create new reward"""
    if request.method == 'GET':
        rewards = Reward.objects.select_related('campaign', 'winner').all().order_by('-created_at')
        serializer = RewardSerializer(rewards, many=True)
        return Response({
            'data': serializer.data,
            'total': rewards.count()
        })
    
    elif request.method == 'POST':
        serializer = RewardSerializer(data=request.data)
        if serializer.is_valid():
            reward = serializer.save()
            return Response(RewardSerializer(reward).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def admin_assign_reward(request, reward_id):
    """Assign reward to winner"""
    try:
        reward = Reward.objects.get(id=reward_id)
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            winner = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        reward.winner = winner
        reward.is_distributed = request.data.get('is_distributed', False)
        if reward.is_distributed:
            reward.distributed_at = timezone.now()
        reward.save()
        
        return Response(RewardSerializer(reward).data)
    except Reward.DoesNotExist:
        return Response({'error': 'Reward not found'}, status=status.HTTP_404_NOT_FOUND)

# ============= COIN MANAGEMENT =============

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_coin_stats(request):
    """Get coin system statistics"""
    stats = {
        'total_coins_in_circulation': UserCoins.objects.aggregate(total=Sum('balance'))['total'] or 0,
        'total_users_with_coins': UserCoins.objects.filter(balance__gt=0).count(),
        'total_transactions': CoinTransaction.objects.count(),
        'subscriptions': list(UserCoins.objects.values('subscription_type').annotate(count=Count('id'))),
        'recent_transactions': CoinTransactionSerializer(
            CoinTransaction.objects.select_related('user').order_by('-created_at')[:10], 
            many=True
        ).data
    }
    return Response(stats)

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_coin_packages(request):
    """Manage coin packages"""
    if request.method == 'GET':
        packages = CoinPackage.objects.filter(is_active=True).order_by('sort_order')
        serializer = CoinPackageSerializer(packages, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CoinPackageSerializer(data=request.data)
        if serializer.is_valid():
            package = serializer.save()
            return Response(CoinPackageSerializer(package).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_coins(request):
    """Get all user coin accounts"""
    user_coins = UserCoins.objects.select_related('user').all().order_by('-balance')
    serializer = UserCoinsSerializer(user_coins, many=True)
    return Response({
        'data': serializer.data,
        'total': user_coins.count()
    })

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_grant_coins(request):
    """Grant coins to a user"""
    user_id = request.data.get('user_id')
    amount = request.data.get('amount')
    reason = request.data.get('reason', 'Admin grant')
    
    if not user_id or not amount:
        return Response({'error': 'user_id and amount are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        user_coins, created = UserCoins.objects.get_or_create(user=user, defaults={'balance': 0})
        
        # Add coins
        balance_before = user_coins.balance
        user_coins.balance += amount
        user_coins.save()
        
        # Create transaction
        CoinTransaction.objects.create(
            user=user,
            transaction_type='bonus',
            amount=amount,
            balance_before=balance_before,
            balance_after=user_coins.balance,
            description=reason
        )
        
        return Response({
            'message': f'Granted {amount} coins to {user.username}',
            'new_balance': user_coins.balance
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# ============= USER FACING CAMPAIGN API =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_campaigns(request):
    """Get active campaigns for user participation"""
    campaigns = Campaign.objects.filter(status='active').order_by('-created_at')
    serializer = CampaignSerializer(campaigns, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_my_campaigns(request):
    """Get campaigns user has entered"""
    entries = CampaignEntry.objects.filter(user=request.user).select_related('campaign')
    campaigns = [entry.campaign for entry in entries]
    serializer = CampaignSerializer(campaigns, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_enter_campaign(request, campaign_id):
    """Enter a campaign"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        reel_id = request.data.get('reel_id')
        
        if not reel_id:
            return Response({'error': 'reel_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if reel belongs to user
        try:
            from .models import Reel
            reel = Reel.objects.get(id=reel_id, user=request.user)
        except Reel.DoesNotExist:
            return Response({'error': 'Invalid reel or reel does not belong to you'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create entry
        entry_data = {
            'campaign': campaign.id,
            'reel': reel.id
        }
        serializer = CampaignEntryCreateSerializer(data=entry_data, context={'request': request})
        if serializer.is_valid():
            entry = serializer.save()
            return Response(CampaignEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_campaign_entries(request, campaign_id):
    """Get entries for a specific campaign"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        entries = campaign.entries.select_related('user', 'reel').order_by('-submitted_at')
        serializer = CampaignEntrySerializer(entries, many=True)
        return Response(serializer.data)
    except Campaign.DoesNotExist:
        return Response({'error': 'Campaign not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_vote_campaign(request, campaign_id, entry_id):
    """Vote for a campaign entry"""
    try:
        campaign = Campaign.objects.get(id=campaign_id)
        entry = CampaignEntry.objects.get(id=entry_id, campaign=campaign)
        
        # Check if user already voted
        if CampaignVote.objects.filter(campaign=campaign, entry=entry, user=request.user).exists():
            return Response({'error': 'You have already voted for this entry'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create vote
        CampaignVote.objects.create(
            campaign=campaign,
            entry=entry,
            user=request.user
        )
        
        return Response({'message': 'Vote recorded successfully'})
        
    except (Campaign.DoesNotExist, CampaignEntry.DoesNotExist):
        return Response({'error': 'Campaign or entry not found'}, status=status.HTTP_404_NOT_FOUND)

# ============= COIN SYSTEM API =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_coin_balance(request):
    """Get user's coin balance and subscription info"""
    user_coins, created = UserCoins.objects.get_or_create(user=request.user, defaults={'balance': 0})
    serializer = UserCoinsSerializer(user_coins)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_coin_packages(request):
    """Get available coin packages"""
    packages = CoinPackage.objects.filter(is_active=True).order_by('sort_order')
    serializer = CoinPackageSerializer(packages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_purchase_coins(request):
    """Purchase coins"""
    serializer = CoinPurchaseSerializer(data=request.data)
    if serializer.is_valid():
        package_id = serializer.validated_data['package_id']
        payment_method = serializer.validated_data['payment_method']
        
        try:
            package = CoinPackage.objects.get(id=package_id, is_active=True)
            user_coins, created = UserCoins.objects.get_or_create(user=request.user, defaults={'balance': 0})
            
            balance_before = user_coins.balance
            user_coins.balance += package.total_coins
            user_coins.save()
            
            # Create transaction
            transaction = CoinTransaction.objects.create(
                user=request.user,
                transaction_type='purchase',
                amount=package.total_coins,
                balance_before=balance_before,
                balance_after=user_coins.balance,
                description=f'Purchased {package.name}',
                payment_method=payment_method,
                payment_reference=f'pkg_{package.id}_{timezone.now().timestamp()}'
            )
            
            return Response({
                'message': f'Successfully purchased {package.total_coins} coins',
                'new_balance': user_coins.balance,
                'transaction': CoinTransactionSerializer(transaction).data
            })
            
        except CoinPackage.DoesNotExist:
            return Response({'error': 'Invalid coin package'}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_coin_transactions(request):
    """Get user's coin transaction history"""
    transactions = CoinTransaction.objects.filter(user=request.user).order_by('-created_at')[:50]
    serializer = CoinTransactionSerializer(transactions, many=True)
    return Response(serializer.data)
