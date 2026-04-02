import os
import django
import sys
import requests
from io import BytesIO
from django.core.files.base import ContentFile

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Reel

def download_image(url, filename):
    """Download image from URL"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return ContentFile(response.content)
        return None
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def create_real_posts():
    print("🚀 Creating REAL posts with actual images...")
    
    # Get users
    users = list(User.objects.all()[:5])
    if not users:
        print("❌ No users found. Run populate_sample_data.py first.")
        return
    
    # Real sample images from Unsplash (free stock photos)
    sample_posts = [
        {
            'url': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
            'caption': 'Beautiful mountain landscape at sunset 🏔️ #nature #mountains #sunset',
            'hashtags': 'nature,mountains,sunset,travel',
            'votes': 45
        },
        {
            'url': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
            'caption': 'Morning coffee vibes ☕ #coffee #morning #lifestyle',
            'hashtags': 'coffee,morning,lifestyle,cafe',
            'votes': 32
        },
        {
            'url': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80',
            'caption': 'City lights at night 🌃 #city #night #urban #lights',
            'hashtags': 'city,night,urban,lights',
            'votes': 67
        },
        {
            'url': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
            'caption': 'Weekend beach vibes 🏖️ #beach #weekend #summer #ocean',
            'hashtags': 'beach,weekend,summer,ocean',
            'votes': 28
        },
        {
            'url': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
            'caption': 'Walking through the forest 🌲 #nature #forest #hiking',
            'hashtags': 'nature,forest,hiking,outdoors',
            'votes': 51
        },
        {
            'url': 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
            'caption': 'Fashion forward look today 👗 #fashion #style #ootd #outfit',
            'hashtags': 'fashion,style,ootd,outfit',
            'votes': 89
        },
        {
            'url': 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&q=80',
            'caption': 'Delicious food adventures 🍕 #food #foodie #delicious #yummy',
            'hashtags': 'food,foodie,delicious,yummy',
            'votes': 42
        },
        {
            'url': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
            'caption': 'Gym time! Fitness journey 💪 #fitness #gym #health #workout',
            'hashtags': 'fitness,gym,health,workout',
            'votes': 38
        },
    ]
    
    created_count = 0
    
    for i, post_data in enumerate(sample_posts):
        user = users[i % len(users)]
        
        print(f"\n📸 Creating post {i+1}/{len(sample_posts)} for {user.username}...")
        print(f"   URL: {post_data['url']}")
        
        # Download the image
        image_content = download_image(post_data['url'], f"reel_{i}.jpg")
        
        if image_content:
            # Create reel with actual image
            reel = Reel.objects.create(
                user=user,
                caption=post_data['caption'],
                hashtags=post_data['hashtags'],
                votes=post_data['votes']
            )
            
            # Save the image file
            reel.image.save(f"reel_{reel.id}.jpg", image_content, save=True)
            
            print(f"   ✅ Created reel {reel.id} with REAL image: {reel.image.url}")
            created_count += 1
        else:
            print(f"   ❌ Failed to download image")
    
    print(f"\n✅ SUCCESS! Created {created_count} REAL posts with actual images.")
    print(f"📁 Images saved to: media/reels/")
    print(f"\n🌐 Access the frontend to see real posts!")

if __name__ == "__main__":
    create_real_posts()
