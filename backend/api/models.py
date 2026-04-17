from django.db import models
from django.contrib.auth.models import User

# Campaign models will be imported after they're created
# from .models_campaign import Campaign, CampaignEntry, CampaignVote, CampaignWinner, CampaignNotification

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    streak = models.IntegerField(default=0)
    last_checkin = models.DateTimeField(null=True, blank=True)
    language = models.CharField(max_length=10, default='en')
    # Privacy settings
    is_private = models.BooleanField(default=False)
    show_activity = models.BooleanField(default=True)
    allow_messages = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - Level {self.level}"

class Reel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reels')
    image = models.ImageField(upload_to='reels/', null=True, blank=True)
    media = models.FileField(upload_to='reels/', null=True, blank=True)
    caption = models.TextField(blank=True)
    hashtags = models.TextField(blank=True)
    votes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reel by {self.user.username}"
    
    def get_hashtags_list(self):
        import re
        if self.hashtags:
            tags = re.split(r'[,\s]+', self.hashtags.strip())
            return [t if t.startswith('#') else f'#{t}' for t in tags if t]
        return []

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.reel.id}"
    
    @property
    def likes_count(self):
        return self.comment_likes.count()
    
    @property
    def replies_count(self):
        return self.replies.count()

class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'comment')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked comment {self.comment.id}"

class CommentReply(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_replies')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='replies')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.user.username} on comment {self.comment.id}"

class SavedPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_posts')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'reel')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} saved reel {self.reel.id}"

class Vote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='reel_votes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'reel')

    def __str__(self):
        return f"{self.user.username} voted on {self.reel.id}"

class Quest(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    xp_reward = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class UserQuest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'quest')

    def __str__(self):
        return f"{self.user.username} - {self.quest.title}"

class Subscription(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
        ('premium', 'Premium'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_prefs')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Notifications for {self.user.username}"

class Notification(models.Model):
    """General notifications for all user activities"""
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('follow', 'Follow'),
        ('message', 'Message'),
        ('new_video', 'New Video'),
        ('campaign', 'Campaign'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Optional related objects
    campaign = models.ForeignKey('CampaignNotification', on_delete=models.SET_NULL, null=True, blank=True, related_name='general_notifications')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    post = models.ForeignKey('Reel', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    comment = models.TextField(blank=True)
    conversation_id = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.type} - {self.user.username}"

class Competition(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    prize = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Winner(models.Model):
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, related_name='winners')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wins')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='wins', null=True, blank=True)
    votes_received = models.IntegerField(default=0)
    prize_claimed = models.BooleanField(default=False)
    announced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-announced_at']

    def __str__(self):
        return f"{self.user.username} - {self.competition.title}"

class Report(models.Model):
    REPORT_TYPES = [
        ('inappropriate', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('copyright', 'Copyright Violation'),
        ('scam', 'Scam/Fraud'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewing', 'Under Review'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received', null=True, blank=True)
    reported_reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    resolution_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports_reviewed')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Report #{self.id} - {self.report_type} by {self.reported_by.username}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        participant_names = ', '.join([u.username for u in self.participants.all()[:2]])
        return f"Conversation: {participant_names}"
    
    def get_other_participant(self, user):
        """Get the other participant in a 1-on-1 conversation"""
        return self.participants.exclude(id=user.id).first()
    
    def get_last_message(self):
        """Get the most recent message in this conversation"""
        return self.messages.first()

class Message(models.Model):
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('reel', 'Reel'),
        ('file', 'File'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text')
    text = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Message from {self.sender.username} at {self.created_at}"

class MessageAttachment(models.Model):
    ATTACHMENT_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('file', 'File'),
    ]
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPES)
    file = models.FileField(upload_to='message_attachments/')
    thumbnail = models.ImageField(upload_to='message_thumbnails/', null=True, blank=True)
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.attachment_type} attachment for message {self.message.id}"

class SharedReel(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='shared_reels')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='shares')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Reel {self.reel.id} shared in message {self.message.id}"

class Call(models.Model):
    CALL_TYPES = [
        ('audio', 'Audio Call'),
        ('video', 'Video Call'),
    ]
    
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('ringing', 'Ringing'),
        ('ongoing', 'Ongoing'),
        ('ended', 'Ended'),
        ('missed', 'Missed'),
        ('declined', 'Declined'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='calls')
    caller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calls_made')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='calls_received')
    call_type = models.CharField(max_length=20, choices=CALL_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.call_type} call from {self.caller.username} to {self.receiver.username}"
