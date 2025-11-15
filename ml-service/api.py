from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict
import logging
import os
from dotenv import load_dotenv

from classification.auto_tagger import AutoTagger

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Query Tracking ML Service",
    description="AI/ML service for query classification, sentiment analysis, and priority detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vip_emails = os.getenv('VIP_EMAILS', '').split(',') if os.getenv('VIP_EMAILS') else []
vip_sender_ids = os.getenv('VIP_SENDER_IDS', '').split(',') if os.getenv('VIP_SENDER_IDS') else []

use_transformer_sentiment = os.getenv('USE_TRANSFORMER_SENTIMENT', 'false').lower() == 'true'
use_zero_shot = os.getenv('USE_ZERO_SHOT', 'true').lower() == 'true'

try:
    auto_tagger = AutoTagger(
        use_transformer_sentiment=use_transformer_sentiment,
        use_zero_shot_classification=use_zero_shot,
        vip_emails=[email.strip() for email in vip_emails if email.strip()],
        vip_sender_ids=[sender_id.strip() for sender_id in vip_sender_ids if sender_id.strip()]
    )
    logger.info("Auto-tagger initialized successfully")
except Exception as e:
    logger.error(f"Error initializing auto-tagger: {e}")
    raise

class AnalyzeQueryRequest(BaseModel):
    text: str = Field(...)
    subject: Optional[str] = Field(None)
    sender_email: Optional[str] = Field(None)
    sender_id: Optional[str] = Field(None)
    channel_type: Optional[str] = Field(None)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "text": "The website is not working. I need urgent help!",
                "subject": "Website Issue",
                "sender_email": "customer@example.com",
                "sender_id": "user123",
                "channel_type": "EMAIL"
            }
        }
    )

class AnalyzeQueryResponse(BaseModel):
    category: str
    category_confidence: float
    category_scores: Dict[str, float]
    sentiment: str
    sentiment_confidence: float
    sentiment_scores: Dict[str, float]
    intent: str
    priority: str
    priority_score: float
    is_urgent: bool
    is_vip: bool
    auto_tags: List[str]
    keywords: List[str]
    urgency_keywords: Dict[str, List[str]]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

@app.get("/", response_model=HealthResponse)
async def root():
    return {
        "status": "healthy",
        "service": "query-tracking-ml-service",
        "version": "1.0.0"
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    return {
        "status": "healthy",
        "service": "query-tracking-ml-service",
        "version": "1.0.0"
    }

@app.post("/analyze", response_model=AnalyzeQueryResponse)
async def analyze_query(request: AnalyzeQueryRequest):
    try:
        result = auto_tagger.analyze(
            text=request.text,
            subject=request.subject,
            sender_email=request.sender_email,
            sender_id=request.sender_id,
            channel_type=request.channel_type
        )

        return AnalyzeQueryResponse(**result)
    except Exception as e:
        logger.error(f"Error analyzing query: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing query: {str(e)}")

@app.post("/analyze/batch")
async def analyze_batch(requests: List[AnalyzeQueryRequest]):
    try:
        results = []
        for request in requests:
            result = auto_tagger.analyze(
                text=request.text,
                subject=request.subject,
                sender_email=request.sender_email,
                sender_id=request.sender_id,
                channel_type=request.channel_type
            )
            results.append(result)

        return {"results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error in batch analysis: {str(e)}")

@app.get("/categories")
async def get_categories():
    return {
        "categories": auto_tagger.category_classifier.categories
    }

@app.get("/priority-levels")
async def get_priority_levels():
    return {
        "priority_levels": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
        "thresholds": auto_tagger.priority_scorer.PRIORITY_THRESHOLDS
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "api:app",
        host=host,
        port=port,
        reload=os.getenv("ENV", "development") == "development"
    )
