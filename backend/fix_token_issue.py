#!/usr/bin/env python
import os
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("=== TOKEN CONFUSION FIX SCRIPT ===")
print()

# Check all users
print("1. USERS IN DATABASE:")
for user in User.objects.all():
    print(f"   ID: {user.id}, Username: {user.username}, Email: {user.email}, Is Staff: {user.is_staff}")
    try:
        token = Token.objects.get(user=user)
        print(f"      Token: {token.key[:10]}... (Full: {token.key})")
    except Token.DoesNotExist:
        print("      No token")
print()

# Check all tokens
print("2. TOKENS IN DATABASE:")
for token in Token.objects.all():
    print(f"   Token: {token.key[:10]}... User: {token.user.username} (ID: {token.user.id})")
print()

# Find potential issues
print("3. CHECKING FOR ISSUES:")

# Check if demo user exists
demo_user = None
admin_user = None

try:
    demo_user = User.objects.get(email='demo@example.com')
    print(f"   ✓ Demo user found: {demo_user.username} (ID: {demo_user.id})")
except User.DoesNotExist:
    print("   ❌ Demo user not found")

try:
    admin_user = User.objects.get(username='admin')
    print(f"   ✓ Admin user found: {admin_user.username} (ID: {admin_user.id})")
except User.DoesNotExist:
    print("   ❌ Admin user not found")

# Check if demo user has admin token
if demo_user:
    try:
        demo_token = Token.objects.get(user=demo_user)
        print(f"   ✓ Demo user token: {demo_token.key[:10]}...")
        
        # Check if this matches any admin token pattern
        if admin_user:
            try:
                admin_token = Token.objects.get(user=admin_user)
                if demo_token.key == admin_token.key:
                    print("   🚨 CRITICAL ISSUE: Demo user has same token as admin!")
                    print("   🛠️  Fixing by deleting demo token and creating new one...")
                    demo_token.delete()
                    new_token = Token.objects.create(user=demo_user)
                    print(f"   ✅ New demo token created: {new_token.key[:10]}...")
                else:
                    print("   ✓ Demo token is different from admin token")
            except Token.DoesNotExist:
                print("   ⚠️  Admin has no token, creating one...")
                admin_token = Token.objects.create(user=admin_user)
                print(f"   ✅ Admin token created: {admin_token.key[:10]}...")
    except Token.DoesNotExist:
        print("   ❌ Demo user has no token, creating one...")
        new_token = Token.objects.create(user=demo_user)
        print(f"   ✅ Demo token created: {new_token.key[:10]}...")

# Ensure admin has token
if admin_user:
    try:
        admin_token = Token.objects.get(user=admin_user)
        print(f"   ✓ Admin token: {admin_token.key[:10]}...")
    except Token.DoesNotExist:
        print("   ❌ Admin user has no token, creating one...")
        admin_token = Token.objects.create(user=admin_user)
        print(f"   ✅ Admin token created: {admin_token.key[:10]}...")

print()
print("4. FINAL VERIFICATION:")
print("   All tokens after fix:")
for token in Token.objects.all():
    print(f"   Token: {token.key[:10]}... User: {token.user.username} (ID: {token.user.id})")

print()
print("=== FIX COMPLETE ===")
print()
print("NEXT STEPS:")
print("1. Clear browser localStorage:")
print("   - Open browser DevTools (F12)")
print("   - Go to Application → Local Storage")
print("   - Clear all items or specifically 'authToken' and 'adminToken'")
print("2. Refresh the page")
print("3. Login as demo user (demo@example.com / demo12345)")
print("4. Create a post - it should now show as from demo, not admin")
