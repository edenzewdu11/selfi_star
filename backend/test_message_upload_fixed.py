#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APITestCase
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import User
from api.models import Conversation, Message
from api.serializers import MessageSerializer
from django.core.files.uploadedfile import SimpleUploadedFile

def test_message_upload():
    print("=== Testing Fixed Message Upload ===")
    
    # Create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    # Create a test conversation
    conversation, conv_created = Conversation.objects.get_or_create(id=1)
    if conv_created:
        conversation.participants.add(user)
        conversation.save()
    
    # Create mock files
    test_image = SimpleUploadedFile(
        "test_image.jpg", 
        b"fake_image_data", 
        content_type="image/jpeg"
    )
    
    test_video = SimpleUploadedFile(
        "test_video.mp4", 
        b"fake_video_data", 
        content_type="video/mp4"
    )
    
    test_audio = SimpleUploadedFile(
        "test_audio.mp3", 
        b"fake_audio_data", 
        content_type="audio/mpeg"
    )
    
    # Create request factory
    factory = APIRequestFactory()
    
    # Test 1: Text message only
    print("\n--- Test 1: Text message only ---")
    request = factory.post(
        '/api/messages/',
        {
            'conversation_id': 1,
            'text': 'Test text message',
            'message_type': 'text',
        },
        format='multipart'
    )
    request.user = user
    
    try:
        serializer = MessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            message = serializer.save(sender=user)
            print(f"✅ SUCCESS: Text message created with ID {message.id}")
        else:
            print(f"❌ VALIDATION ERROR: {serializer.errors}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 2: Message with image
    print("\n--- Test 2: Message with image ---")
    request = factory.post(
        '/api/messages/',
        {
            'conversation_id': 1,
            'text': 'Test message with image',
            'message_type': 'image',
        },
        format='multipart'
    )
    request.FILES = {'files': [test_image]}
    request.user = user
    
    try:
        serializer = MessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            message = serializer.save(sender=user)
            print(f"✅ SUCCESS: Image message created with ID {message.id}")
        else:
            print(f"❌ VALIDATION ERROR: {serializer.errors}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 3: Message with video
    print("\n--- Test 3: Message with video ---")
    request = factory.post(
        '/api/messages/',
        {
            'conversation_id': 1,
            'text': 'Test message with video',
            'message_type': 'video',
        },
        format='multipart'
    )
    request.FILES = {'files': [test_video]}
    request.user = user
    
    try:
        serializer = MessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            message = serializer.save(sender=user)
            print(f"✅ SUCCESS: Video message created with ID {message.id}")
        else:
            print(f"❌ VALIDATION ERROR: {serializer.errors}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    # Test 4: Message with audio
    print("\n--- Test 4: Message with audio ---")
    request = factory.post(
        '/api/messages/',
        {
            'conversation_id': 1,
            'text': 'Test message with audio',
            'message_type': 'audio',
        },
        format='multipart'
    )
    request.FILES = {'files': [test_audio]}
    request.user = user
    
    try:
        serializer = MessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            message = serializer.save(sender=user)
            print(f"✅ SUCCESS: Audio message created with ID {message.id}")
        else:
            print(f"❌ VALIDATION ERROR: {serializer.errors}")
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
    
    print("\n=== Test Complete ===")

if __name__ == '__main__':
    test_message_upload()
