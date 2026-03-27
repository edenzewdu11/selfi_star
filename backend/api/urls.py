from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    register, login, create_post, UserProfileViewSet, ReelViewSet, QuestViewSet,
    SubscriptionViewSet, NotificationPreferenceViewSet
)

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'reels', ReelViewSet, basename='reel')
router.register(r'quests', QuestViewSet, basename='quest')
router.register(r'subscription', SubscriptionViewSet, basename='subscription')
router.register(r'notifications', NotificationPreferenceViewSet, basename='notification')

urlpatterns = [
    path('auth/register/', register, name='auth-register'),
    path('auth/login/', login, name='auth-login'),
    path('posts/create/', create_post, name='create-post'),
    path('', include(router.urls)),
]
