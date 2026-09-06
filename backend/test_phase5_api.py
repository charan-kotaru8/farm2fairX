"""
Automated verification test script for Phase 5: FPO Aggregation API
Tests:
1. GET /fpo/dashboard-stats
2. GET /fpo/members
3. GET /fpo/lots/candidate
4. POST /fpo/lots/check-eligibility
   - Confirms strict eligibility rules (crop, grade, 7-day window)
5. GET /fpo/benefit
   - Confirms data-driven Before/After comparison and bulk uplift
6. POST /fpo/aggregate
   - Aggregates eligible member lots, checks proportional shares sum to 100%
7. Offer acceptance lifecycle & Escrow payout update
   - Verifies fpo_transaction_members updated with exact escrow share amounts
8. GET /fpo/payouts/{lot_id}
   - Verifies payout breakdown
"""
import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase5():
    print("==================================================")
    print("     PHASE 5: FPO AGGREGATION VERIFICATION")
    print("==================================================")

    # 1. Test Dashboard Stats
    print("\n[1] Testing GET /fpo/dashboard-stats...")
    res = client.get("/fpo/dashboard-stats")
    assert res.status_code == 200, f"Failed: {res.text}"
    stats = res.json()
    print(f"    Total Members: {stats.get('total_members')}")
    print(f"    Candidate Lots: {stats.get('candidate_lots_count')} ({stats.get('candidate_quantity_quintals')} quintals)")
    print(f"    Aggregated Lots: {stats.get('aggregated_lots_count')} ({stats.get('aggregated_quantity_quintals')} quintals)")
    print(f"    Escrow Amount: Rs. {stats.get('total_escrow_amount')}")
    print(f"    Estimated Bulk Gain: Rs. {stats.get('estimated_bulk_gain')}")
    assert stats.get("total_members") == 6, "Expected 6 FPO members"
    print("    --> PASSED")

    # 2. Test Member Directory
    print("\n[2] Testing GET /fpo/members...")
    res = client.get("/fpo/members")
    assert res.status_code == 200, f"Failed: {res.text}"
    members = res.json()
    print(f"    Retrieved {len(members)} members:")
    for m in members[:3]:
        print(f"      * {m.get('farmer_name')} ({m.get('village')}) - Primary: {m.get('primary_crop')}, Active Lots: {m.get('active_lots_count')}")
    assert len(members) >= 6, "Expected at least 6 members"
    print("    --> PASSED")

    # 3. Test Candidate Lots
    print("\n[3] Testing GET /fpo/lots/candidate...")
    res = client.get("/fpo/lots/candidate")
    assert res.status_code == 200, f"Failed: {res.text}"
    candidate_lots = res.json()
    print(f"    Retrieved {len(candidate_lots)} candidate lots available for pooling.")
    assert len(candidate_lots) >= 4, "Expected candidate lots"
    print("    --> PASSED")

    # 4. Test Eligibility Engine (POST /fpo/lots/check-eligibility)
    print("\n[4] Testing POST /fpo/lots/check-eligibility...")
    # Find the first eligible Soybean Grade A lot
    soybean_a_lots = [l for l in candidate_lots if l.get("crops", {}).get("name") == "Soybean" and l.get("quality_grade") == "A" and float(l.get("quantity") or 0) == 25.0]
    assert len(soybean_a_lots) > 0, "Could not find baseline candidate lot"
    ref_lot = soybean_a_lots[0]
    ref_id = ref_lot["id"]

    elig_res = client.post("/fpo/lots/check-eligibility", json={
        "reference_lot_id": ref_id,
        "selected_lot_ids": [ref_id],
    })
    assert elig_res.status_code == 200, f"Failed: {elig_res.text}"
    elig_data = elig_res.json()
    evals = elig_data["lot_evaluations"]

    # Check that ineligibles are correctly caught with reasons:
    ineligible_count = 0
    reasons_found = []
    for lid, ev in evals.items():
        if not ev["eligible"]:
            ineligible_count += 1
            reasons_found.append(ev["reason"])
            print(f"    Ineligible detected: {ev['reason']}")

    print(f"    Total ineligibles flagged: {ineligible_count}")
    assert any("Grade mismatch" in r or "grade" in r.lower() for r in reasons_found), "Expected Grade mismatch detection"
    assert any("7 days" in r or "window" in r.lower() for r in reasons_found), "Expected harvest window mismatch detection"
    assert any("Different crop" in r or "crop" in r.lower() for r in reasons_found), "Expected crop mismatch detection"
    print("    --> PASSED: Strict eligibility rules (crop, grade, 7-day window) fully enforced!")

    # 5. Test Data-Driven Before/After Benefit
    print("\n[5] Testing GET /fpo/benefit...")
    ben_res = client.get("/fpo/benefit?quality_grade=A&quantity=100")
    assert ben_res.status_code == 200, f"Failed: {ben_res.text}"
    ben = ben_res.json()
    print(f"    Without FPO: Best Price = Rs. {ben['without_fpo']['best_price_per_quintal']}/q (Buyers: {ben['without_fpo']['eligible_buyers_count']})")
    print(f"    With FPO:    Best Price = Rs. {ben['with_fpo']['best_price_per_quintal']}/q (Buyers: {ben['with_fpo']['eligible_buyers_count']}, e.g. {ben['with_fpo']['matched_bulk_buyers']})")
    print(f"    Value Uplift: +Rs. {ben['benefit_delta']['price_delta_per_quintal']}/q (+{ben['benefit_delta']['percentage_increase']}%)")
    print(f"    Total Member Gain: +Rs. {ben['benefit_delta']['total_extra_member_gain']}")
    assert ben["benefit_delta"]["price_delta_per_quintal"] >= 150, "Expected significant bulk price delta"
    print("    --> PASSED: Real data-driven bulk premium verified!")

    # 6. Test Aggregation Creation (POST /fpo/aggregate)
    print("\n[6] Testing POST /fpo/aggregate...")
    # Gather 3 eligible soybean A candidate lots
    eligible_ids = elig_data["eligible_ids"]
    assert len(eligible_ids) >= 3, f"Expected at least 3 eligible lots, got {len(eligible_ids)}"
    pool_ids = eligible_ids[:3]

    agg_res = client.post("/fpo/aggregate", json={
        "lot_ids": pool_ids,
        "description": "Verification Automated Pooled Lot",
    })
    assert agg_res.status_code == 200, f"Failed: {agg_res.text}"
    agg_out = agg_res.json()
    new_parent = agg_out["parent_lot"]
    shares = agg_out["member_shares"]
    print(f"    Created parent aggregated lot: {new_parent['id']}")
    print(f"    Total Quantity: {new_parent['quantity']} quintals across {new_parent['member_count']} members")
    
    total_share_pct = sum(s["share_percentage"] for s in shares)
    print(f"    Sum of member share percentages: {total_share_pct}%")
    for s in shares:
        print(f"      - {s['farmer_name']}: {s['contributed_quantity']}q ({s['share_percentage']}%)")
    assert abs(total_share_pct - 100.0) < 0.1, "Proportional shares must sum to 100%"
    print("    --> PASSED: Aggregation & proportional share calculation verified!")

    # 7. Test Offer Submission & Acceptance on Aggregated Lot
    print("\n[7] Testing Offer Submission & Acceptance on Aggregated Lot...")
    offer_res = client.post("/offers", json={
        "lot_id": new_parent["id"],
        "buyer_id": "11111111-0000-0000-0000-000000000001",
        "price_per_quintal": 4950,
        "offered_quantity": float(new_parent["quantity"]),
        "payment_terms": "Escrow on delivery",
        "pickup_terms": "Farmgate Pickup",
        "notes": "Automated verification test offer",
    })
    assert offer_res.status_code == 200, f"Failed to submit offer: {offer_res.text}"
    offer_id = offer_res.json()["id"]
    print(f"    Submitted offer {offer_id} for Rs. 4,950/q")

    # Accept the offer
    accept_res = client.post(f"/offers/{offer_id}/accept")
    assert accept_res.status_code == 200, f"Failed to accept offer: {accept_res.text}"
    print("    Offer accepted! Checking member escrow updates...")

    # Verify payout splits
    payout_res = client.get(f"/fpo/payouts/{new_parent['id']}")
    assert payout_res.status_code == 200, f"Failed to get payouts: {payout_res.text}"
    payout_data = payout_res.json()
    members_payout = payout_data["members"]
    summary = payout_data["summary"]
    print(f"    Total Payout: Rs. {summary['total_payout_amount']} (Price: Rs. {summary['price_per_quintal']}/q)")
    for mp in members_payout:
        print(f"      - {mp['farmer_name']}: {mp['contributed_quantity']}q @ Rs. {mp['price_per_quintal']}/q = Rs. {mp['share_amount']} [Status: {mp['payout_status']}]")
        assert mp["payout_status"] == "escrow", "Expected payout_status to be 'escrow'"
        assert mp["share_amount"] == round(float(mp["contributed_quantity"]) * 4950.0, 2)
    print("    --> PASSED: Member escrow payouts computed and verified!")

    # 8. Test FPO Aggregated Lots listing
    print("\n[8] Testing GET /fpo/lots...")
    lots_res = client.get("/fpo/lots")
    assert lots_res.status_code == 200, f"Failed to get lots: {lots_res.text}"
    agg_lots = lots_res.json()
    print(f"    Retrieved {len(agg_lots)} aggregated lots.")
    assert len(agg_lots) >= 2, "Expected at least 2 aggregated lots (seeded + newly created)"
    print("    --> PASSED")

    print("\n==================================================")
    print("  ALL PHASE 5 BACKEND TESTS PASSED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == "__main__":
    test_phase5()
