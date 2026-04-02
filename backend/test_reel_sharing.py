import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Conversation, Message, SharedReel, Reel
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("=== REEL SHARING TEST ===")

# Get users
demo_user = User.objects.get(email='demo@example.com')
admin_user = User.objects.get(username='admin')
dere_user = User.objects.get(username='dere')

print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")
print(f"Admin user: {admin_user.username} (ID: {admin_user.id})")
print(f"Dere user: {dere_user.username} (ID: {dere_user.id})")

# Get demo-dere conversation
conversation = Conversation.objects.filter(participants=demo_user).filter(participants=dere_user).first()
if not conversation:
    print("No conversation found between demo and dere")
    exit()

print(f"Conversation ID: {conversation.id}")
print(f"Participants: {[p.username for p in conversation.participants.all()]}")

# Check for existing messages with shared reels
messages_with_reels = Message.objects.filter(
    conversation=conversation,
    shared_reels__isnull=False
).distinct()

print(f"\nMessages with shared reels in conversation {conversation.id}:")
for msg in messages_with_reels:
    print(f"  Message {msg.id}: [{msg.sender.username}] {msg.text}")
    for shared_reel in msg.shared_reels.all():
        print(f"    Shared reel: {shared_reel.reel.id} - {shared_reel.reel.caption}")

# Check all recent messages
print(f"\nAll recent messages in conversation {conversation.id}:")
recent_messages = Message.objects.filter(conversation=conversation).order_by('-created_at')[:10]
for msg in recent_messages:
    print(f"  [{msg.sender.username}]: {msg.text}")

# Check if there's any message that looks like a reel share but has wrong sender
reel_share_messages = Message.objects.filter(
    conversation=conversation,
    text__contains="reel!"
).order_by('-created_at')

print(f"\nReel share messages:")
for msg in reel_share_messages:
    print(f"  Message {msg.id}: [{msg.sender.username}] {msg.text}")
    print(f"  Created: {msg.created_at}")
    print(f"  Has shared_reels: {msg.shared_reels.exists()}")
