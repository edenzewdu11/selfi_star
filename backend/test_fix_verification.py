import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Conversation, Message, SharedReel, Reel
from django.contrib.auth.models import User

print("=== FIX VERIFICATION TEST ===")

# Get users
demo_user = User.objects.get(email='demo@example.com')
admin_user = User.objects.get(username='admin')
dere_user = User.objects.get(username='dere')

print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")
print(f"Admin user: {admin_user.username} (ID: {admin_user.id})")
print(f"Dere user: {dere_user.username} (ID: {dere_user.id})")

# Check all conversations for messages with shared reels
print(f"\n=== CHECKING ALL CONVERSATIONS FOR REEL SHARES ===")

for conversation in Conversation.objects.all():
    participants = [p.username for p in conversation.participants.all()]
    messages_with_reels = Message.objects.filter(
        conversation=conversation,
        shared_reels__isnull=False
    ).distinct()
    
    if messages_with_reels.exists():
        print(f"\nConversation {conversation.id}: {participants}")
        for msg in messages_with_reels:
            print(f"  Message {msg.id}: [{msg.sender.username}] {msg.text}")
            print(f"  Created: {msg.created_at}")
            
            # Check if this is the problematic case (demo sharing but showing as admin)
            if msg.sender.username == 'admin' and 'demo' in participants:
                print(f"  🚨 POTENTIAL ISSUE: Admin message in conversation with demo user")
                print(f"  📝 This might be the bug you're experiencing!")
            elif msg.sender.username == 'demo' and 'admin' in participants:
                print(f"  ✅ GOOD: Demo user message correctly attributed")
            elif msg.sender.username == 'admin' and 'admin' in participants:
                print(f"  ℹ️  NORMAL: Admin message in admin conversation")

print(f"\n=== SUMMARY ===")
print("If you see '🚨 POTENTIAL ISSUE' above, that indicates the bug.")
print("If you see '✅ GOOD' above, that indicates correct attribution.")
print("The frontend fixes should prevent new occurrences of this issue.")
