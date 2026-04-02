#!/usr/bin/env python
import requests
import io
from requests_toolbelt.multipart.encoder import MultipartEncoder

# Test exactly like the frontend would do
print("=== Direct Frontend Simulation ===")

# Login
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code != 200:
    print("❌ Login failed")
    exit()

token = response.json()['token']
print(f"✅ Logged in with token: {token[:10]}...")

# Create FormData exactly like frontend
formData = MultipartEncoder(
    fields={
        'conversation_id': '1',
        'text': 'Direct test message',
        'message_type': 'image',
        'files': ('direct_test.jpg', io.BytesIO(b'direct_test_image_data'), 'image/jpeg')
    }
)

headers = {
    'Authorization': f'Token {token}',
    'Content-Type': formData.content_type
}

print("🚀 Sending message exactly like frontend...")
try:
    response = requests.post(
        'http://localhost:8000/api/messages/',
        data=formData,
        headers=headers
    )
    
    print(f"📨 Response status: {response.status_code}")
    print(f"📄 Content type: {response.headers.get('content-type')}")
    
    if response.status_code == 201:
        print("✅ SUCCESS! Message created")
        data = response.json()
        print(f"   Message ID: {data.get('id')}")
        print(f"   Text: {data.get('text')}")
        print(f"   Attachments: {len(data.get('attachments', []))}")
        print("   This message should appear in conversation 1!")
    elif response.status_code == 400:
        print("❌ Bad Request:")
        try:
            print(f"   Error: {response.json()}")
        except:
            print(f"   Raw: {response.text[:300]}")
    elif response.status_code == 500:
        print("❌ Server Error:")
        print(f"   Response: {response.text[:300]}")
    else:
        print(f"❌ Other status: {response.status_code}")
        print(f"   Response: {response.text[:300]}")
        
except Exception as e:
    print(f"❌ Request failed: {e}")

print("\n=== Test Complete ===")
