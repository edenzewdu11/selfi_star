from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from api.models_campaign import Campaign, Reward, CoinPackage, UserCoins
import random

class Command(BaseCommand):
    help = 'Create sample campaign data for testing'

    def handle(self, *args, **options):
        print("Creating sample campaign data...")
        
        # Get admin user
        try:
            admin = User.objects.get(username='admin')
        except User.DoesNotExist:
            print("Admin user not found. Please create admin user first.")
            return
        
        # Create sample campaigns
        campaigns_data = [
            {
                'title': 'Daily Selfie Challenge',
                'description': 'Share your best selfie today and win airtime rewards!',
                'campaign_type': 'daily',
                'status': 'active',
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=1),
                'total_budget': 600000,
                'max_winners': 10,
                'official_hashtag': '#SelfieStarDaily',
                'prize_title': 'Daily Airtime Reward',
                'prize_value': 50,
                'created_by': admin
            },
            {
                'title': 'Weekly Creative Contest',
                'description': 'Show your creativity and win amazing prizes!',
                'campaign_type': 'weekly',
                'status': 'active',
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=7),
                'total_budget': 500000,
                'max_winners': 5,
                'official_hashtag': '#CreativeWeekly',
                'prize_title': 'Weekly Cash Prize',
                'prize_value': 500,
                'created_by': admin
            },
            {
                'title': 'Monthly Grand Finale',
                'description': 'The ultimate monthly contest with massive rewards!',
                'campaign_type': 'grand_finale',
                'status': 'draft',
                'start_date': timezone.now() + timedelta(days=7),
                'end_date': timezone.now() + timedelta(days=37),
                'total_budget': 500000,
                'max_winners': 3,
                'official_hashtag': '#GrandFinaleMonthly',
                'prize_title': 'Grand Prize Package',
                'prize_value': 5000,
                'created_by': admin
            },
            {
                'title': 'Flash Challenge - Speed Selfie',
                'description': 'Quick! 30 minutes to post and win instant rewards!',
                'campaign_type': 'flash',
                'status': 'completed',
                'start_date': timezone.now() - timedelta(hours=2),
                'end_date': timezone.now() - timedelta(hours=1, minutes=30),
                'total_budget': 100000,
                'max_winners': 3,
                'official_hashtag': '#FlashSpeed',
                'prize_title': 'Flash Reward',
                'prize_value': 100,
                'created_by': admin
            }
        ]
        
        for campaign_data in campaigns_data:
            campaign, created = Campaign.objects.get_or_create(
                title=campaign_data['title'],
                defaults=campaign_data
            )
            if created:
                print(f"✅ Created campaign: {campaign.title}")
            else:
                print(f"📝 Campaign already exists: {campaign.title}")
        
        # Create sample rewards
        daily_campaign = Campaign.objects.get(title='Daily Selfie Challenge')
        weekly_campaign = Campaign.objects.get(title='Weekly Creative Contest')
        monthly_campaign = Campaign.objects.get(title='Monthly Grand Finale')
        
        rewards_data = [
            # Daily rewards
            {
                'campaign': daily_campaign,
                'reward_type': 'airtime',
                'title': '50 ETB Airtime',
                'description': 'Airtime reward for daily selfie winner',
                'value_etb': 50,
                'quantity': 10,
                'rank': 1
            },
            # Weekly rewards
            {
                'campaign': weekly_campaign,
                'reward_type': 'cash',
                'title': '500 ETB Cash Prize',
                'description': 'Weekly cash prize for top creator',
                'value_etb': 500,
                'quantity': 1,
                'rank': 1
            },
            {
                'campaign': weekly_campaign,
                'reward_type': 'phone',
                'title': 'Smartphone',
                'description': 'Mid-range smartphone for second place',
                'value_etb': 3000,
                'quantity': 1,
                'rank': 2
            },
            # Monthly rewards
            {
                'campaign': monthly_campaign,
                'reward_type': 'cash',
                'title': 'Major Cash Prize',
                'description': 'Grand cash prize for monthly winner',
                'value_etb': 10000,
                'quantity': 1,
                'rank': 1
            },
            {
                'campaign': monthly_campaign,
                'reward_type': 'phone',
                'title': 'Flagship Phone',
                'description': 'Latest flagship smartphone for second place',
                'value_etb': 15000,
                'quantity': 1,
                'rank': 2
            },
            {
                'campaign': monthly_campaign,
                'reward_type': 'trip',
                'title': 'Weekend Getaway',
                'description': 'All-expenses paid trip for third place',
                'value_etb': 8000,
                'quantity': 1,
                'rank': 3
            }
        ]
        
        for reward_data in rewards_data:
            reward, created = Reward.objects.get_or_create(
                campaign=reward_data['campaign'],
                rank=reward_data['rank'],
                defaults=reward_data
            )
            if created:
                print(f"✅ Created reward: {reward.title}")
            else:
                print(f"📝 Reward already exists: {reward.title}")
        
        # Create coin packages
        coin_packages_data = [
            {
                'name': 'Starter Pack',
                'coins': 100,
                'bonus_coins': 0,
                'price_etb': 10,
                'description': 'Perfect for beginners',
                'sort_order': 1
            },
            {
                'name': 'Bronze Pack',
                'coins': 300,
                'bonus_coins': 30,
                'price_etb': 25,
                'description': 'Great value with bonus coins',
                'sort_order': 2
            },
            {
                'name': 'Silver Pack',
                'coins': 700,
                'bonus_coins': 100,
                'price_etb': 50,
                'description': 'Popular choice for regular users',
                'sort_order': 3
            },
            {
                'name': 'Gold Pack',
                'coins': 1500,
                'bonus_coins': 250,
                'price_etb': 100,
                'description': 'Best value for serious creators',
                'sort_order': 4
            },
            {
                'name': 'Platinum Pack',
                'coins': 4000,
                'bonus_coins': 800,
                'price_etb': 250,
                'description': 'Ultimate coin package',
                'sort_order': 5
            },
            {
                'name': 'Diamond Pack',
                'coins': 10000,
                'bonus_coins': 3000,
                'price_etb': 500,
                'description': 'Mega pack for power users',
                'sort_order': 6
            }
        ]
        
        for package_data in coin_packages_data:
            package, created = CoinPackage.objects.get_or_create(
                name=package_data['name'],
                defaults=package_data
            )
            if created:
                print(f"✅ Created coin package: {package.name}")
            else:
                print(f"📝 Coin package already exists: {package.name}")
        
        # Create user coin accounts for existing users
        users = User.objects.all()
        for user in users:
            user_coins, created = UserCoins.objects.get_or_create(
                user=user,
                defaults={'balance': 100}  # Give everyone 100 free coins to start
            )
            if created:
                print(f"✅ Created coin account for: {user.username}")
            else:
                print(f"📝 Coin account already exists for: {user.username}")
        
        print("\n🎉 Sample campaign data created successfully!")
        print(f"📊 Campaigns created: {Campaign.objects.count()}")
        print(f"🏆 Rewards created: {Reward.objects.count()}")
        print(f"💰 Coin packages created: {CoinPackage.objects.count()}")
        print(f"👥 User coin accounts: {UserCoins.objects.count()}")
