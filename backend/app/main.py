from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.api.markets import router as markets_router
from app.api.lots import router as lots_router
from app.api.buyers import router as buyers_router
from app.api.offers import router as offers_router
from app.api.ai_router import router as ai_router
from app.api.fpo import router as fpo_router
from app.api.logistics import router as logistics_router
from app.api.storage import router as storage_router
from app.api.quality import router as quality_router
from app.api.analytics import router as analytics_router
from app.api.grievances import router as grievances_router
from app.api.notifications import router as notifications_router

app = FastAPI(
    title="Farm2Fair API",
    description="API for the Farm2Fair Platform — Hybrid statistical + rule-based AI + FPO Aggregation + Logistics & Storage + Admin & Grievances",
    version="0.7.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(markets_router, tags=["markets"])
app.include_router(lots_router, tags=["lots"])
app.include_router(buyers_router, tags=["buyers"])
app.include_router(offers_router, tags=["offers"])
app.include_router(ai_router, tags=["ai"])
app.include_router(fpo_router, prefix="/fpo", tags=["fpo"])
app.include_router(logistics_router, prefix="/logistics", tags=["logistics"])
app.include_router(storage_router, prefix="/storage", tags=["storage"])
app.include_router(quality_router, prefix="/quality", tags=["quality"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
app.include_router(grievances_router, prefix="/grievances", tags=["grievances"])
app.include_router(notifications_router, prefix="/notifications", tags=["notifications"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Farm2Fair API v0.7 — Admin & Grievances enabled"}

