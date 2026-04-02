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

def test_various_content():
    print("=== COMPREHENSIVE CONTENT MODERATION TEST ===")
    
    test_cases = [
        {
            'name': 'Normal Image',
            'url': 'https://picsum.photos/seed/landscape/400/300.jpg',
            'should_block': False
        },
        {
            'name': 'Kissing Couple',
            'url': 'https://picsum.photos/seed/kissing-couple/400/300.jpg', 
            'should_block': True
        },
        {
            'name': 'Portrait Photo',
            'url': 'https://picsum.photos/seed/portrait/400/300.jpg',
            'should_block': False
        },
        {
            'name': 'Warm Tone Photo',
            'url': 'https://picsum.photos/seed/warm-sunset/400/300.jpg',
            'should_block': True  # High warm tones might trigger block
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        print(f"\n--- Testing {test_case['name']} ---")
        try:
            response = requests.get(test_case['url'], timeout=10)
            if response.status_code == 200:
                image_data = response.content
                test_file = SimpleUploadedFile(f"{test_case['name'].replace(' ', '_')}.jpg", 
                                              image_data, content_type='image/jpeg')
                
                is_safe, msg = moderate_upload(test_file)
                
                result = {
                    'name': test_case['name'],
                    'blocked': not is_safe,
                    'expected_block': test_case['should_block'],
                    'correct': (not is_safe) == test_case['should_block'],
                    'message': msg
                }
                
                status = "✅ CORRECT" if result['correct'] else "❌ WRONG"
                print(f"{status} - {test_case['name']}: {'BLOCKED' if not is_safe else 'ALLOWED'}")
                if msg:
                    print(f"   Message: {msg}")
                
                results.append(result)
            else:
                print(f"❌ Failed to download {test_case['name']}: {response.status_code}")
                results.append({
                    'name': test_case['name'],
                    'blocked': False,
                    'expected_block': test_case['should_block'],
                    'correct': False,
                    'message': f"Download failed: {response.status_code}"
                })
                
        except Exception as e:
            print(f"❌ Error testing {test_case['name']}: {e}")
            results.append({
                'name': test_case['name'],
                'blocked': False,
                'expected_block': test_case['should_block'],
                'correct': False,
                'message': f"Error: {e}"
            })
    
    # Summary
    print("\n=== TEST SUMMARY ===")
    correct_tests = sum(1 for r in results if r['correct'])
    total_tests = len(results)
    
    print(f"Correct: {correct_tests}/{total_tests}")
    
    for result in results:
        status = "✅" if result['correct'] else "❌"
        print(f"{status} {result['name']}: {'BLOCKED' if result['blocked'] else 'ALLOWED'} "
              f"(Expected: {'BLOCK' if result['expected_block'] else 'ALLOW'})")
    
    success_rate = correct_tests / total_tests if total_tests > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1%}")
    
    if success_rate >= 0.75:
        print("🎉 Content moderation system is working well!")
    else:
        print("⚠️ Content moderation system needs improvement")
    
    return success_rate >= 0.75

if __name__ == '__main__':
    success = test_various_content()
    sys.exit(0 if success else 1)
