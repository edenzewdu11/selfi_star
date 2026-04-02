import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Conversation, Message, SharedReel, Reel
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("=== DEMO USER REEL SHARING TEST ===")

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

print(f"\nConversation ID: {conversation.id}")
print(f"Participants: {[p.username for p in conversation.participants.all()]}")

# Get a reel to share (let's use reel 53 which was mentioned in the admin-dere conversation)
try:
    reel = Reel.objects.get(id=53)
    print(f"Found reel to share: {reel.id} - {reel.caption}")
except Reel.DoesNotExist:
    print("Reel 53 not found, finding any reel...")
    reel = Reel.objects.first()
    if reel:
        print(f"Using reel: {reel.id} - {reel.caption}")
    else:
        print("No reels found")
        exit()

# Simulate creating a message as demo user with a shared reel
print(f"\n=== SIMULATING DEMO USER SHARING REEL ===")

# Get demo user's token
demo_token = Token.objects.get(user=demo_user)
print(f"Demo user token: {demo_token.key[:10]}...")

# Create a message as demo user
message_text = f"Check out this amazing reel! http://localhost:5173/post/{reel.id}"
message = Message.objects.create(
    conversation=conversation,
    sender=demo_user,  # This should be demo user
    message_type='text',
    text=message_text
)

print(f"Created message: {message.id}")
print(f"Message sender: {message.sender.username} (ID: {message.sender.id})")

# Create the shared reel association
SharedReel.objects.create(message=message, reel=reel)
print(f"Created shared reel association")

# Verify the message
message.refresh_from_db()
print(f"\n=== VERIFICATION ===")
print(f"Message ID: {message.id}")
print(f"Message sender: {message.sender.username} (ID: {message.sender.id})")
print(f"Message text: {message.text}")
print(f"Shared reels: {message.shared_reels.count()}")
for shared_reel in message.shared_reels.all():
    print(f"  - Reel {shared_reel.reel.id}: {shared_reel.reel.caption}")

# Check if the sender was somehow changed
if message.sender.id != demo_user.id:
    print(f"🚨 ERROR: Message sender was changed!")
    print(f"Expected: {demo_user.id} ({demo_user.username})")
    print(f"Got: {message.sender.id} ({message.sender.username})")
else:
    print(f"✅ Message sender is correct: {demo_user.username}")
