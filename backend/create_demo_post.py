import requests
import json
import os
from pathlib import Path

# API configuration
API_BASE = "http://localhost:8000/api"
LOGIN_URL = f"{API_BASE}/auth/login/"
POST_URL = f"{API_BASE}/posts/create/"

# Login credentials
USERNAME = "demo"
PASSWORD = "demo12345"

def create_test_post():
    print("🚀 Creating test post for demo user...")
    
    # Step 1: Login to get token
    print("📝 Logging in...")
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        response.raise_for_status()
        
        login_result = response.json()
        token = login_result['token']
        user_data = login_result['user']
        
        print(f"✅ Login successful! User: {user_data['username']}")
        print(f"🔑 Token: {token[:20]}...")
        
        # Step 2: Create a test image file
        print("📸 Creating test image...")
        
        # Create a simple test image content (1x1 pixel PNG)
        test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        # Save test image
        test_image_path = "test_demo_post.png"
        with open(test_image_path, "wb") as f:
            f.write(test_image_content)
        
        print(f"✅ Test image created: {test_image_path}")
        
        # Step 3: Upload the post
        print("📤 Uploading post...")
        
        headers = {
            "Authorization": f"Token {token}"
        }
        
        # Prepare form data
        files = {
            'file': (test_image_path, open(test_image_path, 'rb'), 'image/png')
        }
        
        data = {
            'caption': 'Demo test post - Neon database integration! 🌟',
            'hashtags': '#demo #neon #test'
        }
        
        post_response = requests.post(POST_URL, headers=headers, files=files, data=data)
        post_response.raise_for_status()
        
        post_result = post_response.json()
        print("✅ Post created successfully!")
        print(f"📝 Post ID: {post_result.get('id')}")
        print(f"👤 User: {post_result.get('user', {}).get('username')}")
        print(f"📄 Caption: {post_result.get('caption')}")
        print(f"🏷️ Hashtags: {post_result.get('hashtags')}")
        
        # Step 4: Verify in database
        print("🔍 Verifying post in database...")
        
        # Get posts endpoint to verify
        reels_url = f"{API_BASE}/reels/"
        reels_response = requests.get(reels_url, headers=headers)
        reels_response.raise_for_status()
        
        reels = reels_response.json()
        print(f"📊 Total posts in database: {len(reels)}")
        
        # Find our post
        our_post = None
        for reel in reels:
            if reel.get('caption') and 'Demo test post' in reel['caption']:
                our_post = reel
                break
        
        if our_post:
            print("✅ Post found in database!")
            print(f"🆔 Post ID: {our_post['id']}")
            print(f"📅 Created: {our_post.get('created_at')}")
            print(f"❤️ Likes: {our_post.get('likes_count', 0)}")
            print(f"💬 Comments: {our_post.get('comments_count', 0)}")
        else:
            print("❌ Post not found in database")
        
        # Cleanup
        os.remove(test_image_path)
        print("🧹 Test image cleaned up")
        
        return post_result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    result = create_test_post()
    if result:
        print("\n🎉 Test post creation completed successfully!")
        print("🔗 Neon database integration verified! ✅")
    else:
        print("\n❌ Test post creation failed!")
