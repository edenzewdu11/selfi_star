#!/usr/bin/env python
import requests

# Check what conversations exist for the test user
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'testuser', 'password': 'testpass123'})

if response.status_code == 200:
    token = response.json()['token']
    
    # Get conversations
    response = requests.get(
        'http://localhost:8000/api/conversations/',
        headers={'Authorization': f'Token {token}'}
    )
    
    if response.status_code == 200:
        conversations = response.json()
        print(f'Available conversations: {len(conversations)}')
        for conv in conversations:
            participants = [p.get('username') for p in conv.get('participants', [])]
            print(f'  - ID: {conv.get("id")}, Participants: {participants}')
    else:
        print(f'Error: {response.text}')
else:
    print('Login failed')
