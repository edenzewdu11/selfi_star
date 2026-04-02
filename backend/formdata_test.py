#!/usr/bin/env python
import requests
import io
from requests_toolbelt.multipart.encoder import MultipartEncoder

# Test with exact FormData like frontend
print("=== FormData Test ===")

# Login
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code != 200:
    print("❌ Login failed")
    exit()

token = response.json()['token']
print(f"✅ Logged in")

# Create FormData exactly like frontend JavaScript
formData = MultipartEncoder(
    fields={
        'conversation_id': '1',
        'text': 'FormData test message',
        'message_type': 'image',
        'files': ('formdata_test.jpg', io.BytesIO(b'formdata_test_content'), 'image/jpeg')
    }
)

headers = {
    'Authorization': f'Token {token}',
    'Content-Type': formData.content_type
}

print("🚀 Sending FormData request...")
try:
    response = requests.post(
        'http://localhost:8000/api/messages/',
        data=formData,
        headers=headers
    )
    
    print(f"📨 Response status: {response.status_code}")
    print(f"📄 Content type: {response.headers.get('content-type')}")
    
    if response.status_code == 201:
        print("✅ SUCCESS! FormData message created")
        data = response.json()
        print(f"   Message ID: {data.get('id')}")
        print(f"   Text: {data.get('text')}")
        print(f"   Attachments: {len(data.get('attachments', []))}")
        print("🎉 FormData upload works perfectly!")
    elif response.status_code == 400:
        print("❌ Bad Request:")
        try:
            print(f"   Error: {response.json()}")
        except:
            print(f"   Raw: {response.text[:300]}")
    else:
        print(f"❌ Status: {response.status_code}")
        print(f"   Response: {response.text[:300]}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")

print("\n=== FormData Test Complete ===")
