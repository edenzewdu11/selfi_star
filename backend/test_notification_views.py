import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Notification
from api.views import mark_notification_as_read, mark_all_notifications_as_read, delete_notification
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

# Get demo user
demo = User.objects.filter(username='demo').first()
if demo:
    print(f'Testing notification endpoints with user: {demo.username}')
    
    # Create a fake request
    factory = APIRequestFactory()
    
    # Get demo's notifications
    notifications = Notification.objects.filter(user=demo)
    print(f'Found {notifications.count()} notifications')
    
    # Test mark_notification_as_read view
    if notifications.exists():
        notif = notifications.first()
        print(f'\nTesting mark_notification_as_read for notification {notif.id}')
        
        # Create POST request
        request = factory.post(f'/api/notifications/{notif.id}/read/')
        request.user = demo
        
        # Call the view function
        try:
            response = mark_notification_as_read(request, notif.id)
            print(f'✅ mark_notification_as_read: {response.status_code} - {response.data}')
        except Exception as e:
            print(f'❌ mark_notification_as_read error: {e}')
    
    # Test mark_all_notifications_as_read view
    print(f'\nTesting mark_all_notifications_as_read')
    request = factory.post('/api/notifications/mark_all_read/')
    request.user = demo
    
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
        request.user = demo
        
        try:
            response = delete_notification(request, notif.id)
            print(f'✅ delete_notification: {response.status_code} - {response.data}')
        except Exception as e:
            print(f'❌ delete_notification error: {e}')

else:
    print('Demo user not found')
