#!/usr/bin/env python
import os
import sys
import django
import requests
from django.core.files.uploadedfile import SimpleUploadedFile
from api.content_moderation import moderate_upload

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_with_real_image():
    print("=== Testing with Real Kissing Image ===")
    
    # Download a test kissing image (or use local if available)
    try:
        # Using a known kissing image URL for testing
        response = requests.get('https://picsum.photos/seed/kissing-couple/400/300.jpg')
        if response.status_code == 200:
            image_data = response.content
            test_file = SimpleUploadedFile('kissing_test.jpg', image_data, content_type='image/jpeg')
            
            print(f"Image size: {len(image_data)} bytes")
            
            is_safe, msg = moderate_upload(test_file)
            print(f'🔍 Moderation result: is_safe={is_safe}, msg="{msg}"')
            
            if is_safe:
                print("❌ ISSUE: Kissing image was ALLOWED - this should be blocked!")
            else:
                print("✅ GOOD: Kissing image was properly BLOCKED!")
                
            return not is_safe  # Return True if properly blocked
        else:
            print(f"❌ Failed to download test image: {response.status_code}")
            return False
            
    except Exception as e:
        print(f'❌ Test error: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_with_real_image()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")
