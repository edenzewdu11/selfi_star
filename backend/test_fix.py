#!/usr/bin/env python
import requests
import io

# Test with potentially problematic file
try:
    response = requests.post('http://localhost:8000/api/auth/login/', 
        json={'username': 'testuser', 'password': 'testpass123'})
    
    if response.status_code == 200:
        token = response.json()['token']
        
        # Test with a file that might cause issues
        files = {'files': ('problematic.jpg', io.BytesIO(b'not_really_an_image_data'), 'image/jpeg')}
        data = {
            'conversation_id': '1',
            'text': 'Test problematic file',
            'message_type': 'image'
        }
        
        response = requests.post(
            'http://localhost:8000/api/messages/',
            files=files,
            data=data,
            headers={'Authorization': f'Token {token}'}
        )
        
        print(f'Problematic file upload status: {response.status_code}')
        print(f'Response content type: {response.headers.get("content-type")}')
        
        if response.status_code == 500:
            print('❌ Still getting 500 errors')
            print('Response preview:', response.text[:300])
        elif response.status_code in [200, 201]:
            print('✅ Upload successful')
        elif response.status_code == 400:
            print('⚠️ Bad request (likely moderation blocked)')
            try:
                print('Response:', response.json())
            except:
                print('Response:', response.text[:300])
        else:
            print(f'Other status: {response.status_code}')
            print('Response:', response.text[:300])
    else:
        print('Login failed')
        
except Exception as e:
    print(f'Test error: {e}')
