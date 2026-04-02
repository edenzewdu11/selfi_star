#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Conversation, Message

print("=== MESSAGING SYSTEM DEBUG ===")
print()

# Check users
print("1. USERS IN DATABASE:")
demo_user = None
dere_user = None

for user in User.objects.all():
    print(f"   ID: {user.id}, Username: {user.username}, Email: {user.email}")
    if user.username == 'demo':
        demo_user = user
    elif user.username == 'dere':
        dere_user = user

print()

# Check conversations between demo and dere
print("2. CONVERSATIONS BETWEEN DEMO AND DERE:")
if demo_user and dere_user:
    conversations = Conversation.objects.filter(participants=demo_user).filter(participants=dere_user)
    print(f"   Found {conversations.count()} conversation(s)")
    
    for conv in conversations:
        print(f"   Conversation ID: {conv.id}")
        print(f"   Participants: {[p.username for p in conv.participants.all()]}")
        print(f"   Created: {conv.created_at}")
        print(f"   Updated: {conv.updated_at}")
        
        # Check messages in this conversation
        messages = Message.objects.filter(conversation=conv).order_by('created_at')
        print(f"   Messages: {messages.count()}")
        
        for msg in messages:
            print(f"     Message ID: {msg.id}")
            print(f"     Sender: {msg.sender.username}")
            print(f"     Text: '{msg.text}'")
            print(f"     Type: {msg.message_type}")
            print(f"     Created: {msg.created_at}")
            print()
else:
    print("   ❌ Demo or Dere user not found")
    if not demo_user:
        print("   Demo user not found")
    if not dere_user:
        print("   Dere user not found")

print()

# Check all messages from demo and dere
print("3. ALL MESSAGES FROM DEMO AND DERE:")
all_messages = Message.objects.filter(sender__in=[demo_user, dere_user]).order_by('-created_at') if demo_user and dere_user else Message.objects.none()

print(f"   Total messages: {all_messages.count()}")

for msg in all_messages[:10]:  # Show last 10 messages
    print(f"   Message ID: {msg.id}")
    print(f"   Sender: {msg.sender.username} (ID: {msg.sender.id})")
    print(f"   Conversation: {msg.conversation.id}")
    print(f"   Participants: {[p.username for p in msg.conversation.participants.all()]}")
    print(f"   Text: '{msg.text}'")
    print(f"   Type: {msg.message_type}")
    print(f"   Created: {msg.created_at}")
    print()

# Check for any orphaned messages or conversations
print("4. SYSTEM HEALTH CHECK:")
total_conversations = Conversation.objects.count()
total_messages = Message.objects.count()
print(f"   Total conversations: {total_conversations}")
print(f"   Total messages: {total_messages}")

# Check for messages without proper conversations
orphaned_messages = Message.objects.filter(conversation__participants__isnull=True)
if orphaned_messages.exists():
    print(f"   ⚠️ Found {orphaned_messages.count()} orphaned messages")
else:
    print("   ✅ No orphaned messages found")

# Check authentication tokens
print("5. AUTHENTICATION TOKENS:")
for user in [demo_user, dere_user]:
    if user:
        try:
            token = Token.objects.get(user=user)
            print(f"   {user.username}: {token.key[:10]}...")
        except Token.DoesNotExist:
            print(f"   {user.username}: No token")

print()
print("=== DEBUG COMPLETE ===")
print()

if demo_user and dere_user:
    print("RECOMMENDATIONS:")
    print("1. If no conversation exists between demo and dere, create one")
    print("2. If messages exist but aren't showing, check frontend polling")
    print("3. Verify both users have valid authentication tokens")
    print("4. Check browser console for JavaScript errors")
    print("5. Verify WebSocket connections are working")
else:
    print("❌ Cannot proceed - demo and/or dere users not found")
    print("Please create these users first:")
    print("- Demo: demo@example.com / demo12345")
    print("- Dere: dere@gmail.com / (any password)")
