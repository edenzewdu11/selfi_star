import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Notification
from rest_framework.authtoken.models import Token
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views import mark_notification_as_read, mark_all_notifications_as_read, delete_notification

# Get demo user and token
demo = User.objects.filter(username='demo').first()
if demo:
    # Get or create token for demo
    token, created = Token.objects.get_or_create(user=demo)
    print(f'Testing with user: {demo.username}, token: {token.key[:10]}...')
    
    # Create a fake request
    factory = APIRequestFactory()
    
    # Get demo's notifications
    notifications = Notification.objects.filter(user=demo)
    print(f'Found {notifications.count()} notifications')
    
    # Test mark_notification_as_read view
    if notifications.exists():
        notif = notifications.first()
        print(f'\nTesting mark_notification_as_read for notification {notif.id}')
        
        # Create POST request with authentication
        request = factory.post(f'/api/notifications/{notif.id}/read/')
        force_authenticate(request, user=demo, token=token)
        
        try:
            response = mark_notification_as_read(request, notif.id)
            print(f'✅ mark_notification_as_read: {response.status_code} - {response.data}')
        except Exception as e:
            print(f'❌ mark_notification_as_read error: {e}')
    
    # Test mark_all_notifications_as_read view
    print(f'\nTesting mark_all_notifications_as_read')
    request = factory.post('/api/notifications/mark_all_read/')
    force_authenticate(request, user=demo, token=token)
    
    try:
        response = mark_all_notifications_as_read(request)
        print(f'✅ mark_all_notifications_as_read: {response.status_code} - {response.data}')
    except Exception as e:
        print(f'❌ mark_all_notifications_as_read error: {e}')
    
    # Test delete_notification view
    if notifications.exists():
        notif = notifications.last()  # Use a different notification to delete
        print(f'\nTesting delete_notification for notification {notif.id}')
        
        request = factory.delete(f'/api/notifications/{notif.id}/')
        force_authenticate(request, user=demo, token=token)
        
        try:
            response = delete_notification(request, notif.id)
            print(f'✅ delete_notification: {response.status_code} - {response.data}')
        except Exception as e:
            print(f'❌ delete_notification error: {e}')

else:
    print('Demo user not found')
