import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Message, Conversation, Notification
from django.db.models import Count

# Get dere and demo users
dere = User.objects.filter(username='dere').first()
demo = User.objects.filter(username='demo').first()

print(f'dere: {dere.username if dere else "Not found"} (ID: {dere.id if dere else "N/A"})')
print(f'demo: {demo.username if demo else "Not found"} (ID: {demo.id if demo else "N/A"})')

# Check existing conversations between them
if dere and demo:
    conversations = Conversation.objects.filter(participants__in=[dere, demo]).annotate(participant_count=Count('participants')).filter(participant_count=2)
    print(f'Conversations between dere and demo: {conversations.count()}')
    
    for conv in conversations:
        print(f'Conversation {conv.id}: participants: {[p.username for p in conv.participants.all()]}')
        messages = conv.messages.all()
        print(f'  Messages: {messages.count()}')
        for msg in messages.order_by('-created_at')[:3]:
            print(f'    {msg.sender.username}: {msg.text[:30]}... ({msg.created_at})')
    
    # Check notifications for demo
    demo_notifications = Notification.objects.filter(user=demo, type='message').order_by('-timestamp')
    print(f'demo message notifications: {demo_notifications.count()}')
    for notif in demo_notifications[:5]:
        print(f'  {notif.message} at {notif.timestamp}')
        
    # Check all notifications for demo
    all_demo_notifications = Notification.objects.filter(user=demo).order_by('-timestamp')
    print(f'demo all notifications: {all_demo_notifications.count()}')
    for notif in all_demo_notifications[:5]:
        print(f'  {notif.type}: {notif.message} at {notif.timestamp}')
