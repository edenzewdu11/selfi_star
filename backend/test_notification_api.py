import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

# Get demo user and token
demo = User.objects.filter(username='demo').first()
if demo:
    # Get or create token for demo
    token, created = Token.objects.get_or_create(user=demo)
    print(f'Demo user token: {token.key[:10]}...')
    
    # Create authenticated client
    client = Client()
    client.defaults['HTTP_AUTHORIZATION'] = f'Token {token.key}'
    
    # Test get notifications
    print('\n🔍 Testing GET /api/notifications/list/')
    response = client.get('/api/notifications/list/')
    print(f'Status: {response.status_code}')
    data = None
    if response.status_code == 200:
        data = response.json()
        print(f'Found {len(data)} notifications')
        for notif in data[:2]:
            print(f'  {notif["type"]}: {notif["message"][:30]}... (read: {notif["read"]})')
    
    # Test mark notification as read
    if data:
        notif_id = data[0]['id']
        print(f'\n📝 Testing POST /api/notifications/{notif_id}/read/')
        response = client.post(f'/api/notifications/{notif_id}/read/')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            print('✅ Notification marked as read successfully')
        else:
            print(f'❌ Error: {response.content.decode()}')
    
    # Test mark all as read
    print(f'\n📝 Testing POST /api/notifications/mark_all_read/')
    response = client.post('/api/notifications/mark_all_read/')
    print(f'Status: {response.status_code}')
    if response.status_code == 200:
        print('✅ All notifications marked as read successfully')
        print(f'Response: {response.json()}')
    else:
        print(f'❌ Error: {response.content.decode()}')
    
    # Test delete notification
    if data:
        notif_id = data[0]['id']
        print(f'\n🗑️ Testing DELETE /api/notifications/{notif_id}/')
        response = client.delete(f'/api/notifications/{notif_id}/')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            print('✅ Notification deleted successfully')
        else:
            print(f'❌ Error: {response.content.decode()}')

else:
    print('Demo user not found')
