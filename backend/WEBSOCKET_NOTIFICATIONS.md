# WebSocket Notifications Implementation Guide

## Overview
The frontend notification system is designed to work with or without WebSocket support. It automatically falls back to polling if WebSocket is not available.

## WebSocket Endpoint
The frontend expects a WebSocket endpoint at: `ws://localhost:8000/ws/notifications/{user_id}/`

## Message Format
The WebSocket should send JSON messages in this format:

```json
{
  "id": 123,
  "type": "like|comment|follow|message|new_video|campaign",
  "message": "Notification message text",
  "user": {
    "id": 456,
    "username": "username",
    "profile_photo": "url_to_profile_photo"
  },
  "post": {
    "id": 789,
    "thumbnail": "url_to_post_thumbnail"
  },
  "reel": {
    "id": 789,
    "thumbnail": "url_to_reel_thumbnail"
  },
  "comment": "Optional comment text",
  "timestamp": "2024-01-01T12:00:00Z",
  "read": false,
  "notification_type": "specific_type",
  "campaign_id": null,
  "video_url": "url_to_video",
  "thumbnail_url": "url_to_thumbnail"
}
```

## Notification Types
- `like` - Someone liked user's post
- `comment` - Someone commented on user's post  
- `follow` - Someone started following the user
- `message` - New direct message
- `new_video` - User you follow posted a new video
- `campaign` - Campaign-related updates

## Django Channels Implementation Example

```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Notification

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.notification_group_name = f'notifications_{self.user_id}'
        
        # Join notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def send_notification(self, event):
        notification = event['notification']
        
        await self.send(text_data=json.dumps({
            'id': notification.id,
            'type': notification.type,
            'message': notification.message,
            'user': {
                'id': notification.user.id,
                'username': notification.user.username,
                'profile_photo': notification.user.profile_photo.url if notification.user.profile_photo else None
            },
            'post': {
                'id': notification.post.id,
                'thumbnail': notification.post.thumbnail.url if notification.post and notification.post.thumbnail else None
            } if notification.post else None,
            'reel': {
                'id': notification.reel.id,
                'thumbnail': notification.reel.thumbnail.url if notification.reel and notification.reel.thumbnail else None
            } if notification.reel else None,
            'comment': notification.comment,
            'timestamp': notification.timestamp.isoformat(),
            'read': notification.read,
            'notification_type': notification.notification_type,
            'campaign_id': notification.campaign_id,
            'video_url': notification.video_url,
            'thumbnail_url': notification.thumbnail_url
        }))

# routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_id>\d+)/$', consumers.NotificationConsumer.as_asgi()),
]

# How to send notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_notification(user_id, notification):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {
            'type': 'send_notification',
            'notification': notification
        }
    )
```

## Current Fallback Behavior
If WebSocket is not implemented, the frontend automatically:
1. Shows "Updating" status with orange indicator
2. Polls for new notifications every 30 seconds
3. Still provides full notification functionality

## Testing
You can test the WebSocket connection by:
1. Opening browser dev tools
2. Looking for WebSocket connection attempts
3. Checking console logs for connection status

The frontend will log:
- ✅ WebSocket connected for notifications
- 🔄 Starting polling for notifications (30-second intervals)  
- ❌ WebSocket setup failed, using polling

This ensures users always get notifications, even without WebSocket support.
