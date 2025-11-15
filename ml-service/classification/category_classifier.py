"""
Category classification module using transformer models.
Classifies queries into categories like question, complaint, compliment, etc.
"""
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Try to import transformers (optional - will use keyword-based if unavailable)
try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Transformers not available: {e}. Will use keyword-based classification only.")
    TRANSFORMERS_AVAILABLE = False
except Exception as e:
    logger.warning(f"Error importing transformers (may need Visual C++ Redistributable): {e}. Will use keyword-based classification only.")
    TRANSFORMERS_AVAILABLE = False

class CategoryClassifier:
    """Category classification using pre-trained transformer models."""
    
    # Default categories based on setup.md
    DEFAULT_CATEGORIES = [
        'question',
        'request',
        'complaint',
        'compliment',
        'bug_report',
        'feature_request',
        'support_request',
        'purchase_inquiry',
        'feedback'
    ]
    
    def __init__(self, 
                 categories: Optional[List[str]] = None,
                 model_name: str = "distilbert-base-uncased",
                 use_zero_shot: bool = True):
        """
        Initialize category classifier.
        
        Args:
            categories: List of categories to classify into
            model_name: Name of transformer model to use
            use_zero_shot: If True, use zero-shot classification (no training needed)
        """
        self.categories = categories or self.DEFAULT_CATEGORIES
        self.use_zero_shot = use_zero_shot
        self.classifier = None
        self.tokenizer = None
        self.model = None
        
        if use_zero_shot and TRANSFORMERS_AVAILABLE:
            try:
                self.classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli"
                )
                logger.info("Zero-shot classification model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load zero-shot model: {e}. Using keyword-based classification.")
                self.use_zero_shot = False
        elif use_zero_shot and not TRANSFORMERS_AVAILABLE:
            logger.info("Transformers not available. Using keyword-based classification.")
            self.use_zero_shot = False
        else:
            # For fine-tuned models, you would load your trained model here
            pass
    
    def classify_zero_shot(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """
        Classify text using zero-shot classification.
        
        Args:
            text: Input text to classify
        
        Returns:
            Tuple of (predicted_category, confidence, all_scores)
        """
        if not text or len(text.strip()) == 0:
            return ('question', 0.0, {})
        
        try:
            # Limit text length for transformer
            text_truncated = text[:512]
            
            result = self.classifier(text_truncated, self.categories)
            
            predicted_label = result['labels'][0]
            confidence = result['scores'][0]
            all_scores = dict(zip(result['labels'], result['scores']))
            
            return (predicted_label, confidence, all_scores)
        except Exception as e:
            logger.error(f"Error in zero-shot classification: {e}")
            return self.classify_keyword_based(text)
    
    def classify_keyword_based(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """
        Fallback keyword-based classification.
        
        Args:
            text: Input text to classify
        
        Returns:
            Tuple of (predicted_category, confidence, all_scores)
        """
        text_lower = text.lower()
        
        # Keyword patterns for each category
        keyword_patterns = {
            'question': ['how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'would', 'should', '?'],
            'complaint': ['complaint', 'unhappy', 'disappointed', 'frustrated', 'angry', 'terrible', 'worst', 'awful', 'horrible', 'bad'],
            'compliment': ['great', 'excellent', 'awesome', 'amazing', 'love', 'thank', 'thanks', 'appreciate', 'good job'],
            'bug_report': ['bug', 'error', 'broken', 'not working', 'issue', 'problem', 'crash', 'failed', 'failure'],
            'feature_request': ['feature', 'add', 'suggestion', 'wish', 'would like', 'could you', 'please add'],
            'request': ['request', 'need', 'want', 'require', 'looking for', 'interested in'],
            'support_request': ['help', 'support', 'assist', 'guidance', 'trouble', 'difficulty'],
            'purchase_inquiry': ['price', 'cost', 'buy', 'purchase', 'order', 'payment', 'shipping', 'delivery'],
            'feedback': ['feedback', 'opinion', 'thought', 'suggest', 'improve', 'better']
        }
        
        scores = {}
        max_score = 0
        predicted_category = 'question'  # Default
        
        for category, keywords in keyword_patterns.items():
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            score = matches / len(keywords) if keywords else 0
            scores[category] = score
            
            if score > max_score:
                max_score = score
                predicted_category = category
        
        # Normalize confidence (between 0 and 1)
        confidence = min(max_score * 2, 1.0)  # Scale up a bit for better confidence
        
        return (predicted_category, confidence, scores)
    
    def classify(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """
        Classify text into a category.
        
        Args:
            text: Input text to classify
        
        Returns:
            Tuple of (predicted_category, confidence, all_scores)
        """
        if self.use_zero_shot and self.classifier:
            return self.classify_zero_shot(text)
        else:
            return self.classify_keyword_based(text)
    
    def get_intent(self, text: str) -> str:
        """
        Extract intent from text (simplified version).
        
        Args:
            text: Input text
        
        Returns:
            Intent string
        """
        category, _, _ = self.classify(text)
        
        # Map categories to intents
        intent_mapping = {
            'question': 'information_seeking',
            'request': 'action_request',
            'complaint': 'issue_reporting',
            'compliment': 'positive_feedback',
            'bug_report': 'technical_issue',
            'feature_request': 'product_improvement',
            'support_request': 'help_needed',
            'purchase_inquiry': 'sales_interest',
            'feedback': 'general_feedback'
        }
        
        return intent_mapping.get(category, 'general')


