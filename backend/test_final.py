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

def test_message_upload():
    print("=== Final Message Upload Test ===")
    
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
    print(f"Using token: {token.key}")
    
    # Create a test conversation
    conversation, conv_created = Conversation.objects.get_or_create(id=1)
    if conv_created:
        conversation.participants.add(user)
        conversation.save()
        print("Created new conversation")
    else:
        if not conversation.participants.filter(id=user.id).exists():
            conversation.participants.add(user)
            conversation.save()
        print("Using existing conversation")
    
    # Test 1: Text message
    print("\n--- Test 1: Text message ---")
    response = client.post(
        '/api/messages/',
        data='{"conversation_id": 1, "text": "Test text message", "message_type": "text"}',
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Text message created")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    # Test 2: Message with image
    print("\n--- Test 2: Message with image ---")
    test_image = SimpleUploadedFile("test_image.jpg", b"fake_image_data", content_type="image/jpeg")
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test message with image',
            'message_type': 'image',
            'files': test_image,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Image message created")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    # Test 3: Message with video
    print("\n--- Test 3: Message with video ---")
    test_video = SimpleUploadedFile("test_video.mp4", b"fake_video_data", content_type="video/mp4")
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test message with video',
            'message_type': 'video',
            'files': test_video,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Video message created")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    # Test 4: Message with audio
    print("\n--- Test 4: Message with audio ---")
    test_audio = SimpleUploadedFile("test_audio.mp3", b"fake_audio_data", content_type="audio/mpeg")
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test message with audio',
            'message_type': 'audio',
            'files': test_audio,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Audio message created")
        print(f"Response: {response.json()}")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    print("\n=== All Tests Passed! ===")
    return True

if __name__ == '__main__':
    success = test_message_upload()
    if success:
        print("\n🎉 Media upload functionality is working correctly!")
    else:
        print("\n❌ There are still issues with media upload.")
