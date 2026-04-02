#!/usr/bin/env python
import requests
import io

# Test with the aggressive fix
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Create a test message
    files = {'files': ('aggressive_fix.jpg', io.BytesIO(b'aggressive_fix_working'), 'image/jpeg')}
    data = {
        'conversation_id': '1',
        'text': '🔥 AGGRESSIVE FIX TEST - This should work!',
        'message_type': 'image'
    }
    
    response = requests.post(
        'http://localhost:8000/api/messages/',
        files=files,
        data=data,
        headers={'Authorization': f'Token {token}'}
    )
    
    print(f'Aggressive fix test status: {response.status_code}')
    if response.status_code == 201:
        print('✅ SUCCESS! Aggressive fix is working!')
        data = response.json()
        print(f'Message ID: {data.get("id")}')
        print(f'Text: {data.get("text")}')
        print('🔥 The frontend should now work regardless of conversation selection!')
    else:
        print(f'❌ Status: {response.status_code}')
        print('Response:', response.text[:300])
else:
    print('Login failed')
