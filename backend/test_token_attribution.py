import os
import django
from django.test import RequestFactory
from rest_framework.test import force_authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Conversation, Message, SharedReel, Reel
from django.contrib.auth.models import User
from api.views import MessageViewSet
from rest_framework.authtoken.models import Token

print("=== TOKEN ATTRIBUTION TEST ===")

# Get users
demo_user = User.objects.get(email='demo@example.com')
admin_user = User.objects.get(username='admin')
dere_user = User.objects.get(username='dere')

print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")
print(f"Admin user: {admin_user.username} (ID: {admin_user.id})")
print(f"Dere user: {dere_user.username} (ID: {dere_user.id})")

# Get conversation
conversation = Conversation.objects.filter(participants=demo_user).filter(participants=dere_user).first()
if not conversation:
    print("No conversation found between demo and dere")
    exit()

print(f"Conversation ID: {conversation.id}")

# Get a reel
reel = Reel.objects.first()
if not reel:
    print("No reels found")
    exit()

print(f"Using reel: {reel.id}")

# Create request factory
factory = RequestFactory()

# Test 1: Demo user sends message with demo token
print(f"\n=== TEST 1: DEMO USER WITH DEMO TOKEN ===")
demo_token = Token.objects.get(user=demo_user)

request = factory.post(f'/messages/', {
    'conversation_id': conversation.id,
    'text': f'Check out this reel from demo! http://localhost:5173/post/{reel.id}',
    'reel_id': reel.id,
    'message_type': 'text'
})

request.META['HTTP_AUTHORIZATION'] = f'Token {demo_token.key}'
request.user = demo_user

view = MessageViewSet.as_view({'post': 'create'})
response = view(request)

if response.status_code == 201:
    message_data = response.data
    print(f"✅ Message created successfully")
    print(f"Message ID: {message_data['id']}")
    print(f"Sender: {message_data['sender']['username']} (ID: {message_data['sender']['id']})")
    
    # Verify in database
    db_message = Message.objects.get(id=message_data['id'])
    print(f"DB sender: {db_message.sender.username} (ID: {db_message.sender.id})")
    
    if db_message.sender.id != demo_user.id:
        print(f"🚨 ERROR: Wrong sender in database!")
    else:
        print(f"✅ Correct sender in database")
else:
    print(f"❌ Failed to create message: {response.status_code}")

# Test 2: Demo user sends message but accidentally uses admin token
print(f"\n=== TEST 2: DEMO USER WITH ADMIN TOKEN (SIMULATED BUG) ===")
admin_token = Token.objects.get(user=admin_user)

request = factory.post(f'/messages/', {
    'conversation_id': conversation.id,
    'text': f'Check out this reel! http://localhost:5173/post/{reel.id}',
    'reel_id': reel.id,
    'message_type': 'text'
})

request.META['HTTP_AUTHORIZATION'] = f'Token {admin_token.key}'
request.user = admin_user  # This would be set by TokenAuthentication

view = MessageViewSet.as_view({'post': 'create'})
response = view(request)

if response.status_code == 201:
    message_data = response.data
    print(f"✅ Message created successfully")
    print(f"Message ID: {message_data['id']}")
    print(f"Sender: {message_data['sender']['username']} (ID: {message_data['sender']['id']})")
    
    # Verify in database
    db_message = Message.objects.get(id=message_data['id'])
    print(f"DB sender: {db_message.sender.username} (ID: {db_message.sender.id})")
    
    if db_message.sender.id != demo_user.id:
        print(f"🚨 ERROR: Message attributed to {db_message.sender.username} instead of demo!")
        print("This is likely the bug you're experiencing!")
    else:
        print(f"✅ Correct sender in database")
else:
    print(f"❌ Failed to create message: {response.status_code}")
