import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Message, Conversation, Notification
from django.db.models import Count

# Get users
dere = User.objects.filter(username='dere').first()
demo = User.objects.filter(username='demo').first()

if dere and demo:
    # Get their conversation
    conv = Conversation.objects.filter(participants__in=[dere, demo]).annotate(participant_count=Count('participants')).filter(participant_count=2).first()
    
    if conv:
        print(f'Found conversation {conv.id} between dere and demo')
        
        # Send a test message from dere to demo
        test_message = Message.objects.create(
            conversation=conv,
            sender=dere,
            text='Test notification message!',
            message_type='text'
        )
        
        print(f'Created test message: {test_message.text}')
        
        # Check if notification was created for demo
        notification = Notification.objects.filter(user=demo, type='message', conversation_id=conv.id).first()
        if notification:
            print(f'✅ Notification created for demo: {notification.message}')
            print(f'   Conversation ID: {notification.conversation_id}')
            print(f'   Notification ID: {notification.id}')
        else:
            print('❌ No notification found for demo')
    else:
        print('No conversation found between dere and demo')
else:
    print('Users not found')
