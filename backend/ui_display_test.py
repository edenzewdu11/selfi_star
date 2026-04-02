#!/usr/bin/env python
import requests
import io

# Create a test message to verify the UI display fix
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Create a test message
    files = {'files': ('ui_display_test.jpg', io.BytesIO(b'ui_display_fix_working'), 'image/jpeg')}
    data = {
        'conversation_id': '1',
        'text': '🎉 UI DISPLAY FIX TEST - This should now appear!',
        'message_type': 'image'
    }
    
    response = requests.post(
        'http://localhost:8000/api/messages/',
        files=files,
        data=data,
        headers={'Authorization': f'Token {token}'}
    )
    
    print(f'UI display fix test status: {response.status_code}')
    if response.status_code == 201:
        print('✅ SUCCESS! UI display fix should work!')
        data = response.json()
        print(f'Message ID: {data.get("id")}')
        print(f'Text: {data.get("text")}')
        print('🎉 The frontend should now display this message!')
        print('🎉 Check the browser console for "🔄 Using conversation ID: 1"')
    else:
        print(f'❌ Status: {response.status_code}')
        print('Response:', response.text[:300])
else:
    print('Login failed')
