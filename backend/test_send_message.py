import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Conversation, Message

# Get demo user and another user
demo = User.objects.filter(email='demo@example.com').first()
other_user = User.objects.filter(username='eden11131000').first()

if not other_user:
    other_user = User.objects.exclude(id=demo.id).first()

print(f"Demo user: {demo.username} (ID: {demo.id})")
print(f"Other user: {other_user.username} (ID: {other_user.id})")

# Find or create conversation
conversation = Conversation.objects.filter(participants=demo).filter(participants=other_user).first()

if not conversation:
    conversation = Conversation.objects.create()
    conversation.participants.add(demo, other_user)
    print(f"\nCreated new conversation: {conversation.id}")
else:
    print(f"\nFound existing conversation: {conversation.id}")

# Create a test message
message = Message.objects.create(
    conversation=conversation,
    sender=demo,
    message_type='text',
    text='Test message from backend!'
)

print(f"\nCreated message: {message.id}")
print(f"Text: {message.text}")
print(f"Sender: {message.sender.username}")
print(f"Conversation: {message.conversation.id}")

# Check messages in conversation
messages = Message.objects.filter(conversation=conversation)
print(f"\nTotal messages in conversation: {messages.count()}")
for msg in messages:
    print(f"  - [{msg.sender.username}]: {msg.text}")
