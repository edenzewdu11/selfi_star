from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import UserProfile, Subscription, NotificationPreference, Notification, Follow, Reel, Comment, Message
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models_campaign import CampaignNotification
from django.utils import timezone

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        Subscription.objects.create(user=instance)
        NotificationPreference.objects.create(user=instance)
        Token.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

@receiver(post_save, sender=CampaignNotification)
def send_campaign_notification_websocket(sender, instance, created, **kwargs):
    """Send notification through WebSocket when CampaignNotification is created"""
    if created:
        # Create a general notification as well
        notification = Notification.objects.create(
            user=instance.user,
            type='campaign',
            message=instance.message,
            campaign=instance
        )
        
        send_websocket_notification(notification)

@receiver(post_save, sender=Follow)
def send_follow_notification(sender, instance, created, **kwargs):
    """Send notification when user follows someone"""
    if created:
        notification = Notification.objects.create(
            user=instance.following,  # The user being followed
            type='follow',
            message=f'{instance.follower.username} started following you',
            sender=instance.follower
        )
        send_websocket_notification(notification)

@receiver(post_save, sender=Message)
def send_message_notification(sender, instance, created, **kwargs):
    """Send notification when message is sent"""
    if created:
        # Get the other participant in the conversation
        other_participant = instance.conversation.participants.exclude(id=instance.sender.id).first()
        if other_participant:
            notification = Notification.objects.create(
                user=other_participant,
                type='message',
                message=f'New message from {instance.sender.username}',
                sender=instance.sender,
                conversation_id=instance.conversation.id
            )
            send_websocket_notification(notification)

@receiver(post_save, sender=Comment)
def send_comment_notification(sender, instance, created, **kwargs):
    """Send notification when someone comments on a reel"""
    if created:
        # Don't notify if user comments on their own reel
        if instance.reel.user != instance.user:
            notification = Notification.objects.create(
                user=instance.reel.user,
                type='comment',
                message=f'{instance.user.username} commented on your {instance.reel.media or "post"}',
                sender=instance.user,
                post=instance.reel,
                comment=instance.text
            )
            send_websocket_notification(notification)

def send_websocket_notification(notification):
    """Send notification through WebSocket"""
    channel_layer = get_channel_layer()
    
    # Prepare notification data
    notification_data = {
        'id': notification.id,
        'type': notification.type,
        'message': notification.message,
        'read': notification.read,
        'timestamp': notification.timestamp.isoformat(),
        'user': {
            'id': notification.sender.id if notification.sender else None,
            'username': notification.sender.username if notification.sender else None,
            'profile_photo': notification.sender.profile.profile_photo.url if notification.sender and notification.sender.profile.profile_photo else None
        } if notification.sender else None,
        'post': {
            'id': notification.post.id,
            'thumbnail': notification.post.image.url if notification.post.image else None
        } if notification.post else None,
        'comment': notification.comment,
        'conversation_id': notification.conversation_id,
        'campaign': {
            'id': notification.campaign.campaign.id if notification.campaign and notification.campaign.campaign else None,
            'title': notification.campaign.campaign.title if notification.campaign and notification.campaign.campaign else None
        } if notification.campaign else None
    }
    
    # Send to user's notification group
    group_name = f"notifications_{notification.user.id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'notification_message',
            'notification': notification_data
        }
    )
    
    print(f"📨 Sent WebSocket notification to user {notification.user.username}: {notification.type}")
