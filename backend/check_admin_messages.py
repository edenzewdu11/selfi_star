import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Message, Conversation

# Get admin user
admin_user = User.objects.filter(username='admin').first()
print(f'Admin user: {admin_user.username} (ID: {admin_user.id})')

# Check all messages sent by admin in the last 10 minutes
from datetime import datetime, timedelta
recent_time = datetime.now() - timedelta(minutes=10)

admin_messages = Message.objects.filter(
    sender=admin_user,
    created_at__gte=recent_time
).order_by('-created_at')

print(f'\nAdmin messages in last 10 minutes: {admin_messages.count()}')
for msg in admin_messages:
    print(f'Message {msg.id}: Conversation {msg.conversation.id}, "{msg.text}" at {msg.created_at}')
    
    # Check all participants in this conversation
    participants = msg.conversation.participants.all()
    participant_names = [p.username for p in participants]
    print(f'  Conversation participants: {participant_names}')

# Check if there's any broadcast logic
print(f'\nChecking for any platform-wide messages...')
all_recent_messages = Message.objects.filter(created_at__gte=recent_time).order_by('-created_at')
print(f'Total messages in last 10 minutes: {all_recent_messages.count()}')

for msg in all_recent_messages:
    participants = msg.conversation.participants.all()
    participant_names = [p.username for p in participants]
    print(f'Message {msg.id}: {msg.sender.username} -> {participant_names}: "{msg.text[:30]}..."')
