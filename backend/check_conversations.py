import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import Conversation, Message
from django.contrib.auth.models import User

demo = User.objects.get(email='demo@example.com')
eden = User.objects.get(username='eden11131000')
admin = User.objects.get(username='admin')

print(f"Demo ID: {demo.id}")
print(f"Eden ID: {eden.id}")
print(f"Admin ID: {admin.id}")

print("\nAll conversations:")
for conv in Conversation.objects.all():
    parts = [u.username for u in conv.participants.all()]
    msg_count = Message.objects.filter(conversation=conv).count()
    print(f"  Conversation {conv.id}: {parts} ({msg_count} messages)")
    for msg in Message.objects.filter(conversation=conv).order_by('created_at'):
        print(f"    [{msg.sender.username}]: {msg.text}")
