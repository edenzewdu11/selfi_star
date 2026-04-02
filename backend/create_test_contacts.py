import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Follow

# Get demo user
demo = User.objects.filter(email='demo@example.com').first()

if not demo:
    print("Demo user not found!")
    exit()

print(f"Demo user: {demo.username}")

# Get current contacts
followers = Follow.objects.filter(following=demo).values_list('follower', flat=True)
following = Follow.objects.filter(follower=demo).values_list('following', flat=True)
contact_ids = set(list(followers) + list(following))
contacts = User.objects.filter(id__in=contact_ids)

print(f"\nCurrent contacts: {contacts.count()}")
for c in contacts:
    print(f"  - {c.username} (ID: {c.id})")

# Create test users if they don't exist
test_users = []
for i in range(1, 4):
    username = f'testuser{i}'
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': f'{username}@example.com',
            'first_name': f'Test',
            'last_name': f'User {i}'
        }
    )
    if created:
        user.set_password('test123')
        user.save()
        print(f"\nCreated user: {username}")
    test_users.append(user)

# Create follow relationships
print("\nCreating follow relationships...")
for user in test_users:
    # Demo follows test user
    follow1, created1 = Follow.objects.get_or_create(follower=demo, following=user)
    if created1:
        print(f"  ✓ {demo.username} now follows {user.username}")
    
    # Test user follows demo
    follow2, created2 = Follow.objects.get_or_create(follower=user, following=demo)
    if created2:
        print(f"  ✓ {user.username} now follows {demo.username}")

# Show final contacts
followers = Follow.objects.filter(following=demo).values_list('follower', flat=True)
following = Follow.objects.filter(follower=demo).values_list('following', flat=True)
contact_ids = set(list(followers) + list(following))
contacts = User.objects.filter(id__in=contact_ids)

print(f"\n✅ Final contacts for {demo.username}: {contacts.count()}")
for c in contacts:
    print(f"  - {c.username} ({c.first_name} {c.last_name})")
