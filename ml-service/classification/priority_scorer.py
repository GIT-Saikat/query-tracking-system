"""
Priority scoring algorithm for query prioritization.
Determines priority level (CRITICAL, HIGH, MEDIUM, LOW) based on multiple factors.
"""
from typing import Dict, List, Optional, Tuple
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PriorityScorer:
    """Priority scoring and classification system."""
    
    # Priority thresholds
    PRIORITY_THRESHOLDS = {
        'CRITICAL': 0.85,
        'HIGH': 0.65,
        'MEDIUM': 0.35,
        'LOW': 0.0
    }
    
    def __init__(self, vip_emails: Optional[List[str]] = None, vip_sender_ids: Optional[List[str]] = None):
        """
        Initialize priority scorer.
        
        Args:
            vip_emails: List of VIP customer email addresses
            vip_sender_ids: List of VIP customer sender IDs
        """
        self.vip_emails = set(vip_emails or [])
        self.vip_sender_ids = set(vip_sender_ids or [])
        
        # Urgency keywords with weights
        self.urgency_keywords = {
            'critical': {
                'keywords': ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'now', 'crisis', 'down', 'broken', 'not working'],
                'weight': 0.5
            },
            'high': {
                'keywords': ['important', 'soon', 'quickly', 'priority', 'needed', 'required', 'issue', 'problem'],
                'weight': 0.3
            },
            'negative': {
                'keywords': ['angry', 'frustrated', 'disappointed', 'terrible', 'worst', 'awful', 'unacceptable'],
                'weight': 0.2
            }
        }
        
        # Negative sentiment weight
        self.negative_sentiment_weight = 0.2
    
    def check_vip_status(self, sender_email: Optional[str] = None, sender_id: Optional[str] = None) -> bool:
        """Check if sender is a VIP customer."""
        if sender_email and sender_email.lower() in self.vip_emails:
            return True
        if sender_id and sender_id in self.vip_sender_ids:
            return True
        return False
    
    def score_urgency_keywords(self, text: str) -> float:
        """Score based on urgency keywords in text."""
        text_lower = text.lower()
        total_score = 0.0
        
        for level, config in self.urgency_keywords.items():
            keywords = config['keywords']
            weight = config['weight']
            
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > 0:
                # Score increases with number of matches (capped)
                match_score = min(matches / len(keywords), 1.0)
                total_score += match_score * weight
        
        return min(total_score, 1.0)
    
    def score_sentiment(self, sentiment: str, sentiment_confidence: float) -> float:
        """Score based on sentiment (negative sentiment increases priority)."""
        if sentiment == 'NEGATIVE':
            return self.negative_sentiment_weight * sentiment_confidence
        elif sentiment == 'POSITIVE':
            return 0.0  # Positive sentiment doesn't increase priority
        else:
            return 0.0
    
    def score_category(self, category: str) -> float:
        """Score based on category type."""
        category_weights = {
            'bug_report': 0.3,
            'complaint': 0.25,
            'support_request': 0.2,
            'question': 0.1,
            'compliment': 0.0,
            'feedback': 0.05,
            'feature_request': 0.1,
            'purchase_inquiry': 0.15,
            'request': 0.15
        }
        return category_weights.get(category, 0.1)
    
    def score_channel(self, channel_type: Optional[str] = None) -> float:
        """Score based on channel type (some channels are more urgent)."""
        channel_weights = {
            'WEBSITE_CHAT': 0.2,  # Real-time chat is more urgent
            'EMAIL': 0.1,
            'TWITTER': 0.15,  # Public visibility
            'FACEBOOK': 0.1,
            'INSTAGRAM': 0.1,
            'LINKEDIN': 0.1,
            'DISCORD': 0.15,
            'SLACK': 0.15,
            'TEAMS': 0.15,
            'WHATSAPP': 0.15
        }
        return channel_weights.get(channel_type, 0.1) if channel_type else 0.1
    
    def score_length(self, text: str) -> float:
        """Very long or very short messages might indicate urgency."""
        word_count = len(text.split())
        
        # Extremely short (< 5 words) or extremely long (> 200 words) might indicate urgency
        if word_count < 5:
            return 0.05  # Very brief might be urgent
        elif word_count > 200:
            return 0.05  # Long complaint might be urgent
        else:
            return 0.0
    
    def calculate_priority_score(self,
                                 text: str,
                                 sentiment: str = 'NEUTRAL',
                                 sentiment_confidence: float = 0.0,
                                 category: str = 'question',
                                 sender_email: Optional[str] = None,
                                 sender_id: Optional[str] = None,
                                 channel_type: Optional[str] = None,
                                 is_vip: Optional[bool] = None) -> float:
        """
        Calculate overall priority score (0.0 to 1.0).
        
        Args:
            text: Query content
            sentiment: Sentiment classification
            sentiment_confidence: Confidence of sentiment analysis
            category: Category classification
            sender_email: Sender email address
            sender_id: Sender ID
            channel_type: Channel type
            is_vip: Explicit VIP status (if None, will check)
        
        Returns:
            Priority score between 0.0 and 1.0
        """
        scores = []
        
        # Check VIP status
        if is_vip is None:
            is_vip = self.check_vip_status(sender_email, sender_id)
        
        if is_vip:
            scores.append(0.3)  # VIP customers get priority boost
        
        # Urgency keywords
        urgency_score = self.score_urgency_keywords(text)
        scores.append(urgency_score)
        
        # Sentiment
        sentiment_score = self.score_sentiment(sentiment, sentiment_confidence)
        scores.append(sentiment_score)
        
        # Category
        category_score = self.score_category(category)
        scores.append(category_score)
        
        # Channel
        channel_score = self.score_channel(channel_type)
        scores.append(channel_score)
        
        # Length
        length_score = self.score_length(text)
        scores.append(length_score)
        
        # Combine scores (weighted sum, capped at 1.0)
        total_score = sum(scores)
        total_score = min(total_score, 1.0)
        
        return total_score
    
    def determine_priority(self, score: float) -> str:
        """
        Determine priority level from score.
        
        Args:
            score: Priority score (0.0 to 1.0)
        
        Returns:
            Priority level string (CRITICAL, HIGH, MEDIUM, LOW)
        """
        if score >= self.PRIORITY_THRESHOLDS['CRITICAL']:
            return 'CRITICAL'
        elif score >= self.PRIORITY_THRESHOLDS['HIGH']:
            return 'HIGH'
        elif score >= self.PRIORITY_THRESHOLDS['MEDIUM']:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def classify_priority(self,
                          text: str,
                          sentiment: str = 'NEUTRAL',
                          sentiment_confidence: float = 0.0,
                          category: str = 'question',
                          sender_email: Optional[str] = None,
                          sender_id: Optional[str] = None,
                          channel_type: Optional[str] = None,
                          is_vip: Optional[bool] = None) -> Tuple[str, float, bool]:
        """
        Classify priority level and determine if urgent.
        
        Args:
            text: Query content
            sentiment: Sentiment classification
            sentiment_confidence: Confidence of sentiment analysis
            category: Category classification
            sender_email: Sender email address
            sender_id: Sender ID
            channel_type: Channel type
            is_vip: Explicit VIP status
        
        Returns:
            Tuple of (priority_level, score, is_urgent)
        """
        score = self.calculate_priority_score(
            text=text,
            sentiment=sentiment,
            sentiment_confidence=sentiment_confidence,
            category=category,
            sender_email=sender_email,
            sender_id=sender_id,
            channel_type=channel_type,
            is_vip=is_vip
        )
        
        priority = self.determine_priority(score)
        
        # Urgent if score >= HIGH threshold or is CRITICAL
        is_urgent = score >= self.PRIORITY_THRESHOLDS['HIGH']
        
        return (priority, score, is_urgent)


