#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.files.uploadedfile import SimpleUploadedFile
from api.content_moderation import moderate_upload

def test_moderation():
    print("=== Testing Content Moderation ===")
    
    # Test with a simple image
    test_file = SimpleUploadedFile('test.jpg', b'fake_image_data', content_type='image/jpeg')
    
    try:
        is_safe, msg = moderate_upload(test_file)
        print(f'✅ Content moderation result: is_safe={is_safe}, msg="{msg}"')
        return True
    except Exception as e:
        print(f'❌ Content moderation error: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_moderation()
