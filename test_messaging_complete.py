#!/usr/bin/env python
import os
import django
import time
import json
import requests

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from api.models import Conversation, Message

print("=== COMPLETE MESSAGING SYSTEM TEST ===")
print()

# API configuration
API_BASE = 'http://localhost:8000/api'

# Get users and tokens
demo_user = User.objects.get(username='demo')
dere_user = User.objects.get(username='dere')
demo_token = Token.objects.get(user=demo_user)
dere_token = Token.objects.get(user=dere_user)

print(f"Demo: {demo_user.username} (ID: {demo_user.id})")
print(f"Dere: {dere_user.username} (ID: {dere_user.id})")
print(f"Demo token: {demo_token.key}")
print(f"Dere token: {dere_token.key}")
print()

# Get conversation
conversation = Conversation.objects.filter(participants=demo_user).filter(participants=dere_user).first()
print(f"Conversation ID: {conversation.id}")
print()

def make_api_request(endpoint, token, method='GET', data=None):
    """Make API request with authentication"""
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    url = f'{API_BASE}{endpoint}'
    
    if method == 'GET':
        response = requests.get(url, headers=headers)
    elif method == 'POST':
        response = requests.post(url, headers=headers, json=data)
    else:
        raise ValueError(f"Unsupported method: {method}")
    
    return response

print("1. Testing API Authentication...")
# Test demo authentication
demo_profile_response = make_api_request('/profile/me/', demo_token.key)
if demo_profile_response.ok:
    demo_profile = demo_profile_response.json()
    print(f"✅ Demo auth successful: {demo_profile['username']}")
else:
    print(f"❌ Demo auth failed: {demo_profile_response.status_code}")

# Test dere authentication  
dere_profile_response = make_api_request('/profile/me/', dere_token.key)
if dere_profile_response.ok:
    dere_profile = dere_profile_response.json()
    print(f"✅ Dere auth successful: {dere_profile['username']}")
else:
    print(f"❌ Dere auth failed: {dere_profile_response.status_code}")
print()

print("2. Testing Conversations API...")
# Test conversations for demo
demo_conv_response = make_api_request('/conversations/', demo_token.key)
if demo_conv_response.ok:
    demo_conversations = demo_conv_response.json()
    print(f"✅ Demo conversations: {len(demo_conversations)}")
    
    # Find demo-dere conversation
    demo_dere_conv = None
    for conv in demo_conversations:
        participants = [p['username'] for p in conv['participants']]
        if 'demo' in participants and 'dere' in participants:
            demo_dere_conv = conv
            break
    
    if demo_dere_conv:
        print(f"✅ Found demo-dere conversation: {demo_dere_conv['id']}")
    else:
        print("❌ Demo-dere conversation not found")
else:
    print(f"❌ Demo conversations failed: {demo_conv_response.status_code}")
print()

print("3. Testing Messages API...")
if demo_dere_conv:
    # Test messages for demo
    demo_msg_response = make_api_request(f"/messages/?conversation={demo_dere_conv['id']}", demo_token.key)
    if demo_msg_response.ok:
        demo_messages = demo_msg_response.json()
        print(f"✅ Demo can see {len(demo_messages)} messages")
        
        # Show last few messages
        for msg in demo_messages[-3:]:
            print(f"   {msg['sender']['username']}: '{msg['text']}' ({msg['created_at']})")
    else:
        print(f"❌ Demo messages failed: {demo_msg_response.status_code}")
    
    # Test messages for dere
    dere_msg_response = make_api_request(f"/messages/?conversation={demo_dere_conv['id']}", dere_token.key)
    if dere_msg_response.ok:
        dere_messages = dere_msg_response.json()
        print(f"✅ Dere can see {len(dere_messages)} messages")
        
        # Show last few messages
        for msg in dere_messages[-3:]:
            print(f"   {msg['sender']['username']}: '{msg['text']}' ({msg['created_at']})")
    else:
        print(f"❌ Dere messages failed: {dere_msg_response.status_code}")
print()

print("4. Testing Message Sending...")
if demo_dere_conv:
    # Send message from demo to dere
    message_data = {
        'conversation_id': demo_dere_conv['id'],
        'text': f'API test message from demo at {time.strftime("%H:%M:%S")}',
        'message_type': 'text'
    }
    
    send_response = make_api_request('/messages/', demo_token.key, 'POST', message_data)
    if send_response.ok:
        sent_message = send_response.json()
        print(f"✅ Message sent successfully: {sent_message['id']}")
        print(f"   Sender: {sent_message['sender']['username']}")
        print(f"   Text: '{sent_message['text']}'")
        print(f"   Conversation: {sent_message['conversation']}")
    else:
        print(f"❌ Send failed: {send_response.status_code}")
        print(f"   Error: {send_response.text}")
print()

print("5. Verifying Message Reception...")
if demo_dere_conv:
    # Wait a moment for message to be processed
    time.sleep(1)
    
    # Check if dere can see the new message
    dere_msg_response = make_api_request(f"/messages/?conversation={demo_dere_conv['id']}", dere_token.key)
    if dere_msg_response.ok:
        dere_messages = dere_msg_response.json()
        print(f"✅ Dere can now see {len(dere_messages)} messages")
        
        # Find the newest message
        if dere_messages:
            newest_msg = dere_messages[-1]
            print(f"   Newest message: {newest_msg['sender']['username']} -> '{newest_msg['text']}'")
            
            if newest_msg['sender']['username'] == 'demo':
                print("✅ SUCCESS: Dere received demo's message!")
            else:
                print("❌ ISSUE: Newest message is not from demo")
    else:
        print(f"❌ Dere messages failed: {dere_msg_response.status_code}")
print()

print("6. Database Verification...")
# Check database directly
db_messages = Message.objects.filter(conversation=conversation).order_by('-created_at')
print(f"Database shows {db_messages.count()} messages in conversation")

if db_messages.exists():
    latest_msg = db_messages.first()
    print(f"Latest message in DB: {latest_msg.sender.username} -> '{latest_msg.text}'")
print()

print("=== TEST COMPLETE ===")
print()
print("🎯 NEXT STEPS:")
print("1. If all API tests pass, the backend is working correctly")
print("2. Open the frontend debug tool: http://localhost:5173/debug_frontend_messaging.html")
print("3. Test the messaging in the actual app")
print("4. Check browser console for JavaScript errors")
print("5. Verify localStorage tokens are correct")
print()
print("🔍 If messages work in API but not in frontend:")
print("- Check browser network requests")
print("- Verify polling frequency (should be every 3 seconds)")
print("- Check for JavaScript errors in console")
print("- Use the refresh button in chat header")
