import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Conversation, Message, SharedReel, Reel
from django.contrib.auth.models import User

print("=== ADMIN-DERE CONVERSATION TEST ===")

# Get users
admin_user = User.objects.get(username='admin')
dere_user = User.objects.get(username='dere')
demo_user = User.objects.get(email='demo@example.com')

print(f"Admin user: {admin_user.username} (ID: {admin_user.id})")
print(f"Dere user: {dere_user.username} (ID: {dere_user.id})")
print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")

# Get admin-dere conversation
conversation = Conversation.objects.filter(participants=admin_user).filter(participants=dere_user).first()
if not conversation:
    print("No conversation found between admin and dere")
    exit()

print(f"\nConversation ID: {conversation.id}")
print(f"Participants: {[p.username for p in conversation.participants.all()]}")

# Check all messages in this conversation
print(f"\nAll messages in conversation {conversation.id}:")
messages = Message.objects.filter(conversation=conversation).order_by('-created_at')
for msg in messages:
    print(f"  Message {msg.id}: [{msg.sender.username}] {msg.text}")
    print(f"    Created: {msg.created_at}")
    print(f"    Has shared_reels: {msg.shared_reels.exists()}")
    if msg.shared_reels.exists():
        for shared_reel in msg.shared_reels.all():
            print(f"    Shared reel: {shared_reel.reel.id} - {shared_reel.reel.caption}")
    print()
