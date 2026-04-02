import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Message, Conversation

# Check if admin user exists and get their ID
admin_user = User.objects.filter(username='admin').first()
demo_user = User.objects.filter(email='demo@example.com').first()

print(f'Admin user ID: {admin_user.id if admin_user else "None"}')
print(f'Demo user ID: {demo_user.id if demo_user else "None"}')

# Check recent messages
recent_messages = Message.objects.all().order_by('-created_at')[:5]
for msg in recent_messages:
    print(f'Message {msg.id}: sender_id={msg.sender.id}, sender_username={msg.sender.username}, text={msg.text[:50]}')

# Check conversations involving demo user
demo_conversations = Conversation.objects.filter(participants=demo_user)
print(f'\nDemo user conversations: {demo_conversations.count()}')
for conv in demo_conversations:
    messages = conv.messages.all().order_by('-created_at')[:3]
    print(f'Conversation {conv.id}:')
    for msg in messages:
        print(f'  - {msg.sender.username}: {msg.text[:30]}')
