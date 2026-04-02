import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Call, Conversation, Notification
from django.utils import timezone
import asyncio

class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Authenticate user from token parameter
        token_param = self.scope['query_string'].decode().split('token=')[-1]
        
        if not token_param:
            await self.close()
            return

        try:
            token = await database_sync_to_async(Token.objects.get)(key=token_param)
            self.user = token.user
            self.user_id = self.user.id
            self.room_group_name = f"calls_{self.user_id}"
            
            # Join user's personal call group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"User {self.user.username} connected to call signaling")
            
        except Token.DoesNotExist:
            await self.close()
            return

    async def disconnect(self, close_code):
        # Leave user's personal call group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print(f"User {self.user.username} disconnected from call signaling")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'identify':
                # User identification (already handled in connect)
                pass

            elif message_type == 'initiate_call':
                await self.handle_initiate_call(data.get('call'))

            elif message_type == 'accept_call':
                await self.handle_accept_call(data.get('call_id'))

            elif message_type == 'decline_call':
                await self.handle_decline_call(data.get('call_id'))

            elif message_type == 'end_call':
                await self.handle_end_call(data.get('call_id'))

            elif message_type == 'offer':
                await self.handle_offer(
                    data.get('offer'),
                    data.get('call_id'),
                    data.get('target_user_id')
                )

            elif message_type == 'answer':
                await self.handle_answer(
                    data.get('answer'),
                    data.get('call_id'),
                    data.get('target_user_id')
                )

            elif message_type == 'ice_candidate':
                await self.handle_ice_candidate(
                    data.get('candidate'),
                    data.get('call_id'),
                    data.get('target_user_id')
                )

        except json.JSONDecodeError:
            print("Invalid JSON received")
        except Exception as e:
            print(f"Error handling message: {e}")

    async def handle_initiate_call(self, call_data):
        try:
            # Get the call that was already created via API
            call = await database_sync_to_async(Call.objects.get)(id=call_data['id'])
            
            # Update status to ringing
            call.status = 'ringing'
            await database_sync_to_async(call.save)()

            # Send incoming call notification to receiver
            receiver_group = f"calls_{call_data['receiver_id']}"
            await self.channel_layer.group_send(
                receiver_group,
                {
                    'type': 'incoming_call_notification',
                    'call': {
                        'id': call.id,
                        'caller': self.user.username,
                        'caller_id': self.user.id,
                        'call_type': call_data['call_type'],
                        'conversation_id': call_data['conversation_id'],
                        'receiver': {
                            'id': call.receiver.id,
                            'username': call.receiver.username
                        }
                    }
                }
            )

        except Call.DoesNotExist:
            print(f"Call {call_data.get('id')} not found")
        except Exception as e:
            print(f"Error initiating call: {e}")

    async def handle_accept_call(self, call_id):
        try:
            call = await database_sync_to_async(Call.objects.get)(id=call_id)
            
            if call.receiver.id != self.user.id:
                return  # Only receiver can accept

            call.status = 'ongoing'
            call.started_at = timezone.now()
            await database_sync_to_async(call.save)()

            # Notify caller that call was accepted
            caller_group = f"calls_{call.caller.id}"
            await self.channel_layer.group_send(
                caller_group,
                {
                    'type': 'call_accepted_notification',
                    'call': {
                        'id': call.id,
                        'status': 'ongoing',
                        'receiver': self.user.username,
                        'receiver_id': self.user.id
                    }
                }
            )

        except Call.DoesNotExist:
            print(f"Call {call_id} not found")
        except Exception as e:
            print(f"Error accepting call: {e}")

    async def handle_decline_call(self, call_id):
        try:
            call = await database_sync_to_async(Call.objects.get)(id=call_id)
            
            if call.receiver.id != self.user.id:
                return  # Only receiver can decline

            call.status = 'declined'
            await database_sync_to_async(call.save)()

            # Notify caller that call was declined
            caller_group = f"calls_{call.caller.id}"
            await self.channel_layer.group_send(
                caller_group,
                {
                    'type': 'call_declined_notification',
                    'call': {
                        'id': call.id,
                        'status': 'declined',
                        'receiver': self.user.username,
                        'receiver_id': self.user.id
                    }
                }
            )

        except Call.DoesNotExist:
            print(f"Call {call_id} not found")
        except Exception as e:
            print(f"Error declining call: {e}")

    async def handle_end_call(self, call_id):
        try:
            call = await database_sync_to_async(Call.objects.get)(id=call_id)
            
            if call.caller.id != self.user.id and call.receiver.id != self.user.id:
                return  # Only participants can end call

            call.status = 'ended'
            call.ended_at = timezone.now()
            if call.started_at:
                call.duration = int((call.ended_at - call.started_at).total_seconds())
            
            await database_sync_to_async(call.save)()

            # Notify other participant
            other_user_id = call.receiver.id if call.caller.id == self.user.id else call.caller.id
            other_group = f"calls_{other_user_id}"
            
            await self.channel_layer.group_send(
                other_group,
                {
                    'type': 'call_ended_notification',
                    'call': {
                        'id': call.id,
                        'status': 'ended',
                        'ended_by': self.user.username,
                        'ended_by_id': self.user.id,
                        'duration': call.duration
                    }
                }
            )

        except Call.DoesNotExist:
            print(f"Call {call_id} not found")
        except Exception as e:
            print(f"Error ending call: {e}")

    async def handle_offer(self, offer, call_id, target_user_id):
        # Forward WebRTC offer to target user
        target_group = f"calls_{target_user_id}"
        await self.channel_layer.group_send(
            target_group,
            {
                'type': 'webrtc_offer',
                'offer': offer,
                'call_id': call_id,
                'sender_id': self.user.id
            }
        )

    async def handle_answer(self, answer, call_id, target_user_id):
        # Forward WebRTC answer to target user
        target_group = f"calls_{target_user_id}"
        await self.channel_layer.group_send(
            target_group,
            {
                'type': 'webrtc_answer',
                'answer': answer,
                'call_id': call_id,
                'sender_id': self.user.id
            }
        )

    async def handle_ice_candidate(self, candidate, call_id, target_user_id):
        # Forward ICE candidate to target user
        target_group = f"calls_{target_user_id}"
        await self.channel_layer.group_send(
            target_group,
            {
                'type': 'webrtc_ice_candidate',
                'candidate': candidate,
                'call_id': call_id,
                'sender_id': self.user.id
            }
        )

    # Message handlers for channel layer
    async def incoming_call_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'incoming_call',
            'call': event['call']
        }))

    async def call_accepted_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'call_accepted',
            'call': event['call']
        }))

    async def call_declined_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'call_declined',
            'call': event['call']
        }))

    async def call_ended_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'call_ended',
            'call': event['call']
        }))

    async def webrtc_offer(self, event):
        await self.send(text_data=json.dumps({
            'type': 'offer',
            'offer': event['offer'],
            'call_id': event['call_id']
        }))

    async def webrtc_answer(self, event):
        await self.send(text_data=json.dumps({
            'type': 'answer',
            'answer': event['answer'],
            'call_id': event['call_id']
        }))

    async def webrtc_ice_candidate(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ice_candidate',
            'candidate': event['candidate'],
            'call_id': event['call_id']
        }))


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get user_id from URL
        try:
            self.user_id = int(self.scope['url_route']['kwargs']['user_id'])
            
            # Authenticate user from token parameter if provided
            token_param = self.scope['query_string'].decode().split('token=')[-1] if 'token=' in self.scope['query_string'].decode() else None
            
            if token_param:
                try:
                    token = await database_sync_to_async(Token.objects.get)(key=token_param)
                    self.user = token.user
                    
                    # Verify the authenticated user matches the URL user_id
                    if self.user.id != self.user_id:
                        await self.close()
                        return
                        
                except Token.DoesNotExist:
                    await self.close()
                    return
            else:
                # If no token, try to get user directly (for development)
                try:
                    self.user = await database_sync_to_async(User.objects.get)(id=self.user_id)
                except User.DoesNotExist:
                    await self.close()
                    return
            
            self.room_group_name = f"notifications_{self.user_id}"
            
            # Join user's personal notification group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            print(f"✅ User {self.user.username} connected to notifications")
            
        except (ValueError, KeyError):
            await self.close()
            return

    async def disconnect(self, close_code):
        # Leave user's personal notification group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            print(f"🔌 User {getattr(self, 'user', 'Unknown')} disconnected from notifications")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            elif message_type == 'mark_read':
                await self.handle_mark_read(data.get('notification_id'))
                
        except json.JSONDecodeError:
            print("Invalid JSON received in notification consumer")
        except Exception as e:
            print(f"Error handling notification message: {e}")

    async def handle_mark_read(self, notification_id):
        """Handle marking notification as read via WebSocket"""
        if not notification_id:
            return
            
        try:
            notification = await database_sync_to_async(Notification.objects.get)(
                id=notification_id, 
                user=self.user
            )
            notification.read = True
            await database_sync_to_async(notification.save)()
            
            # Send confirmation back to user
            await self.send(text_data=json.dumps({
                'type': 'notification_marked_read',
                'notification_id': notification_id
            }))
            
        except Notification.DoesNotExist:
            print(f"Notification {notification_id} not found for user {self.user.id}")
        except Exception as e:
            print(f"Error marking notification as read: {e}")

    async def notification_message(self, event):
        """Send new notification to connected client"""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))

    async def notification_read_status(self, event):
        """Send notification read status update"""
        await self.send(text_data=json.dumps({
            'type': 'notification_read_status',
            'notification_id': event['notification_id'],
            'read': event['read']
        }))
