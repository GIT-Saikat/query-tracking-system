"""
Auto-tagging module that combines all ML models.
Provides real-time classification, sentiment analysis, and priority detection.
"""
from typing import Dict, List, Optional, Tuple
import logging

try:
    # Try relative imports first (when run as a package)
    from ..preprocessing.text_preprocessor import TextPreprocessor
    from ..sentiment.sentiment_analyzer import SentimentAnalyzer
except ImportError:
    # Fall back to absolute imports (when run as a script)
    from preprocessing.text_preprocessor import TextPreprocessor
    from sentiment.sentiment_analyzer import SentimentAnalyzer
from .category_classifier import CategoryClassifier
from .priority_scorer import PriorityScorer

logger = logging.getLogger(__name__)

class AutoTagger:
    """Auto-tagging system that combines all ML models."""
    
    def __init__(self,
                 use_transformer_sentiment: bool = False,
                 use_zero_shot_classification: bool = True,
                 vip_emails: Optional[List[str]] = None,
                 vip_sender_ids: Optional[List[str]] = None):
        """
        Initialize auto-tagging system.
        
        Args:
            use_transformer_sentiment: If True, use transformer model for sentiment
            use_zero_shot_classification: If True, use zero-shot classification
            vip_emails: List of VIP customer email addresses
            vip_sender_ids: List of VIP customer sender IDs
        """
        self.preprocessor = TextPreprocessor()
        self.sentiment_analyzer = SentimentAnalyzer(use_transformer=use_transformer_sentiment)
        self.category_classifier = CategoryClassifier(use_zero_shot=use_zero_shot_classification)
        self.priority_scorer = PriorityScorer(
            vip_emails=vip_emails,
            vip_sender_ids=vip_sender_ids
        )
    
    def analyze(self,
                text: str,
                sender_email: Optional[str] = None,
                sender_id: Optional[str] = None,
                channel_type: Optional[str] = None,
                subject: Optional[str] = None) -> Dict:
        """
        Perform complete analysis of query text.
        
        Args:
            text: Query content
            sender_email: Sender email address
            sender_id: Sender ID
            channel_type: Channel type
            subject: Query subject (if available)
        
        Returns:
            Dictionary with all analysis results
        """
        if not text or len(text.strip()) == 0:
            # Return default values for empty text
            return {
                'category': 'question',
                'category_confidence': 0.0,
                'category_scores': {},
                'sentiment': 'NEUTRAL',
                'sentiment_confidence': 0.0,
                'sentiment_scores': {'positive': 0.0, 'neutral': 1.0, 'negative': 0.0},
                'intent': 'general',
                'priority': 'MEDIUM',
                'priority_score': 0.5,
                'is_urgent': False,
                'is_vip': False,
                'auto_tags': [],
                'keywords': []
            }
        
        # Combine subject and content for better analysis
        full_text = text
        if subject:
            full_text = f"{subject} {text}"
        
        # Preprocess text
        cleaned_text = self.preprocessor.clean_text(full_text)
        
        # Extract keywords
        keywords = self.preprocessor.extract_keywords(cleaned_text)
        
        # Detect urgency keywords
        urgency_keywords = self.preprocessor.detect_urgency_keywords(cleaned_text)
        
        # Sentiment analysis
        sentiment_result = self.sentiment_analyzer.analyze(cleaned_text)
        
        # Category classification
        category, category_confidence, category_scores = self.category_classifier.classify(cleaned_text)
        
        # Intent recognition
        intent = self.category_classifier.get_intent(cleaned_text)
        
        # Priority scoring
        priority, priority_score, is_urgent = self.priority_scorer.classify_priority(
            text=cleaned_text,
            sentiment=sentiment_result['sentiment'],
            sentiment_confidence=sentiment_result['confidence'],
            category=category,
            sender_email=sender_email,
            sender_id=sender_id,
            channel_type=channel_type
        )
        
        # Check VIP status
        is_vip = self.priority_scorer.check_vip_status(sender_email, sender_id)
        
        # Generate auto-tags
        auto_tags = self._generate_tags(
            category=category,
            sentiment=sentiment_result['sentiment'],
            priority=priority,
            urgency_keywords=urgency_keywords,
            intent=intent,
            is_vip=is_vip,
            is_urgent=is_urgent
        )
        
        return {
            'category': category,
            'category_confidence': category_confidence,
            'category_scores': category_scores,
            'sentiment': sentiment_result['sentiment'],
            'sentiment_confidence': sentiment_result['confidence'],
            'sentiment_scores': {
                'positive': sentiment_result['positive'],
                'neutral': sentiment_result['neutral'],
                'negative': sentiment_result['negative']
            },
            'intent': intent,
            'priority': priority,
            'priority_score': priority_score,
            'is_urgent': is_urgent,
            'is_vip': is_vip,
            'auto_tags': auto_tags,
            'keywords': keywords,
            'urgency_keywords': urgency_keywords
        }
    
    def _generate_tags(self,
                      category: str,
                      sentiment: str,
                      priority: str,
                      urgency_keywords: Dict,
                      intent: str,
                      is_vip: bool,
                      is_urgent: bool) -> List[str]:
        """Generate auto-tags based on analysis results."""
        tags = []
        
        # Category tag
        tags.append(category)
        
        # Sentiment tag
        tags.append(f"sentiment_{sentiment.lower()}")
        
        # Priority tag
        tags.append(f"priority_{priority.lower()}")
        
        # Intent tag
        tags.append(f"intent_{intent}")
        
        # Urgency keywords as tags
        for category_type, keywords in urgency_keywords.items():
            if keywords:
                tags.append(f"urgency_{category_type}")
        
        # VIP tag
        if is_vip:
            tags.append('vip')
        
        # Urgent tag
        if is_urgent:
            tags.append('urgent')
        
        return tags


