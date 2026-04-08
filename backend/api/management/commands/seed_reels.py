from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Reel


SAMPLE_REELS = [
    {
        'username': 'demo',
        'image': 'https://picsum.photos/seed/reel1/400/700',
        'media': None,
        'caption': 'Beautiful sunset view 🌅 #nature #photography',
    },
    {
        'username': 'testuser',
        'image': 'https://picsum.photos/seed/reel2/400/700',
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
        'image': 'https://picsum.photos/seed/reel3/400/700',
        'media': None,
        'caption': 'Morning vibes ☀️ #morning #lifestyle',
    },
    {
        'username': 'demo',
        'image': 'https://picsum.photos/seed/reel4/400/700',
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
        'image': 'https://picsum.photos/seed/reel5/400/700',
        'media': None,
        'caption': 'Good vibes only 💫 #positivity #happy',
    },
    {
        'username': 'testuser',
        'image': 'https://picsum.photos/seed/reel6/400/700',
        'media': None,
        'caption': 'Creative shots 📸 #photography #art',
    },
]


class Command(BaseCommand):
    help = 'Seed sample reels with public image/video URLs'

    def handle(self, *args, **options):
        if Reel.objects.count() >= len(SAMPLE_REELS):
            self.stdout.write('Reels already seeded, skipping.')
            return

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
