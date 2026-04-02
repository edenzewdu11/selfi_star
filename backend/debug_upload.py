#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from api.models import Conversation
from rest_framework.authtoken.models import Token
from django.core.files.uploadedfile import SimpleUploadedFile
import json

def debug_upload():
    print("=== DEBUG UPLOAD ===")
    
    # Check if the user exists and get token
    try:
        user = User.objects.get(username='testuser')
        token = Token.objects.get(user=user)
        print(f"✅ User found: {user.username}")
        print(f"✅ Token: {token.key}")
    except User.DoesNotExist:
        print("❌ User not found")
        return
    except Token.DoesNotExist:
        print("❌ Token not found")
        return
    
    # Check conversation
    try:
        conversation = Conversation.objects.get(id=1)
        if conversation.participants.filter(id=user.id).exists():
            print(f"✅ Conversation found: {conversation.id}")
        else:
            print("❌ User not in conversation")
            return
    except Conversation.DoesNotExist:
        print("❌ Conversation not found")
        return
    
    # Test with Django client (similar to frontend)
    client = Client()
    
    # Test 1: Simple text message
    print("\n--- Test 1: Text Message ---")
    response = client.post(
        '/api/messages/',
        data='{"conversation_id": 1, "text": "Debug test message", "message_type": "text"}',
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ Text message works")
    else:
        print(f"❌ Text message failed: {response.content.decode()}")
    
    # Test 2: File upload (mimic frontend)
    print("\n--- Test 2: File Upload ---")
    test_file = SimpleUploadedFile("debug.jpg", b"debug_image_data", content_type="image/jpeg")
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Debug file upload',
            'message_type': 'image',
            'files': test_file,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ File upload works")
        data = response.json()
        print(f"Message ID: {data.get('id')}")
        attachments = data.get('attachments', [])
        if attachments:
            print(f"✅ File attached: {attachments[0].get('file_name')}")
        else:
            print("⚠️ No attachment found")
    else:
        print(f"❌ File upload failed: {response.content.decode()}")
    
    print("\n=== DEBUG COMPLETE ===")

if __name__ == '__main__':
    debug_upload()
