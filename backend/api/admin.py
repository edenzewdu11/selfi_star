from django.contrib import admin
from .models import UserProfile, Reel, Vote, Quest, UserQuest, Subscription, NotificationPreference

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'xp', 'streak']
    search_fields = ['user__username']

@admin.register(Reel)
class ReelAdmin(admin.ModelAdmin):
    list_display = ['user', 'votes', 'created_at']
    search_fields = ['user__username']

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['user', 'reel', 'created_at']

@admin.register(Quest)
class QuestAdmin(admin.ModelAdmin):
    list_display = ['title', 'xp_reward', 'is_active']

@admin.register(UserQuest)
class UserQuestAdmin(admin.ModelAdmin):
    list_display = ['user', 'quest', 'completed']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'expires_at']

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'push_notifications']
