import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("=== TOKEN CONFUSION CHECK ===")

# Get users
demo_user = User.objects.get(email='demo@example.com')
admin_user = User.objects.get(username='admin')

print(f"Demo user: {demo_user.username} (ID: {demo_user.id})")
print(f"Admin user: {admin_user.username} (ID: {admin_user.id})")

# Get tokens
demo_token = Token.objects.get_or_create(user=demo_user)[0]
admin_token = Token.objects.get_or_create(user=admin_user)[0]

print(f"\nDemo token: {demo_token.key}")
print(f"Admin token: {admin_token.key}")

# Check if tokens are the same (this would be a major issue)
if demo_token.key == admin_token.key:
    print("🚨 CRITICAL ERROR: Demo and admin have the same token!")
else:
    print("✅ Demo and admin have different tokens")

# Print all tokens for debugging
print(f"\nAll user tokens:")
for user in User.objects.all():
    try:
        token = Token.objects.get(user=user)
        print(f"  {user.username} (ID: {user.id}): {token.key}")
    except Token.DoesNotExist:
        print(f"  {user.username} (ID: {user.id}): No token")
