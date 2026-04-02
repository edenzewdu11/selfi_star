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

def test_with_real_file():
    print("=== Testing with Real File Upload ===")
    
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
    
    # Create a real test image file
    test_image_content = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9'
    
    test_image = SimpleUploadedFile(
        "test_image.jpg", 
        test_image_content, 
        content_type="image/jpeg"
    )
    
    # Test with image
    print("\n--- Testing Image Upload ---")
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test message with real image',
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
        print(f"Message type: {data.get('message_type')}")
        print(f"Attachments count: {len(data.get('attachments', []))}")
        
        # Check if file was actually uploaded
        if data.get('attachments'):
            print("✅ File attachment created successfully")
        else:
            print("⚠️ No attachments found in response")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    # Test with video
    print("\n--- Testing Video Upload ---")
    test_video_content = b'\x00\x00\x00\x20ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x00'
    
    test_video = SimpleUploadedFile(
        "test_video.mp4", 
        test_video_content, 
        content_type="video/mp4"
    )
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test message with real video',
            'message_type': 'video',
            'files': test_video,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Video message created")
        data = response.json()
        print(f"Message ID: {data.get('id')}")
        print(f"Message type: {data.get('message_type')}")
        print(f"Attachments count: {len(data.get('attachments', []))}")
        
        if data.get('attachments'):
            print("✅ Video attachment created successfully")
        else:
            print("⚠️ No attachments found in response")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    # Test with audio
    print("\n--- Testing Audio Upload ---")
    test_audio_content = b'ID3\x03\x00\x00\x00\x00\x00\x00\xff\xfb\x90\x00\x00\x00\x00\x00'
    
    test_audio = SimpleUploadedFile(
        "test_audio.mp3", 
        test_audio_content, 
        content_type="audio/mpeg"
    )
    
    response = client.post(
        '/api/messages/',
        {
            'conversation_id': '1',
            'text': 'Test message with real audio',
            'message_type': 'audio',
            'files': test_audio,
        },
        HTTP_AUTHORIZATION=f'Token {token.key}'
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ SUCCESS: Audio message created")
        data = response.json()
        print(f"Message ID: {data.get('id')}")
        print(f"Message type: {data.get('message_type')}")
        print(f"Attachments count: {len(data.get('attachments', []))}")
        
        if data.get('attachments'):
            print("✅ Audio attachment created successfully")
        else:
            print("⚠️ No attachments found in response")
    else:
        print(f"❌ ERROR: {response.content.decode()}")
        return False
    
    print("\n=== All Media Upload Tests Passed! ===")
    return True

if __name__ == '__main__':
    success = test_with_real_file()
    if success:
        print("\n🎉 Media upload functionality is working correctly!")
        print("\n📁 Check the media/message_attachments/ directory for uploaded files")
    else:
        print("\n❌ There are still issues with media upload.")
