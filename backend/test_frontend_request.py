#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import requests
import json
import time

def test_frontend_like_request():
    print("=== Testing Frontend-like Request ===")
    
    # Get a fresh token
    response = requests.post('http://localhost:8000/api/auth/login/', 
        json={'username': 'testuser', 'password': 'testpass123'})
    
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = response.json()['token']
    print(f"✅ Got token: {token[:10]}...")
    
    # Test exactly like the frontend would do
    print("\n--- Testing exactly like frontend ---")
    
    # Create FormData like the frontend
    import io
    from requests_toolbelt.multipart.encoder import MultipartEncoder
    
    # Simulate frontend FormData
    formData = MultipartEncoder(
        fields={
            'conversation_id': '1',
            'text': 'Test from frontend simulation',
            'message_type': 'image',
            'files': ('test.jpg', io.BytesIO(b'fake_image_data'), 'image/jpeg')
        }
    )
    
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': formData.content_type
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/messages/',
            data=formData,
            headers=headers
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ Frontend-like request works!")
            data = response.json()
            print(f"Message ID: {data.get('id')}")
            print(f"Message type: {data.get('message_type')}")
            print(f"Attachments: {len(data.get('attachments', []))}")
        else:
            print(f"❌ Frontend-like request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Request error: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == '__main__':
    test_frontend_like_request()
