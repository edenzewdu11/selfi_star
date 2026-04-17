from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Reel, Comment, CommentLike, CommentReply, SavedPost, Vote, Quest, UserQuest, Subscription, NotificationPreference, Competition, Winner, Follow, Report, Conversation, Message, MessageAttachment, SharedReel, Call

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'followers_count', 'following_count', 'profile_photo', 'bio', 'is_following']
    
    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_profile_photo(self, obj):
        if hasattr(obj, 'profile') and obj.profile.profile_photo:
            return obj.profile.profile_photo.url
        return None
    
    def get_bio(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.bio
        return ''
    
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'username', 'profile_photo', 'bio', 'xp', 'level', 'streak', 'last_checkin']

class ReelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    share_count = serializers.SerializerMethodField()
    hashtags_list = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    
    class Meta:
        model = Reel
        fields = ['id', 'user', 'image', 'media', 'caption', 'hashtags', 'hashtags_list', 'votes', 'comment_count', 'share_count', 'created_at', 'is_liked', 'is_saved']
    
    def get_image(self, obj):
        if obj.image:
            name = obj.image.name
            if name and (name.startswith('http://') or name.startswith('https://')):
                return name
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_media(self, obj):
        if obj.media:
            name = obj.media.name
            if name and (name.startswith('http://') or name.startswith('https://')):
                return name
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.media.url)
            return obj.media.url
        return None
    
    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_share_count(self, obj):
        return obj.shares.count()
    
    def get_hashtags_list(self, obj):
        return obj.get_hashtags_list()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import Vote
            return Vote.objects.filter(user=request.user, reel=obj).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import SavedPost
            return SavedPost.objects.filter(user=request.user, reel=obj).exists()
        return False

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'reel', 'text', 'created_at']

class CommentLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']

class CommentReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentReply
        fields = ['id', 'user', 'comment', 'text', 'created_at']

class SavedPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPost
        fields = ['id', 'user', 'reel', 'created_at']

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'user', 'reel', 'created_at']

class QuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quest
        fields = ['id', 'title', 'description', 'xp_reward', 'is_active']

class UserQuestSerializer(serializers.ModelSerializer):
    quest = QuestSerializer(read_only=True)
    
    class Meta:
        model = UserQuest
        fields = ['id', 'quest', 'completed', 'completed_at']

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'started_at', 'expires_at']

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['id', 'email_notifications', 'push_notifications', 'sms_notifications', 'phone']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # Signals will handle profile creation
        return user

class CompetitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = ['id', 'title', 'description', 'start_date', 'end_date', 'prize', 'is_active', 'created_at']

class WinnerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    competition = CompetitionSerializer(read_only=True)
    reel = ReelSerializer(read_only=True)
    
    class Meta:
        model = Winner
        fields = ['id', 'competition', 'user', 'reel', 'votes_received', 'prize_claimed', 'announced_at']

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)
    
    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']

class ReportSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    reported_user = UserSerializer(read_only=True)
    reported_reel = ReelSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Report
        fields = ['id', 'reported_by', 'reported_user', 'reported_reel', 'report_type', 'description', 'status', 'resolution_notes', 'reviewed_by', 'created_at', 'updated_at', 'resolved_at']

class MessageAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageAttachment
        fields = ['id', 'attachment_type', 'file_url', 'thumbnail_url', 'file_name', 'file_size', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None

class SharedReelSerializer(serializers.ModelSerializer):
    reel = ReelSerializer(read_only=True)
    
    class Meta:
        model = SharedReel
        fields = ['id', 'reel', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    shared_reels = SharedReelSerializer(many=True, read_only=True)
    conversation_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'conversation_id', 'sender', 'message_type', 'text', 'is_read', 'attachments', 'shared_reels', 'created_at', 'updated_at']
        read_only_fields = ['sender', 'attachments', 'shared_reels', 'is_read', 'conversation']
    
    def validate_conversation_id(self, value):
        """Validate that the conversation exists and user is a participant"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        
        try:
            conversation = Conversation.objects.get(id=value)
            participants_list = list(conversation.participants.values_list('id', flat=True))
            print(f"🔍 VALIDATE CONVERSATION: conversation_id={value}, user_id={request.user.id}, participants={participants_list}")
            
            # Check if user is a participant
            if not conversation.participants.filter(id=request.user.id).exists():
                print(f"🚨 User {request.user.id} not in conversation {value} participants: {participants_list}")
                raise serializers.ValidationError("Conversation not found or access denied")
            
            print(f"✅ User {request.user.id} is in conversation {value}")
            return value
        except Conversation.DoesNotExist:
            print(f"🚨 Conversation {value} does not exist")
            raise serializers.ValidationError("Conversation not found or access denied")
    
    def create(self, validated_data):
        conversation_id = validated_data.pop('conversation_id')
        conversation = Conversation.objects.get(id=conversation_id)
        validated_data['conversation'] = conversation
        return super().create(validated_data)

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'other_participant', 'last_message', 'unread_count', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return MessageSerializer(last_msg, context=self.context).data
        return None
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other = obj.get_other_participant(request.user)
            if other:
                return UserSerializer(other, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0

class CallSerializer(serializers.ModelSerializer):
    caller = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    
    class Meta:
        model = Call
        fields = ['id', 'conversation', 'caller', 'receiver', 'call_type', 'status', 'started_at', 'ended_at', 'duration']
