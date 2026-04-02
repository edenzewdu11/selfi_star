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

def test_message_upload():
    print("=== Testing Message Upload via HTTP ===")
    
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
    
    # Test 1: Text message
    print("\n--- Test 1: Text message ---")
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test text message',
            'message_type': 'text',
        },
        HTTP_AUTHORIZATION=f'Token {token.key}',
        content_type='application/json'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Text message created")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
    
    # Test 2: Message with image (multipart)
    print("\n--- Test 2: Message with image ---")
    with open('test_image.jpg', 'wb') as f:
        f.write(b'fake_image_data')
    
    with open('test_image.jpg', 'rb') as f:
        response = client.post(
            '/api/messages/',
            {
                'conversation_id': '1',
                'text': 'Test message with image',
                'message_type': 'image',
                'files': f,
            },
            HTTP_AUTHORIZATION=f'Token {token.key}',
            format='multipart'
        )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Image message created")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
    
    # Clean up
    if os.path.exists('test_image.jpg'):
        os.remove('test_image.jpg')
    
    print("\n=== Test Complete ===")

if __name__ == '__main__':
    test_message_upload()
