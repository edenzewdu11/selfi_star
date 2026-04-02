import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Follow
from rest_framework.authtoken.models import Token

# Get demo user
demo = User.objects.filter(email='demo@example.com').first()
print(f"Demo user: {demo.username} (ID: {demo.id})")

# Get token
token = Token.objects.get(user=demo)
print(f"Token: {token.key}")

# Test the contacts logic
followers = Follow.objects.filter(following=demo).values_list('follower', flat=True)
following = Follow.objects.filter(follower=demo).values_list('following', flat=True)

print(f"\nFollowers IDs: {list(followers)}")
print(f"Following IDs: {list(following)}")

contact_ids = set(list(followers) + list(following))
print(f"\nCombined contact IDs: {contact_ids}")

contacts = User.objects.filter(id__in=contact_ids)
print(f"\nTotal contacts: {contacts.count()}")

for c in contacts:
    print(f"  - {c.username} (ID: {c.id}, Email: {c.email})")
