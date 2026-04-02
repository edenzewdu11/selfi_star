import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Notification
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

# Get demo user
demo = User.objects.filter(username='demo').first()
if demo:
    print(f'Testing with user: {demo.username} (ID: {demo.id})')
    
    # Get demo's notifications
    notifications = Notification.objects.filter(user=demo)
    print(f'Found {notifications.count()} notifications for demo')
    
    for notif in notifications:
        print(f'  Notification {notif.id}: {notif.type} - "{notif.message}" (read: {notif.read})')
        
        # Test marking as read
        if not notif.read:
            print(f'  → Marking notification {notif.id} as read...')
            notif.read = True
            notif.save()
            print(f'  ✓ Notification {notif.id} marked as read')
        else:
            print(f'  → Notification {notif.id} already read')
    
    # Test marking all as read
    print(f'\nTesting mark all as read...')
    unread_count = Notification.objects.filter(user=demo, read=False).count()
    print(f'Unread notifications before: {unread_count}')
    
    updated = Notification.objects.filter(user=demo, read=False).update(read=True)
    print(f'Updated {updated} notifications to read')
    
    # Check final state
    final_unread = Notification.objects.filter(user=demo, read=False).count()
    print(f'Unread notifications after: {final_unread}')
    
else:
    print('Demo user not found')
