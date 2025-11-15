from typing import Dict, List, Optional, Tuple
import logging

try:
    from ..preprocessing.text_preprocessor import TextPreprocessor
    from ..sentiment.sentiment_analyzer import SentimentAnalyzer
except ImportError:
    from preprocessing.text_preprocessor import TextPreprocessor
    from sentiment.sentiment_analyzer import SentimentAnalyzer
from .category_classifier import CategoryClassifier
from .priority_scorer import PriorityScorer

logger = logging.getLogger(__name__)

class AutoTagger:
    
    def __init__(self,
                 use_transformer_sentiment: bool = False,
                 use_zero_shot_classification: bool = True,
                 vip_emails: Optional[List[str]] = None,
                 vip_sender_ids: Optional[List[str]] = None):
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
        if not text or len(text.strip()) == 0:
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
        
        full_text = text
        if subject:
            full_text = f"{subject} {text}"
        
        cleaned_text = self.preprocessor.clean_text(full_text)
        
        keywords = self.preprocessor.extract_keywords(cleaned_text)
        
        urgency_keywords = self.preprocessor.detect_urgency_keywords(cleaned_text)
        
        sentiment_result = self.sentiment_analyzer.analyze(cleaned_text)
        
        category, category_confidence, category_scores = self.category_classifier.classify(cleaned_text)
        
        intent = self.category_classifier.get_intent(cleaned_text)
        
        priority, priority_score, is_urgent = self.priority_scorer.classify_priority(
            text=cleaned_text,
            sentiment=sentiment_result['sentiment'],
            sentiment_confidence=sentiment_result['confidence'],
            category=category,
            sender_email=sender_email,
            sender_id=sender_id,
            channel_type=channel_type
        )
        
        is_vip = self.priority_scorer.check_vip_status(sender_email, sender_id)
        
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
        tags = []
        
        tags.append(category)
        
        tags.append(f"sentiment_{sentiment.lower()}")
        
        tags.append(f"priority_{priority.lower()}")
        
        tags.append(f"intent_{intent}")
        
        for category_type, keywords in urgency_keywords.items():
            if keywords:
                tags.append(f"urgency_{category_type}")
        
        if is_vip:
            tags.append('vip')
        
        if is_urgent:
            tags.append('urgent')
        
        return tags


