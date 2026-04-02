#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from api.models import Conversation, Message
from api.views import MessageViewSet
from rest_framework.test import APIRequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile

def test_message_upload():
    print("=== Testing Message Upload ===")
    
    # Create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com', 'password': 'testpass123'}
    )
    
    # Create a test conversation
    conversation, created = Conversation.objects.get_or_create(
        id=1,
        defaults={}
    )
    if created:
        conversation.participants.add(user)
        conversation.save()
    
    # Create a mock file
    test_file = SimpleUploadedFile(
        "test_image.jpg", 
        b"fake_image_data", 
        content_type="image/jpeg"
    )
    
    # Create request factory
    factory = APIRequestFactory()
    
    # Test with file attachment
    request = factory.post(
        '/api/messages/',
        {
            'conversation_id': 1,
            'text': 'Test message with image',
            'message_type': 'image',
            'files': [test_file],
        },
        format='multipart'
    )
    
    # Set the user
    request.user = user
    
    # Create viewset instance
    viewset = MessageViewSet()
    viewset.request = request
    viewset.format_kwarg = None
    
    try:
        response = viewset.create(request)
        print(f"✅ SUCCESS: Message created with ID {response.data.get('id')}")
        return True
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_message_upload()
