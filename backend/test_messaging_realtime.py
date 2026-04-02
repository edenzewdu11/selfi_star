#!/usr/bin/env python
import os
import django
import time
import json

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Conversation, Message

print("=== REAL-TIME MESSAGING TEST ===")
print()

# Get demo and dere users
demo_user = User.objects.get(username='demo')
dere_user = User.objects.get(username='dere')

print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")
print(f"Dere user: {dere_user.username} (ID: {dere_user.id})")
print()

# Get their conversation
conversation = Conversation.objects.filter(participants=demo_user).filter(participants=dere_user).first()
if not conversation:
    print("❌ No conversation found between demo and dere")
    exit(1)

print(f"Conversation ID: {conversation.id}")
print()

# Check existing messages
existing_messages = Message.objects.filter(conversation=conversation).order_by('-created_at')
print(f"Existing messages: {existing_messages.count()}")

for msg in existing_messages[:3]:
    print(f"  {msg.sender.username}: '{msg.text}' ({msg.created_at})")
print()

# Simulate sending a message from demo to dere
print("📤 Simulating message from demo to dere...")
new_message = Message.objects.create(
    conversation=conversation,
    sender=demo_user,
    text=f"Test message from demo at {time.strftime('%H:%M:%S')}",
    message_type='text'
)

print(f"✅ Message created: ID {new_message.id}")
print(f"  Sender: {new_message.sender.username}")
print(f"  Text: '{new_message.text}'")
print(f"  Conversation: {new_message.conversation.id}")
print(f"  Created: {new_message.created_at}")
print()

# Update conversation timestamp
conversation.updated_at = new_message.created_at
conversation.save()
print("✅ Conversation updated")
print()

# Now check what dere should see
print("📨 Checking messages from dere's perspective...")
dere_messages = Message.objects.filter(
    conversation=conversation,
    conversation__participants=dere_user
).order_by('created_at')

print(f"Dere can see {dere_messages.count()} messages:")
for msg in dere_messages:
    print(f"  {msg.sender.username}: '{msg.text}' ({msg.created_at})")
print()

# Check what demo should see
print("📨 Checking messages from demo's perspective...")
demo_messages = Message.objects.filter(
    conversation=conversation,
    conversation__participants=demo_user
).order_by('created_at')

print(f"Demo can see {demo_messages.count()} messages:")
for msg in demo_messages:
    print(f"  {msg.sender.username}: '{msg.text}' ({msg.created_at})")
print()

# Test API endpoints
print("🔍 Testing API endpoints...")
print()

# Test conversation endpoint
print("1. Testing /api/conversations/ endpoint:")
all_conversations = Conversation.objects.filter(participants=demo_user)
print(f"   Demo conversations: {all_conversations.count()}")
for conv in all_conversations:
    participants = ', '.join([p.username for p in conv.participants.all()])
    print(f"   - Conversation {conv.id}: {participants}")
print()

# Test messages endpoint
print("2. Testing /api/messages/?conversation=X endpoint:")
messages_for_demo = Message.objects.filter(
    conversation=conversation,
    conversation__participants=demo_user
).order_by('-created_at')
print(f"   Messages for demo: {messages_for_demo.count()}")
for msg in messages_for_demo[:3]:
    print(f"   - Message {msg.id}: {msg.sender.username} -> '{msg.text}'")
print()

# Check authentication tokens
print("3. Authentication tokens:")
demo_token = Token.objects.get(user=demo_user)
dere_token = Token.objects.get(user=dere_user)
print(f"   Demo token: {demo_token.key}")
print(f"   Dere token: {dere_token.key}")
print()

print("=== TEST COMPLETE ===")
print()
print("🔍 If you're seeing this message in the database but not in the frontend:")
print("1. Check browser console for JavaScript errors")
print("2. Verify the frontend is polling the correct conversation ID")
print("3. Check network requests in browser dev tools")
print("4. Ensure authentication tokens are correct in localStorage")
print("5. Test the API endpoints directly with curl or Postman")
