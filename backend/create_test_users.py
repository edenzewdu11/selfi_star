import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Follow, Conversation, Message

# Create two test users
users_data = [
    {
        'username': 'user1',
        'email': 'user1@test.com',
        'password': 'test123456',
        'first_name': 'Test',
        'last_name': 'User One'
    },
    {
        'username': 'user2', 
        'email': 'user2@test.com',
        'password': 'test123456',
        'first_name': 'Test',
        'last_name': 'User Two'
    }
]

print("Creating test users...")
test_users = []

for user_data in users_data:
    username = user_data['username']
    email = user_data['email']
    password = user_data['password']
    
    # Check if user exists
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        print(f"✅ User '{username}' already exists (ID: {user.id})")
    else:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=user_data['first_name'],
            last_name=user_data['last_name']
        )
        print(f"👤 Created user '{username}' (ID: {user.id})")
    
    test_users.append(user)

# Make them follow each other
user1, user2 = test_users[0], test_users[1]

print("\nSetting up follow relationships...")
# user1 follows user2
if not Follow.objects.filter(follower=user1, following=user2).exists():
    Follow.objects.create(follower=user1, following=user2)
    print(f"✅ {user1.username} follows {user2.username}")

# user2 follows user1  
if not Follow.objects.filter(follower=user2, following=user1).exists():
    Follow.objects.create(follower=user2, following=user1)
    print(f"✅ {user2.username} follows {user1.username}")

# Create or get conversation between them
conversation = Conversation.objects.filter(participants=user1).filter(participants=user2).first()
if not conversation:
    conversation = Conversation.objects.create()
    conversation.participants.add(user1, user2)
    print(f"💬 Created conversation between {user1.username} and {user2.username} (ID: {conversation.id})")
else:
    print(f"💬 Found existing conversation (ID: {conversation.id})")

# Add some test messages
test_messages = [
    {'sender': user1, 'text': 'Hey! How are you?'},
    {'sender': user2, 'text': 'Hi! I\'m good, thanks! How about you?'},
    {'sender': user1, 'text': 'Great! Testing the messaging system'},
    {'sender': user2, 'text': 'Working perfectly! 🎉'},
]

print("\nAdding test messages...")
for msg_data in test_messages:
    message = Message.objects.create(
        conversation=conversation,
        sender=msg_data['sender'],
        message_type='text',
        text=msg_data['text']
    )
    print(f"📨 Message from {msg_data['sender'].username}: {msg_data['text']}")

print("\n" + "="*60)
print("✅ TEST USERS READY FOR LOGIN")
print("="*60)
print("\n🔑 LOGIN CREDENTIALS:")
print("\nUser 1:")
print(f"   Username: {test_users[0].username}")
print(f"   Email: {test_users[0].email}")
print(f"   Password: test123456")

print("\nUser 2:")
print(f"   Username: {test_users[1].username}")
print(f"   Email: {test_users[1].email}")
print(f"   Password: test123456")

print(f"\n💬 Conversation ID: {conversation.id}")
print(f"📊 Total messages: {Message.objects.filter(conversation=conversation).count()}")

print("\n📋 INSTRUCTIONS:")
print("1. Open two different browsers or incognito windows")
print("2. Login with User 1 in one browser")
print("3. Login with User 2 in the other browser")
print("4. Go to Messages and test chatting")
print("5. Test calls, media sharing, and all features")
print("\nAll data is stored in the database! 🗄️")
