#!/usr/bin/env python
import requests
import io

# Test the exact API endpoint the frontend is using
try:
    response = requests.post('http://localhost:8000/api/auth/login/', 
        json={'username': 'testuser', 'password': 'testpass123'})
    
    if response.status_code == 200:
        token = response.json()['token']
        print(f'✅ Login successful, token: {token[:10]}...')
        
        # Test the exact endpoint
        files = {'files': ('frontend_test.jpg', io.BytesIO(b'frontend_test_data'), 'image/jpeg')}
        data = {
            'conversation_id': '1',
            'text': 'Frontend test upload',
            'message_type': 'image'
        }
        
        response = requests.post(
            'http://localhost:8000/api/messages/',
            files=files,
            data=data,
            headers={'Authorization': f'Token {token}'}
        )
        
        print(f'Frontend endpoint test status: {response.status_code}')
        print(f'Content type: {response.headers.get("content-type")}')
        
        if response.status_code == 500:
            print('❌ 500 Error - Response preview:')
            print(response.text[:500])
        elif response.status_code == 201:
            print('✅ Frontend endpoint works!')
            data = response.json()
            print(f'Message created: ID {data.get("id")}')
        else:
            print(f'Status: {response.status_code}')
            print('Response:', response.text[:200])
    else:
        print('❌ Login failed')
        
except Exception as e:
    print(f'Error: {e}')
