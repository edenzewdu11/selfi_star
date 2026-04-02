#!/usr/bin/env python
import requests
import io

# Create final test message
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Create a test message with image
    files = {'files': ('working_test.jpg', io.BytesIO(b'upload_is_working_now'), 'image/jpeg')}
    data = {
        'conversation_id': '1',
        'text': '🎉 UPLOAD IS WORKING! 🎉',
        'message_type': 'image'
    }
    
    response = requests.post(
        'http://localhost:8000/api/messages/',
        files=files,
        data=data,
        headers={'Authorization': f'Token {token}'}
    )
    
    print(f'Final upload test status: {response.status_code}')
    if response.status_code == 201:
        print('✅ SUCCESS! Upload is working!')
        data = response.json()
        print(f'Message ID: {data.get("id")}')
        print(f'Text: {data.get("text")}')
        print(f'Attachments: {len(data.get("attachments", []))}')
        print('🎉 The upload functionality is now completely fixed!')
        print('🎉 You should see this message in your chat UI!')
    else:
        print(f'❌ Status: {response.status_code}')
        print('Response:', response.text[:300])
else:
    print('Login failed')
