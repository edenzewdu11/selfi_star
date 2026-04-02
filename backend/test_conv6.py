#!/usr/bin/env python
import requests
import io

# Test message in conversation 6 (the one you're using)
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Test with conversation 6
    files = {'files': ('test_conv6.jpg', io.BytesIO(b'test_for_conversation_6'), 'image/jpeg')}
    data = {
        'conversation_id': '6',  # Using conversation 6
        'text': 'Test message for conversation 6',
        'message_type': 'image'
    }
    
    response = requests.post(
        'http://localhost:8000/api/messages/',
        files=files,
        data=data,
        headers={'Authorization': f'Token {token}'}
    )
    
    print(f'Conversation 6 test status: {response.status_code}')
    if response.status_code == 201:
        print('✅ Test message created in conversation 6')
        data = response.json()
        print(f'Message ID: {data.get("id")}')
        print(f'Message text: {data.get("text")}')
        print(f'Attachments: {len(data.get("attachments", []))}')
    else:
        print(f'❌ Status: {response.status_code}')
        print('Response:', response.text[:300])
else:
    print('Login failed')
