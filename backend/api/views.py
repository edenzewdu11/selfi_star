from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

from .models import UserProfile, Reel, Vote, Quest, UserQuest, Subscription, NotificationPreference
from .serializers import (
    UserSerializer, UserProfileSerializer, ReelSerializer, VoteSerializer,
    QuestSerializer, UserQuestSerializer, SubscriptionSerializer,
    NotificationPreferenceSerializer, RegisterSerializer
)

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
    
    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_post(request):
    try:
        caption = request.data.get('caption', '')
        file = request.FILES.get('file')
        
        if not file:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check file type (video or image)
        if not file.content_type.startswith('video/') and not file.content_type.startswith('image/'):
            return Response({'error': 'Only video and image files are allowed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the reel
        reel = Reel.objects.create(
            user=request.user,
            image=file,
            caption=caption
        )
        
        # Award XP for posting
        profile = request.user.profile
        profile.xp += 25  # Award 25 XP for posting
        profile.save()
        
        serializer = ReelSerializer(reel)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
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
    
    def get_permissions(self):
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update' or self.action == 'destroy':
            self.permission_classes = [IsAuthenticated]  # Require auth for modifying operations
        return super().get_permissions()
    
    def get_queryset(self):
        return Reel.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
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
