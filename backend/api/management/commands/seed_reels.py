from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Reel


SAMPLE_REELS = [
    {
        'username': 'demo',
        'image': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=700&fit=crop&auto=format',
        'media': None,
        'caption': 'Beautiful mountain view 🌅 #nature #photography',
    },
    {
        'username': 'testuser',
        'image': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=700&fit=crop&auto=format',
        'media': None,
        'caption': 'City lights at night ✨ #city #nightlife',
    },
    {
        'username': 'demo',
        'image': None,
        'media': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'caption': 'Amazing video clip 🎥 #video #viral',
    },
    {
        'username': 'testuser',
        'image': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=700&fit=crop&auto=format',
        'media': None,
        'caption': 'Morning vibes ☀️ #morning #lifestyle',
    },
    {
        'username': 'demo',
        'image': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=700&fit=crop&auto=format',
        'media': None,
        'caption': 'Exploring new places 🗺️ #travel #adventure',
    },
    {
        'username': 'testuser',
        'image': None,
        'media': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'caption': 'Epic moments 🔥 #trending #fyp',
    },
    {
        'username': 'demo',
        'image': 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=700&fit=crop&auto=format',
        'media': None,
        'caption': 'Good vibes only 💫 #positivity #happy',
    },
    {
        'username': 'testuser',
        'image': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=700&fit=crop&auto=format',
        'media': None,
        'caption': 'Creative shots 📸 #photography #art',
    },
]


class Command(BaseCommand):
    help = 'Seed sample reels with public image/video URLs'

    def handle(self, *args, **options):
        Reel.objects.all().delete()
        self.stdout.write('Cleared existing reels.')
        created = 0
        for item in SAMPLE_REELS:
            try:
                user = User.objects.get(username=item['username'])
                reel = Reel(
                    user=user,
                    caption=item['caption'],
                    hashtags='',
                    votes=0,
                )
                if item['image']:
                    reel.image = item['image']
                if item['media']:
                    reel.media = item['media']
                reel.save()
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created reel for {item['username']}"))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"User {item['username']} not found, skipping"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating reel: {e}"))

        self.stdout.write(self.style.SUCCESS(f'Done! Created {created} reels.'))
