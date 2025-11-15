"""
Text preprocessing pipeline for query content.
Handles cleaning, normalization, and preparation for ML models.
"""
import re
import string
import unicodedata
from typing import List, Optional
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)

class TextPreprocessor:
    """Text preprocessing pipeline for ML models."""
    
    def __init__(self, 
                 remove_stopwords: bool = True,
                 remove_urls: bool = True,
                 remove_emails: bool = True,
                 remove_mentions: bool = True,
                 remove_hashtags: bool = False,
                 lowercase: bool = True,
                 normalize_unicode: bool = True):
        """Initialize text preprocessor with configuration options."""
        self.remove_stopwords = remove_stopwords
        self.remove_urls = remove_urls
        self.remove_emails = remove_emails
        self.remove_mentions = remove_mentions
        self.remove_hashtags = remove_hashtags
        self.lowercase = lowercase
        self.normalize_unicode = normalize_unicode
        
        try:
            self.stop_words = set(stopwords.words('english'))
        except LookupError:
            nltk.download('stopwords', quiet=True)
            self.stop_words = set(stopwords.words('english'))
        
        self.stemmer = PorterStemmer()
    
    def clean_text(self, text: str) -> str:
        """Main preprocessing function."""
        if not text or not isinstance(text, str):
            return ""
        
        # Normalize unicode
        if self.normalize_unicode:
            text = unicodedata.normalize('NFKD', text)
        
        # Remove URLs
        if self.remove_urls:
            text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
            text = re.sub(r'www\.(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        if self.remove_emails:
            text = re.sub(r'\S+@\S+', '', text)
        
        # Remove mentions (e.g., @username)
        if self.remove_mentions:
            text = re.sub(r'@\w+', '', text)
        
        # Remove hashtags (optional - keep by default for context)
        if self.remove_hashtags:
            text = re.sub(r'#\w+', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Convert to lowercase
        if self.lowercase:
            text = text.lower()
        
        return text
    
    def tokenize(self, text: str) -> List[str]:
        """Tokenize text into words."""
        try:
            tokens = word_tokenize(text)
            return tokens
        except:
            # Fallback to simple split
            return text.split()
    
    def remove_stopwords_from_tokens(self, tokens: List[str]) -> List[str]:
        """Remove stopwords from token list."""
        if not self.remove_stopwords:
            return tokens
        return [token for token in tokens if token not in self.stop_words]
    
    def stem_tokens(self, tokens: List[str]) -> List[str]:
        """Stem tokens using Porter stemmer."""
        return [self.stemmer.stem(token) for token in tokens]
    
    def preprocess(self, text: str, 
                   tokenize: bool = False,
                   stem: bool = False) -> str | List[str]:
        """
        Complete preprocessing pipeline.
        
        Args:
            text: Input text to preprocess
            tokenize: If True, return list of tokens; if False, return cleaned string
            stem: If True, apply stemming (only works with tokenize=True)
        
        Returns:
            Preprocessed text as string or list of tokens
        """
        cleaned = self.clean_text(text)
        
        if tokenize:
            tokens = self.tokenize(cleaned)
            tokens = self.remove_stopwords_from_tokens(tokens)
            
            if stem:
                tokens = self.stem_tokens(tokens)
            
            # Filter out punctuation and short tokens
            tokens = [t for t in tokens if len(t) > 1 and t not in string.punctuation]
            return tokens
        
        return cleaned
    
    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """Extract keywords from text."""
        tokens = self.preprocess(text, tokenize=True)
        
        # Filter out common words and short tokens
        keywords = [t for t in tokens if len(t) > 3 and t.isalnum()]
        
        # Return top keywords by frequency
        from collections import Counter
        keyword_counts = Counter(keywords)
        return [word for word, _ in keyword_counts.most_common(max_keywords)]
    
    def detect_urgency_keywords(self, text: str) -> dict:
        """Detect urgency-related keywords in text."""
        urgency_keywords = {
            'critical': ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'now', 'crisis'],
            'high': ['important', 'soon', 'quickly', 'priority', 'needed', 'required'],
            'negative': ['broken', 'error', 'bug', 'issue', 'problem', 'failed', 'not working', 'down'],
            'positive': ['thank', 'great', 'excellent', 'awesome', 'love', 'amazing'],
            'question': ['how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'would'],
            'complaint': ['complaint', 'unhappy', 'disappointed', 'frustrated', 'angry', 'terrible', 'worst'],
            'compliment': ['compliment', 'praise', 'appreciate', 'happy', 'satisfied', 'pleased']
        }
        
        text_lower = text.lower()
        detected = {}
        
        for category, keywords in urgency_keywords.items():
            matches = [kw for kw in keywords if kw in text_lower]
            if matches:
                detected[category] = matches
        
        return detected


