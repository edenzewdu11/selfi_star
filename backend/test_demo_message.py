import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Conversation, Message

# Get demo user and admin user
demo_user = User.objects.get(email='demo@example.com')
admin_user = User.objects.get(username='admin')

print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")
print(f"Admin user: {admin_user.username} (ID: {admin_user.id})")

# Get demo user's token
demo_token = Token.objects.get(user=demo_user)
admin_token = Token.objects.get(user=admin_user)

print(f"Demo token: {demo_token.key}")
print(f"Admin token: {admin_token.key}")

# Check if there are any recent messages from admin that shouldn't be there
from django.utils import timezone
from datetime import timedelta

recent_time = timezone.now() - timedelta(minutes=30)
admin_recent_messages = Message.objects.filter(
    sender=admin_user,
    created_at__gte=recent_time
)

print(f"\nAdmin messages in last 30 minutes: {admin_recent_messages.count()}")
for msg in admin_recent_messages:
    print(f"  Message {msg.id}: '{msg.text}' in conversation {msg.conversation.id}")
    participants = list(msg.conversation.participants.all().values_list('username', flat=True))
    print(f"    Participants: {participants}")

# Check demo user's conversations
demo_conversations = Conversation.objects.filter(participants=demo_user)
print(f"\nDemo user conversations: {demo_conversations.count()}")

for conv in demo_conversations:
    recent_msgs = conv.messages.filter(created_at__gte=recent_time).order_by('-created_at')
    print(f"\nConversation {conv.id}:")
    for msg in recent_msgs:
        print(f"  {msg.sender.username}: {msg.text[:30]} ({msg.created_at.strftime('%H:%M:%S')})")

# Test creating a message as demo user
print(f"\n=== Testing message creation as demo user ===")
test_conv = demo_conversations.first()
if test_conv:
    test_msg = Message.objects.create(
        conversation=test_conv,
        sender=demo_user,
        text="Test message from demo user"
    )
    print(f"Created test message: {test_msg.id} by {test_msg.sender.username}")
    
    # Verify it wasn't changed
    if test_msg.sender.id != demo_user.id:
        print("🚨 ERROR: Message sender was changed!")
    else:
        print("✅ Message sender is correct")
    
    # Clean up
    test_msg.delete()
else:
    print("No conversation found for testing")
