"""
Sentiment analysis module using VADER and transformer models.
"""
from typing import Dict, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """Sentiment analysis using VADER and optionally transformer models."""
    
    def __init__(self, use_transformer: bool = False):
        """
        Initialize sentiment analyzer.
        
        Args:
            use_transformer: If True, use transformer model for better accuracy (slower)
        """
        self.use_transformer = use_transformer
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.transformer_model = None
        self.transformer_tokenizer = None
        
        if use_transformer:
            try:
                from transformers import pipeline
                self.sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    return_all_scores=True
                )
                logger.info("Transformer sentiment model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load transformer model: {e}. Falling back to VADER.")
                self.use_transformer = False
    
    def analyze_vader(self, text: str) -> Dict[str, any]:
        """
        Analyze sentiment using VADER.
        
        Args:
            text: Input text to analyze
        
        Returns:
            Dictionary with sentiment scores and classification
        """
        scores = self.vader_analyzer.polarity_scores(text)
        
        # Determine sentiment label
        compound = scores['compound']
        if compound >= 0.05:
            sentiment = 'POSITIVE'
        elif compound <= -0.05:
            sentiment = 'NEGATIVE'
        else:
            sentiment = 'NEUTRAL'
        
        return {
            'sentiment': sentiment,
            'positive': scores['pos'],
            'neutral': scores['neu'],
            'negative': scores['neg'],
            'compound': compound,
            'confidence': abs(compound)
        }
    
    def analyze_transformer(self, text: str) -> Dict[str, any]:
        """
        Analyze sentiment using transformer model.
        
        Args:
            text: Input text to analyze
        
        Returns:
            Dictionary with sentiment scores and classification
        """
        if not self.use_transformer or self.sentiment_pipeline is None:
            return self.analyze_vader(text)
        
        try:
            results = self.sentiment_pipeline(text[:512])  # Limit length for transformer
            
            # Map transformer labels to our sentiment labels
            label_mapping = {
                'LABEL_0': 'NEGATIVE',
                'LABEL_1': 'NEUTRAL',
                'LABEL_2': 'POSITIVE'
            }
            
            scores = {}
            max_score = 0
            predicted_label = 'NEUTRAL'
            
            for result in results[0]:
                label = label_mapping.get(result['label'], result['label'])
                score = result['score']
                scores[label.lower()] = score
                
                if score > max_score:
                    max_score = score
                    predicted_label = label
            
            return {
                'sentiment': predicted_label,
                'positive': scores.get('positive', 0.0),
                'neutral': scores.get('neutral', 0.0),
                'negative': scores.get('negative', 0.0),
                'confidence': max_score
            }
        except Exception as e:
            logger.error(f"Error in transformer sentiment analysis: {e}")
            return self.analyze_vader(text)
    
    def analyze(self, text: str) -> Dict[str, any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Input text to analyze
        
        Returns:
            Dictionary with sentiment classification and scores
        """
        if not text or len(text.strip()) == 0:
            return {
                'sentiment': 'NEUTRAL',
                'positive': 0.0,
                'neutral': 1.0,
                'negative': 0.0,
                'confidence': 0.0
            }
        
        if self.use_transformer:
            return self.analyze_transformer(text)
        else:
            return self.analyze_vader(text)


