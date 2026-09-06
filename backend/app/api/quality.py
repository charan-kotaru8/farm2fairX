from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.supabase_client import get_supabase_admin

router = APIRouter()


class QualityVerificationRequest(BaseModel):
    lot_id: str
    transport_assignment_id: Optional[str] = None
    verifier_id: Optional[str] = None
    verifier_name: str
    verifier_role: Optional[str] = "Buyer Inspector"
    verified_grade: str  # 'A', 'B', 'C'
    verified_moisture_pct: float
    verified_foreign_matter_pct: float
    grain_damage_pct: Optional[float] = 0.8
    notes: Optional[str] = None


@router.post("/verify")
def record_quality_verification(req: QualityVerificationRequest):
    """
    Buyer-owned quality inspection at pickup (§6.2).
    Records verified parameters and generates a verifiable Before/After comparison.
    """
    sb = get_supabase_admin()

    # 1. Fetch lot declared values
    lot_res = sb.table("lots").select("*").eq("id", req.lot_id).maybe_single().execute()
    if not lot_res.data:
        raise HTTPException(status_code=404, detail="Lot not found")
    lot = lot_res.data

    declared_grade = lot.get("quality_grade") or "A"
    declared_moisture = float(lot.get("declared_moisture_pct") or 10.0)
    declared_foreign_matter = float(lot.get("declared_foreign_matter_pct") or 1.5)

    grade_matched = (req.verified_grade.strip().upper() == declared_grade.strip().upper())

    now = datetime.utcnow().isoformat()
    verification_payload = {
        "lot_id": req.lot_id,
        "transport_assignment_id": req.transport_assignment_id or lot.get("transport_assignment_id"),
        "verifier_id": req.verifier_id,
        "verifier_name": req.verifier_name,
        "verifier_role": req.verifier_role or "Buyer Inspector",
        "declared_grade": declared_grade,
        "verified_grade": req.verified_grade.strip().upper(),
        "declared_moisture_pct": declared_moisture,
        "verified_moisture_pct": round(req.verified_moisture_pct, 1),
        "declared_foreign_matter_pct": declared_foreign_matter,
        "verified_foreign_matter_pct": round(req.verified_foreign_matter_pct, 1),
        "grain_damage_pct": round(req.grain_damage_pct or 0.8, 1),
        "grade_matched": grade_matched,
        "notes": req.notes,
        "verified_at": now,
    }

    res = sb.table("lot_quality_verifications").insert(verification_payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save quality verification")

    record = res.data[0]

    return {
        "message": "Quality verification successfully recorded by buyer at pickup.",
        "verification": record,
        "comparison": {
            "declared": {
                "grade": declared_grade,
                "moisture_pct": declared_moisture,
                "foreign_matter_pct": declared_foreign_matter,
            },
            "verified": {
                "grade": req.verified_grade.strip().upper(),
                "moisture_pct": round(req.verified_moisture_pct, 1),
                "foreign_matter_pct": round(req.verified_foreign_matter_pct, 1),
                "grain_damage_pct": round(req.grain_damage_pct or 0.8, 1),
            },
            "grade_matched": grade_matched,
            "verifier_name": req.verifier_name,
            "verified_at": now,
        },
    }


@router.get("/lot/{lot_id}")
def get_lot_quality_verification(lot_id: str):
    """
    Returns declared vs verified comparison data for the lot (§6.2 & §6.8).
    """
    sb = get_supabase_admin()
    lot_res = sb.table("lots").select("*").eq("id", lot_id).maybe_single().execute()
    if not lot_res.data:
        raise HTTPException(status_code=404, detail="Lot not found")
    lot = lot_res.data

    v_res = sb.table("lot_quality_verifications") \
        .select("*") \
        .eq("lot_id", lot_id) \
        .order("verified_at", desc=True) \
        .execute()
    verification = v_res.data[0] if v_res.data else None

    declared = {
        "grade": lot.get("quality_grade") or "A",
        "moisture_pct": float(lot.get("declared_moisture_pct") or 10.0),
        "foreign_matter_pct": float(lot.get("declared_foreign_matter_pct") or 1.5),
    }

    return {
        "lot_id": lot_id,
        "has_verification": verification is not None,
        "declared": declared,
        "verified": verification,
    }
