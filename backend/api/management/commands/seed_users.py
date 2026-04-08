from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Create initial users for the app'

    def handle(self, *args, **options):
        users = [
            {'username': 'demo', 'password': 'testpass123', 'email': 'demo@selfistar.com', 'first_name': 'Demo', 'is_staff': False},
            {'username': 'testuser', 'password': 'testpass123', 'email': 'testuser@selfistar.com', 'first_name': 'Test User', 'is_staff': False},
            {'username': 'admin', 'password': 'admin123', 'email': 'admin@selfistar.com', 'first_name': 'Admin', 'is_staff': True, 'is_superuser': True},
            {'username': 'superadmin', 'password': 'superadmin123', 'email': 'superadmin@selfistar.com', 'first_name': 'Super Admin', 'is_staff': True, 'is_superuser': True},
        ]

        for u in users:
            if not User.objects.filter(username=u['username']).exists():
                user = User.objects.create_user(
                    username=u['username'],
                    password=u['password'],
                    email=u['email'],
                    first_name=u['first_name'],
                )
                user.is_staff = u.get('is_staff', False)
                user.is_superuser = u.get('is_superuser', False)
                user.save()
                Token.objects.get_or_create(user=user)
                self.stdout.write(self.style.SUCCESS(f"Created user: {u['username']}"))
            else:
                self.stdout.write(f"User already exists: {u['username']}")

        self.stdout.write(self.style.SUCCESS('Done seeding users.'))
