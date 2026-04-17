"""
Campaign Scoring Engine
Handles scoring, ranking, and winner selection for all campaign types.
"""
import random
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from datetime import timedelta


def calculate_user_score(campaign, user, entry=None):
    """
    Calculate a user's score for a campaign based on their engagement,
    consistency, and gamification activity.
    """
    from .models import Reel, Comment, Vote
    from .models_campaign import CampaignEntry

    score = 0
    now = timezone.now()
    start = campaign.start_date
    end = min(campaign.end_date, now)

    # Get user's reels within the campaign period
    user_reels = Reel.objects.filter(
        user=user,
        created_at__gte=start,
        created_at__lte=end,
    )

    # --- Engagement Score ---
    total_likes = user_reels.aggregate(s=Sum('votes'))['s'] or 0
    total_comments = Comment.objects.filter(reel__in=user_reels).count()

    score += total_likes * campaign.like_points
    score += total_comments * campaign.comment_points

    # --- Consistency Score ---
    # Count unique days user posted
    post_dates = set(
        user_reels.values_list('created_at__date', flat=True)
    )
    days_in_period = max(1, (end.date() - start.date()).days + 1)
    posting_days = len(post_dates)

    # Streak calculation
    if posting_days > 0:
        sorted_dates = sorted(post_dates)
        max_streak = 1
        current_streak = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 1

        streak_points = max_streak * campaign.streak_bonus
        if campaign.streak_multiplier_enabled and max_streak >= 3:
            streak_points = int(streak_points * (1 + max_streak * 0.1))
        score += streak_points

        # Completion bonus: posted every day in period
        if posting_days >= days_in_period and days_in_period >= 3:
            score += campaign.completion_bonus

    # Inactivity penalty
    inactive_days = max(0, days_in_period - posting_days)
    score -= inactive_days * campaign.inactivity_penalty
    score = max(0, score)

    # --- Gamification Bonuses ---
    score += campaign.login_bonus_points * posting_days
    score += campaign.spin_reward_points * min(posting_days, 7)

    return score


def rank_entries(campaign):
    """
    Calculate scores and rank all entries for a campaign.
    Returns list of (entry, score) sorted by score descending.
    """
    from .models_campaign import CampaignEntry

    entries = CampaignEntry.objects.filter(
        campaign=campaign,
        approved=True,
        disqualified=False,
    ).select_related('user', 'reel')

    scored = []
    for entry in entries:
        score = calculate_user_score(campaign, entry.user, entry)
        # Add entry vote count for Grand campaigns
        if campaign.campaign_type == 'grand_finale':
            vote_score = entry.vote_count * campaign.public_vote_weight / 100
            judge_score = score * campaign.judge_weight / 100
            total = judge_score + vote_score
        else:
            total = score
        scored.append((entry, total))

    scored.sort(key=lambda x: x[1], reverse=True)

    # Update ranks
    for rank, (entry, sc) in enumerate(scored, 1):
        entry.rank = rank
        entry.save(update_fields=['rank'])

    return scored


def select_daily_winners(campaign):
    """
    Daily Campaign: hybrid selection.
    - daily_score_pct% winners by top score
    - daily_random_pct% winners by random from remaining valid entries
    """
    from .models_campaign import CampaignEntry, CampaignWinner

    max_winners = campaign.max_winners or campaign.winner_count or 1
    scored = rank_entries(campaign)

    if not scored:
        return []

    score_count = max(1, int(max_winners * campaign.daily_score_pct / 100))
    random_count = max_winners - score_count

    winners = []

    # Top score winners
    for entry, sc in scored[:score_count]:
        winners.append(entry)

    # Random winners from remaining
    remaining = [e for e, s in scored[score_count:]]
    if remaining and random_count > 0:
        random_winners = random.sample(remaining, min(random_count, len(remaining)))
        winners.extend(random_winners)

    # Create winner records
    results = []
    for rank, entry in enumerate(winners, 1):
        w, created = CampaignWinner.objects.get_or_create(
            campaign=campaign,
            entry=entry,
            defaults={'user': entry.user, 'rank': rank}
        )
        if created:
            entry.is_winner = True
            entry.save(update_fields=['is_winner'])
        results.append(w)

    return results


def select_score_winners(campaign):
    """
    Weekly/Monthly Campaign: pure score-based selection.
    Enforces once-per-cycle rule.
    """
    from .models_campaign import CampaignEntry, CampaignWinner

    max_winners = campaign.max_winners or campaign.winner_count or 1
    scored = rank_entries(campaign)

    if not scored:
        return []

    # Get previous winners if once_per_cycle enabled
    previous_winner_ids = set()
    if campaign.once_per_cycle:
        previous_winner_ids = set(
            CampaignWinner.objects.filter(campaign=campaign)
            .values_list('user_id', flat=True)
        )

    winners = []
    for entry, sc in scored:
        if len(winners) >= max_winners:
            break
        if campaign.once_per_cycle and entry.user_id in previous_winner_ids:
            continue
        winners.append(entry)

    results = []
    for rank, entry in enumerate(winners, 1):
        w, created = CampaignWinner.objects.get_or_create(
            campaign=campaign,
            entry=entry,
            defaults={'user': entry.user, 'rank': rank}
        )
        if created:
            entry.is_winner = True
            entry.save(update_fields=['is_winner'])
        results.append(w)

    return results


def select_grand_winners(campaign):
    """
    Grand Campaign: combination of judge scoring + public votes.
    Only callable after voting phase ends.
    """
    from .models_campaign import CampaignEntry, CampaignWinner

    max_winners = campaign.max_winners or campaign.winner_count or 1
    scored = rank_entries(campaign)

    if not scored:
        return []

    results = []
    for rank, (entry, sc) in enumerate(scored[:max_winners], 1):
        w, created = CampaignWinner.objects.get_or_create(
            campaign=campaign,
            entry=entry,
            defaults={'user': entry.user, 'rank': rank}
        )
        if created:
            entry.is_winner = True
            entry.save(update_fields=['is_winner'])
        results.append(w)

    return results


def update_campaign_lifecycle(campaign):
    """
    Auto-transition Grand Campaign statuses based on dates.
    upcoming -> active -> voting -> completed
    """
    if not campaign.auto_lifecycle:
        return False

    now = timezone.now()
    changed = False

    if campaign.campaign_type == 'grand_finale':
        if campaign.status == 'upcoming' and now >= campaign.start_date:
            campaign.status = 'active'
            changed = True
        if campaign.status == 'active' and campaign.voting_start_date and now >= campaign.voting_start_date:
            campaign.status = 'voting'
            changed = True
        if campaign.status == 'voting' and now >= campaign.end_date:
            campaign.status = 'completed'
            changed = True
    else:
        if campaign.status in ('draft', 'upcoming') and now >= campaign.start_date:
            campaign.status = 'active'
            changed = True
        if campaign.status == 'active' and now >= campaign.end_date:
            campaign.status = 'completed'
            changed = True

    if changed:
        campaign.save(update_fields=['status'])

    return changed


def get_leaderboard(campaign, limit=20):
    """Get scored leaderboard for a campaign."""
    scored = rank_entries(campaign)
    return [
        {
            'rank': i + 1,
            'user_id': entry.user_id,
            'username': entry.user.username,
            'score': round(sc, 1),
            'votes': entry.vote_count,
            'is_winner': entry.is_winner,
            'entry_id': entry.id,
        }
        for i, (entry, sc) in enumerate(scored[:limit])
    ]
