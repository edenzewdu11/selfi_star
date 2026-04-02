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

def test_simple_upload():
    print("=== Simple Upload Test ===")
    
    client = Client()
    
    # Create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    # Get or create token
    token, _ = Token.objects.get_or_create(user=user)
    
    # Create a test conversation
    conversation, conv_created = Conversation.objects.get_or_create(id=1)
    if conv_created:
        conversation.participants.add(user)
        conversation.save()
    else:
        if not conversation.participants.filter(id=user.id).exists():
            conversation.participants.add(user)
            conversation.save()
    
    # Test 1: Text message only
    print("\n--- Test 1: Text message ---")
    response = client.post(
        '/api/messages/',
        data='{"conversation_id": 1, "text": "Simple test message", "message_type": "text"}',
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Text message created")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    # Test 2: Simple image upload
    print("\n--- Test 2: Simple image upload ---")
    test_image = SimpleUploadedFile("test.jpg", b"fake_image_data", content_type="image/jpeg")
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test with image',
            'message_type': 'image',
            'files': test_image,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Image message created")
        data = response.json()
        print(f"Message ID: {data.get('id')}")
        attachments = data.get('attachments', [])
        if attachments:
            print(f"✅ Attachment created: {attachments[0].get('file_name')}")
        else:
            print("⚠️ No attachments found")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    print("\n=== Tests Complete ===")
    return True

if __name__ == '__main__':
    success = test_simple_upload()
    if success:
        print("\n🎉 Upload functionality is working!")
    else:
        print("\n❌ Issues found.")
