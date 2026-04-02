#!/usr/bin/env python
import requests
import io

# Test upload without moderation
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Test with any file
    files = {'files': ('test_no_moderation.jpg', io.BytesIO(b'any_content_here'), 'image/jpeg')}
    data = {
        'conversation_id': '1',
        'text': 'Test without moderation',
        'message_type': 'image'
    }
    
    response = requests.post(
        'http://localhost:8000/api/messages/',
        files=files,
        data=data,
        headers={'Authorization': f'Token {token}'}
    )
    
    print(f'Upload without moderation status: {response.status_code}')
    print(f'Response content type: {response.headers.get("content-type")}')
    
    if response.status_code == 500:
        print('❌ Still getting 500 errors')
        print('Response preview:', response.text[:300])
    elif response.status_code in [200, 201]:
        print('✅ Upload successful without moderation!')
        data = response.json()
        print(f'Message ID: {data.get("id")}')
    else:
        print(f'Other status: {response.status_code}')
        print('Response:', response.text[:300])
else:
    print('Login failed')
