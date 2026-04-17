from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from .models import UserProfile, Reel, Comment, Vote, Quest, UserQuest, Subscription, NotificationPreference, Competition, Winner, Follow, CommentLike, CommentReply, SavedPost, Conversation, Message, MessageAttachment, SharedReel, Call, Report, Notification
from .models_campaign import CampaignNotification
from .serializers import (
    UserSerializer, UserProfileSerializer, ReelSerializer, CommentSerializer, VoteSerializer,
    QuestSerializer, UserQuestSerializer, SubscriptionSerializer,
    NotificationPreferenceSerializer, RegisterSerializer, CompetitionSerializer, WinnerSerializer, FollowSerializer,
    ConversationSerializer, MessageSerializer, MessageAttachmentSerializer, SharedReelSerializer, CallSerializer, ReportSerializer
)
from .serializers_extended import CommentSerializer as ExtendedCommentSerializer, CommentLikeSerializer, CommentReplySerializer, SavedPostSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Try to find user by username or email
    user = None
    try:
        # First try username
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        # Then try email
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            pass
    
    if user and user.check_password(password):
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    try:
        print("=== CREATE POST DEBUG ===")
        print(f"Authenticated user: {request.user}")
        print(f"User ID: {request.user.id}")
        print(f"Username: {request.user.username}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        
        caption = request.data.get('caption', '')
        hashtags = request.data.get('hashtags', '')
        file = request.FILES.get('file')
        
        if not file:
            print("❌ No file provided")
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Received file: {file.name}")
        print(f"File type: {file.content_type}")
        print(f"File size: {file.size}")
        
        # Content moderation check
        print(f"🔍 Starting content moderation check...")
        try:
            from .content_moderation import moderate_upload
            print(f"Checking file for post: {file.name}, type: {file.content_type}")
            is_safe, moderation_msg = moderate_upload(file)
            print(f"📊 Moderation result: is_safe={is_safe}, msg={moderation_msg}")
            
            if not is_safe:
                print(f"🚫 [ContentModeration] Post BLOCKED for user {request.user.username}: {moderation_msg}")
                return Response({
                    'error': moderation_msg,
                    'moderation_blocked': True
                }, status=status.HTTP_400_BAD_REQUEST)
            print(f"✅ [ContentModeration] Post APPROVED for user {request.user.username}")
        except Exception as e:
            print(f"❌ [ContentModeration] Error during post moderation: {e}")
            import traceback
            traceback.print_exc()
            # Allow post on moderation error to avoid blocking legitimate content
            print(f"⚠️ [ContentModeration] Allowing post despite moderation error")
        
        # Determine if it's a video or image
        is_video = file.content_type.startswith('video/') or file.name.lower().endswith(('.mp4', '.webm', '.mov', '.avi'))
        is_image = file.content_type.startswith('image/') or file.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))
        
        print(f"Detected as - Video: {is_video}, Image: {is_image}")
        
        # Create the reel with appropriate field
        if is_video:
            reel = Reel.objects.create(
                user=request.user,
                media=file,
                caption=caption,
                hashtags=hashtags
            )
        else:
            reel = Reel.objects.create(
                user=request.user,
                image=file,
                caption=caption,
                hashtags=hashtags
            )
        
        # Award XP for posting
        profile = request.user.profile
        profile.xp += 25
        profile.save()
        
        print(f"✅ Created reel ID: {reel.id}")
        print(f"Reel user: {reel.user.username}")
        print(f"Reel media: {reel.media.name if reel.media else None}")
        print(f"Reel image: {reel.image.name if reel.image else None}")
        
        serializer = ReelSerializer(reel, context={'request': request})
        response_data = serializer.data
        print(f"Serialized response: {response_data}")
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Exception in create_post: {e}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['patch'])
    def update_profile(self, request):
        profile = request.user.profile
        user = request.user
        
        # Update user fields
        if 'username' in request.data:
            user.username = request.data['username']
        if 'email' in request.data:
            user.email = request.data['email']
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        user.save()
        
        # Update profile fields
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'profile_photo' in request.FILES:
            profile.profile_photo = request.FILES['profile_photo']
        profile.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'bio': profile.bio,
            'profile_photo': profile.profile_photo.url if profile.profile_photo else None
        })
    
    @action(detail=False, methods=['post'])
    def update_privacy(self, request):
        profile = request.user.profile
        
        # Update privacy settings
        if 'privateAccount' in request.data:
            profile.is_private = request.data['privateAccount']
        if 'showActivity' in request.data:
            profile.show_activity = request.data['showActivity']
        if 'allowMessages' in request.data:
            profile.allow_messages = request.data['allowMessages']
        
        profile.save()
        
        return Response({
            'privateAccount': profile.is_private,
            'showActivity': profile.show_activity,
            'allowMessages': profile.allow_messages,
            'message': 'Privacy settings updated successfully'
        })
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = request.user.profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_xp(self, request):
        profile = request.user.profile
        xp = request.data.get('xp', 0)
        profile.xp += xp
        profile.level = (profile.xp // 1000) + 1
        profile.save()
        return Response(UserProfileSerializer(profile).data)
    
    @action(detail=False, methods=['post'])
    def daily_checkin(self, request):
        profile = request.user.profile
        now = timezone.now()
        
        if profile.last_checkin:
            if (now - profile.last_checkin).days == 1:
                profile.streak += 1
            elif (now - profile.last_checkin).days > 1:
                profile.streak = 1
        else:
            profile.streak = 1
        
        profile.last_checkin = now
        profile.xp += 50
        profile.save()
        
        return Response({
            'streak': profile.streak,
            'xp': profile.xp,
            'level': profile.level
        })

class ReelViewSet(viewsets.ModelViewSet):
    queryset = Reel.objects.all()
    serializer_class = ReelSerializer
    permission_classes = [AllowAny]  # Allow anyone to view reels
    
    def get_queryset(self):
        queryset = Reel.objects.all().order_by('-created_at')
        
        # Filter by user
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter saved posts (requires authentication)
        saved = self.request.query_params.get('saved', None)
        if saved == 'true' and self.request.user.is_authenticated:
            from .models import SavedPost
            saved_post_ids = SavedPost.objects.filter(user=self.request.user).values_list('reel_id', flat=True)
            queryset = queryset.filter(id__in=saved_post_ids)
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'vote', 'comments']:
            self.permission_classes = [IsAuthenticated]  # Require auth for modifying operations
        return super().get_permissions()
    
    def create(self, request, *args, **kwargs):
        # Content moderation check on reel uploads
        file = request.FILES.get('image') or request.FILES.get('media')
        if file:
            from .content_moderation import moderate_upload
            is_safe, moderation_msg = moderate_upload(file)
            if not is_safe:
                print(f"[ContentModeration] Reel BLOCKED for user {request.user.username}: {moderation_msg}")
                return Response({
                    'error': moderation_msg,
                    'moderation_blocked': True
                }, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        reel = self.get_object()
        if reel.user != request.user and not request.user.is_staff:
            return Response({'error': 'You can only delete your own posts.'}, status=status.HTTP_403_FORBIDDEN)
        reel.delete()
        return Response({'message': 'Post deleted successfully'}, status=status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        reel = self.get_object()
        if reel.user != request.user and not request.user.is_staff:
            return Response({'error': 'You can only edit your own posts.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        reel = self.get_object()
        if reel.user != request.user and not request.user.is_staff:
            return Response({'error': 'You can only edit your own posts.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        reel = self.get_object()
        vote, created = Vote.objects.get_or_create(user=request.user, reel=reel)
        
        if created:
            reel.votes += 1
            reel.save()
            return Response({'voted': True, 'votes': reel.votes})
        else:
            vote.delete()
            reel.votes -= 1
            reel.save()
            return Response({'voted': False, 'votes': reel.votes})
    
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        reel = self.get_object()
        
        if request.method == 'GET':
            comments = Comment.objects.filter(reel=reel)
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
            text = request.data.get('text', '').strip()
            if not text:
                return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            comment = Comment.objects.create(
                user=request.user,
                reel=reel,
                text=text
            )
            
            serializer = CommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class QuestViewSet(viewsets.ModelViewSet):
    queryset = Quest.objects.filter(is_active=True)
    serializer_class = QuestSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        quest = self.get_object()
        user_quest, _ = UserQuest.objects.get_or_create(user=request.user, quest=quest)
        
        if not user_quest.completed:
            user_quest.completed = True
            user_quest.completed_at = timezone.now()
            user_quest.save()
            
            profile = request.user.profile
            profile.xp += quest.xp_reward
            profile.save()
        
        return Response(UserQuestSerializer(user_quest).data)

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def upgrade(self, request):
        plan = request.data.get('plan')
        subscription = request.user.subscription
        subscription.plan = plan
        subscription.expires_at = timezone.now() + timedelta(days=30)
        subscription.save()
        return Response(SubscriptionSerializer(subscription).data)

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        prefs = request.user.notification_prefs
        if request.method == 'PUT':
            serializer = self.get_serializer(prefs, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(prefs)
        return Response(serializer.data)

class CompetitionViewSet(viewsets.ModelViewSet):
    queryset = Competition.objects.filter(is_active=True)
    serializer_class = CompetitionSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    @action(detail=True, methods=['post'])
    def determine_winner(self, request, pk=None):
        competition = self.get_object()
        
        if competition.is_active:
            return Response({'error': 'Competition is still active'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get top voted reel during competition period
        top_reel = Reel.objects.filter(
            created_at__gte=competition.start_date,
            created_at__lte=competition.end_date
        ).order_by('-votes').first()
        
        if not top_reel:
            return Response({'error': 'No submissions found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create winner
        winner, created = Winner.objects.get_or_create(
            competition=competition,
            user=top_reel.user,
            defaults={
                'reel': top_reel,
                'votes_received': top_reel.votes
            }
        )
        
        serializer = WinnerSerializer(winner)
        return Response(serializer.data)

class WinnerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Winner.objects.all()
    serializer_class = WinnerSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        winners = Winner.objects.all()[:10]
        serializer = self.get_serializer(winners, many=True)
        return Response(serializer.data)

class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        following_id = request.data.get('following_id')
        if not following_id:
            return Response({'error': 'following_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            following_user = User.objects.get(id=following_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if following_user == request.user:
            return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=following_user
        )
        
        if not created:
            follow.delete()
            return Response({'following': False, 'message': 'Unfollowed'})
        
        return Response({'following': True, 'message': 'Followed'})
    
    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        # Get users the current user is not following
        following_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)
        suggestions = User.objects.exclude(id__in=following_ids).exclude(id=request.user.id)[:10]
        serializer = UserSerializer(suggestions, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='user-followers/(?P<user_id>[^/.]+)')
    def user_followers(self, request, user_id=None):
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        follower_ids = Follow.objects.filter(following=target).values_list('follower_id', flat=True)
        users = User.objects.filter(id__in=follower_ids)
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='user-following/(?P<user_id>[^/.]+)')
    def user_following(self, request, user_id=None):
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        following_ids = Follow.objects.filter(follower=target).values_list('following_id', flat=True)
        users = User.objects.filter(id__in=following_ids)
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def search(request):
    query = request.GET.get('q', '')
    if not query:
        return Response({'users': [], 'posts': [], 'hashtags': []})
    
    # Search users
    users = User.objects.filter(
        username__icontains=query
    )[:10]
    
    # Search posts by caption or hashtags
    posts = Reel.objects.filter(
        caption__icontains=query
    ) | Reel.objects.filter(
        hashtags__icontains=query
    )
    posts = posts.distinct()[:20]
    
    # Extract unique hashtags
    hashtags = set()
    for post in Reel.objects.exclude(hashtags=''):
        for tag in post.get_hashtags_list():
            if query.lower() in tag.lower():
                hashtags.add(tag)
    
    return Response({
        'users': UserSerializer(users, many=True, context={'request': request}).data,
        'posts': ReelSerializer(posts, many=True).data,
        'hashtags': list(hashtags)[:10]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """Get all notifications for the authenticated user"""
    notifications = Notification.objects.filter(user=request.user).order_by('-timestamp')
    
    result = []
    for notif in notifications:
        result.append({
            'id': notif.id,
            'type': notif.type,
            'message': notif.message,
            'read': notif.read,
            'timestamp': notif.timestamp,
            'user': {
                'id': notif.sender.id if notif.sender else None,
                'username': notif.sender.username if notif.sender else None,
                'profile_photo': notif.sender.profile.profile_photo.url if notif.sender and notif.sender.profile.profile_photo else None
            } if notif.sender else None,
            'post': {
                'id': notif.post.id,
                'thumbnail': notif.post.image.url if notif.post and notif.post.image else None
            } if notif.post else None,
            'comment': notif.comment,
            'conversation_id': notif.conversation_id,
            'campaign_id': notif.campaign.campaign.id if notif.campaign and notif.campaign.campaign else None,
            'campaign': {
                'id': notif.campaign.campaign.id if notif.campaign and notif.campaign.campaign else None,
                'title': notif.campaign.campaign.title if notif.campaign and notif.campaign.campaign else None,
                'image': notif.campaign.campaign.image.url if notif.campaign and notif.campaign.campaign and notif.campaign.campaign.image else None
            } if notif.campaign else None
        })
    
    return Response(result)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, notification_id):
    """Mark a specific notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_as_read(request):
    """Mark all notifications for the user as read"""
    updated_count = Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'message': f'Marked {updated_count} notifications as read'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """Delete a specific notification"""
    try:
        notification = Notification.objects.get(id=notification_id, user=request.user)
        notification.delete()
        return Response({'message': 'Notification deleted'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """Create a new report for inappropriate content"""
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(reported_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reports_list(request):
    """Get all reports for admin dashboard"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    status_filter = request.query_params.get('status', None)
    report_type = request.query_params.get('type', None)
    
    reports = Report.objects.all().order_by('-created_at')
    
    if status_filter:
        reports = reports.filter(status=status_filter)
    if report_type:
        reports = reports.filter(report_type=report_type)
    
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def admin_report_detail(request, report_id):
    """Get or update a specific report"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        report = Report.objects.get(id=report_id)
    except Report.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ReportSerializer(report)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ReportSerializer(report, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(reviewed_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_reports_stats(request):
    """Get report statistics for admin dashboard"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count
    
    total_reports = Report.objects.count()
    pending_reports = Report.objects.filter(status='pending').count()
    reviewing_reports = Report.objects.filter(status='reviewing').count()
    resolved_reports = Report.objects.filter(status='resolved').count()
    dismissed_reports = Report.objects.filter(status='dismissed').count()
    
    reports_by_type = Report.objects.values('report_type').annotate(count=Count('id'))
    
    return Response({
        'total_reports': total_reports,
        'pending_reports': pending_reports,
        'reviewing_reports': reviewing_reports,
        'resolved_reports': resolved_reports,
        'dismissed_reports': dismissed_reports,
        'reports_by_type': list(reports_by_type),
    })

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user).order_by('-updated_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start a new conversation with a user"""
        recipient_id = request.data.get('recipient_id')
        
        if not recipient_id:
            return Response({'error': 'recipient_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if recipient == request.user:
            return Response({'error': 'Cannot message yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if recipient allows messages
        if hasattr(recipient, 'profile') and not recipient.profile.allow_messages:
            return Response({'error': 'User has disabled messages'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if conversation already exists
        existing = Conversation.objects.filter(participants=request.user).filter(participants=recipient).first()
        if existing:
            print(f"✅ Existing conversation found: {existing.id}")
            serializer = self.get_serializer(existing)
            return Response(serializer.data)
        
        # Create new conversation
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, recipient)
        print(f"✅ New conversation created: {conversation.id}, participants: {request.user.id}, {recipient.id}")
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def contacts(self, request):
        """Get list of users from followers/following to message"""
        # Get followers
        followers = Follow.objects.filter(following=request.user).values_list('follower', flat=True)
        # Get following
        following = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
        
        # Combine and get unique users
        contact_ids = set(list(followers) + list(following))
        contacts = User.objects.filter(id__in=contact_ids)
        
        # Filter by search query if provided
        search = request.query_params.get('search', '')
        if search:
            contacts = contacts.filter(username__icontains=search)
        
        serializer = UserSerializer(contacts, many=True, context={'request': request})
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            return Message.objects.filter(
                conversation_id=conversation_id,
                conversation__participants=self.request.user
            ).prefetch_related('attachments', 'shared_reels').select_related('sender').order_by('-created_at')
        return Message.objects.none()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        print("=== MESSAGE CREATE START ===")
        print(f"Request data: {request.data}")
        print(f"Request FILES: {request.FILES}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        
        # Refresh the message to include attachments
        message = serializer.instance
        message.refresh_from_db()
        
        # Re-serialize with fresh data including attachments
        fresh_serializer = self.get_serializer(message)
        headers = self.get_success_headers(fresh_serializer.data)
        return Response(fresh_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        print("=== MESSAGE CREATE DEBUG ===")
        print(f"Request data: {self.request.data}")
        print(f"Request FILES: {self.request.FILES}")
        print(f"Authenticated user: {self.request.user.username} (ID: {self.request.user.id})")
        print(f"Is authenticated: {self.request.user.is_authenticated}")
        print(f"Auth header: {self.request.META.get('HTTP_AUTHORIZATION', 'None')}")
        
        # Check if user is actually admin
        if self.request.user.is_staff:
            print("⚠️ WARNING: Authenticated user is STAFF!")
        
        message = serializer.save(sender=self.request.user)
        print(f"✅ Created message: {message.id} by {message.sender.username} (ID: {message.sender.id})")
        
        # Double-check the sender wasn't changed
        if message.sender.id != self.request.user.id:
            print("🚨 CRITICAL ERROR: Message sender was changed!")
            print(f"Expected: {self.request.user.id}, Got: {message.sender.id}")
        
        # Update conversation timestamp
        message.conversation.updated_at = timezone.now()
        message.conversation.save()
        
        # Handle attachments
        files = self.request.FILES.getlist('files')
        print(f"📎 Processing {len(files)} files")
        
        for file in files:
            print(f"  📄 File: {file.name}, Type: {file.content_type}, Size: {file.size}")
            
            # Determine attachment type
            if file.content_type.startswith('image/'):
                attachment_type = 'image'
            elif file.content_type.startswith('video/'):
                attachment_type = 'video'
            elif file.content_type.startswith('audio/'):
                attachment_type = 'audio'
            else:
                attachment_type = 'file'
            
            attachment = MessageAttachment.objects.create(
                message=message,
                attachment_type=attachment_type,
                file=file,
                file_name=file.name,
                file_size=file.size
            )
            print(f"  ✅ Created {attachment_type} attachment: {attachment.id}")
        
        # Handle shared reel
        reel_id = self.request.data.get('reel_id')
        if reel_id:
            try:
                reel = Reel.objects.get(id=reel_id)
                SharedReel.objects.create(message=message, reel=reel)
                print(f"✅ Shared reel: {reel_id}")
            except Reel.DoesNotExist:
                print(f"❌ Reel {reel_id} not found")
                pass
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        if message.conversation.participants.filter(id=request.user.id).exists():
            message.is_read = True
            message.save()
            return Response({'status': 'marked as read'})
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=False, methods=['post'])
    def mark_conversation_read(self, request):
        """Mark all messages in a conversation as read"""
        conversation_id = request.data.get('conversation_id')
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
            Message.objects.filter(conversation=conversation).exclude(sender=request.user).update(is_read=True)
            return Response({'status': 'conversation marked as read'})
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

class CallViewSet(viewsets.ModelViewSet):
    serializer_class = CallSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Call.objects.filter(
            caller=self.request.user
        ) | Call.objects.filter(
            receiver=self.request.user
        )
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate a new call"""
        conversation_id = request.data.get('conversation_id')
        call_type = request.data.get('call_type', 'audio')
        
        try:
            conversation = Conversation.objects.get(id=conversation_id, participants=request.user)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        receiver = conversation.get_other_participant(request.user)
        if not receiver:
            return Response({'error': 'Receiver not found'}, status=status.HTTP_404_NOT_FOUND)
        
        call = Call.objects.create(
            conversation=conversation,
            caller=request.user,
            receiver=receiver,
            call_type=call_type,
            status='initiated'
        )
        
        serializer = self.get_serializer(call)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update call status"""
        call = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Call.STATUS_CHOICES):
            call.status = new_status
            
            if new_status == 'ended':
                call.ended_at = timezone.now()
                if call.started_at:
                    call.duration = int((call.ended_at - call.started_at).total_seconds())
            
            call.save()
            serializer = self.get_serializer(call)
            return Response(serializer.data)
        
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
