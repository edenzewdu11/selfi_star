#!/usr/bin/env python
import requests
import io

# Create a test message to verify the fix
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Create a test message with image
    files = {'files': ('final_test.jpg', io.BytesIO(b'final_test_image_data'), 'image/jpeg')}
    data = {
        'conversation_id': '1',
        'text': 'FINAL TEST - This should appear in chat!',
        'message_type': 'image'
    }
    
    response = requests.post(
        'http://localhost:8000/api/messages/',
        files=files,
        data=data,
        headers={'Authorization': f'Token {token}'}
    )
    
    print(f'Final test status: {response.status_code}')
    if response.status_code == 201:
        print('✅ SUCCESS! Final test message created')
        data = response.json()
        print(f'Message ID: {data.get("id")}')
        print(f'Text: {data.get("text")}')
        print(f'Attachments: {len(data.get("attachments", []))}')
        print('🎉 This message should now appear in your chat UI!')
    else:
        print(f'❌ Status: {response.status_code}')
        print('Response:', response.text[:300])
else:
    print('Login failed')
