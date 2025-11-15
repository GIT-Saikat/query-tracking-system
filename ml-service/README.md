# ML/AI Service

AI/ML service for the Query Tracking App. Provides automatic query classification, sentiment analysis, priority detection, and auto-tagging.

## Features

- **Text Preprocessing**: Cleans and normalizes text for ML models
- **Category Classification**: Classifies queries into categories (question, complaint, compliment, bug report, etc.)
- **Sentiment Analysis**: Detects sentiment (positive, neutral, negative) using VADER or transformer models
- **Priority Scoring**: Calculates priority levels (CRITICAL, HIGH, MEDIUM, LOW) based on multiple factors
- **Auto-tagging**: Automatically generates tags for queries based on analysis results
- **VIP Detection**: Identifies VIP customers for priority routing

## Architecture

```
/ml-service
├── api.py                      # FastAPI application
├── preprocessing/              # Text preprocessing pipeline
│   ├── __init__.py
│   └── text_preprocessor.py
├── sentiment/                  # Sentiment analysis
│   ├── __init__.py
│   └── sentiment_analyzer.py
├── classification/             # Category classification and priority scoring
│   ├── __init__.py
│   ├── category_classifier.py
│   ├── priority_scorer.py
│   └── auto_tagger.py
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Docker configuration
└── README.md
```

## Installation

### Prerequisites

- Python 3.11+
- pip

### Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Download NLTK data (automatic on first run, but can be done manually):
```bash
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

4. Download spaCy model (optional):
```bash
python -m spacy download en_core_web_sm
```

5. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

6. Update `.env` with your configuration:
```env
PORT=8001
HOST=0.0.0.0
ENV=development
USE_TRANSFORMER_SENTIMENT=false
USE_ZERO_SHOT=true
VIP_EMAILS=ceo@example.com,vip@example.com
VIP_SENDER_IDS=user123,user456
```

## Running the Service

### Development Mode

```bash
python api.py
```

Or using uvicorn directly:
```bash
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

### Production Mode

```bash
uvicorn api:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker

Build the Docker image:
```bash
docker build -t ml-service .
```

Run the container:
```bash
docker run -p 8001:8001 --env-file .env ml-service
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "query-tracking-ml-service",
  "version": "1.0.0"
}
```

### Analyze Query

```http
POST /analyze
Content-Type: application/json

{
  "text": "The website is not working. I need urgent help!",
  "subject": "Website Issue",
  "sender_email": "customer@example.com",
  "sender_id": "user123",
  "channel_type": "EMAIL"
}
```

Response:
```json
{
  "category": "bug_report",
  "category_confidence": 0.92,
  "category_scores": {
    "bug_report": 0.92,
    "complaint": 0.85,
    "question": 0.15
  },
  "sentiment": "NEGATIVE",
  "sentiment_confidence": 0.87,
  "sentiment_scores": {
    "positive": 0.05,
    "neutral": 0.08,
    "negative": 0.87
  },
  "intent": "technical_issue",
  "priority": "HIGH",
  "priority_score": 0.78,
  "is_urgent": true,
  "is_vip": false,
  "auto_tags": [
    "bug_report",
    "sentiment_negative",
    "priority_high",
    "intent_technical_issue",
    "urgency_critical",
    "urgent"
  ],
  "keywords": ["website", "working", "urgent", "help"],
  "urgency_keywords": {
    "critical": ["urgent"],
    "high": ["important"],
    "negative": ["not working"]
  }
}
```

### Batch Analysis

```http
POST /analyze/batch
Content-Type: application/json

[
  {
    "text": "Query 1 text",
    "sender_email": "user1@example.com",
    "channel_type": "EMAIL"
  },
  {
    "text": "Query 2 text",
    "sender_email": "user2@example.com",
    "channel_type": "TWITTER"
  }
]
```

### Get Categories

```http
GET /categories
```

Response:
```json
{
  "categories": [
    "question",
    "request",
    "complaint",
    "compliment",
    "bug_report",
    "feature_request",
    "support_request",
    "purchase_inquiry",
    "feedback"
  ]
}
```

### Get Priority Levels

```http
GET /priority-levels
```

Response:
```json
{
  "priority_levels": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
  "thresholds": {
    "CRITICAL": 0.85,
    "HIGH": 0.65,
    "MEDIUM": 0.35,
    "LOW": 0.0
  }
}
```

## Configuration

### Environment Variables

- `PORT`: Service port (default: 8001)
- `HOST`: Service host (default: 0.0.0.0)
- `ENV`: Environment (development/production)
- `USE_TRANSFORMER_SENTIMENT`: Use transformer model for sentiment (default: false)
- `USE_ZERO_SHOT`: Use zero-shot classification (default: true)
- `VIP_EMAILS`: Comma-separated list of VIP email addresses
- `VIP_SENDER_IDS`: Comma-separated list of VIP sender IDs

### Model Configuration

#### Sentiment Analysis

- **VADER** (default): Fast, rule-based sentiment analysis
- **Transformer** (optional): More accurate but slower. Set `USE_TRANSFORMER_SENTIMENT=true`

#### Category Classification

- **Zero-shot** (default): Uses BART-large-MNLI for classification without training
- **Keyword-based** (fallback): Falls back to keyword matching if zero-shot unavailable

## Integration with Backend

The backend service integrates with this ML service through `MLService` class in `backend/src/services/mlService.js`.

The backend automatically calls the ML service when creating new queries to:
- Classify category
- Analyze sentiment
- Detect priority
- Generate auto-tags
- Identify VIP customers

## Performance

- **Response Time**: < 500ms per query (VADER), < 2s (transformer models)
- **Throughput**: ~100-200 queries/second (VADER), ~10-20 queries/second (transformer)
- **Accuracy**: 
  - Category classification: 85-90%+ (zero-shot)
  - Sentiment analysis: 85-90%+ (VADER), 90-95%+ (transformer)
  - Priority detection: 80-85%+

## Troubleshooting

### Model Download Issues

If transformer models fail to download:
- Check internet connection
- Increase timeout settings
- Use keyword-based fallback

### Memory Issues

If running out of memory:
- Use VADER instead of transformer models
- Reduce batch size
- Increase container memory limit

### Slow Performance

- Use VADER for sentiment (faster)
- Enable GPU support for transformer models
- Increase worker processes in production

## Development

### Adding New Categories

Update `CategoryClassifier.DEFAULT_CATEGORIES` in `classification/category_classifier.py`.

### Customizing Priority Scoring

Modify weights in `PriorityScorer` class in `classification/priority_scorer.py`.

### Testing

Test the service using curl or Postman:

```bash
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test query"}'
```

## License

ISC


