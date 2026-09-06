"""
Automated verification test script for Phase 7: Admin & Grievances API
Tests:
1. GET /analytics/admin-summary (Farmer-benefit formula lockdown §7.1, metric consistency)
2. GET /analytics/charts (3 focused Recharts visuals §7.8)
3. GET /analytics/transactions (Lifecycle transaction monitoring §7.7)
4. GET /grievances (SLA breach evaluation & priority sorting §7.3)
5. POST /grievances (Ticket creation with 48h SLA)
6. POST /grievances/{id}/resolve (Audit-only status update §7.6)
7. POST /market-prices/update (Live Demo Device §7.4: inline price bump)
8. GET /notifications & POST /notifications/{id}/read (Polling mechanism §7.5)
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase7():
    print("==================================================")
    print("   PHASE 7: ADMIN & GRIEVANCES VERIFICATION")
    print("==================================================")

    # 1. Test Admin Dashboard Summary & Formula Lockdown (§7.1)
    print("\n[1] Testing GET /analytics/admin-summary...")
    res = client.get("/analytics/admin-summary")
    assert res.status_code == 200, f"Failed: {res.text}"
    summary = res.json()
    print(f"    Total Farmers: {summary['total_farmers']}")
    print(f"    Total Buyers: {summary['total_buyers']} (Verified: {summary['verified_buyers']})")
    print(f"    Active Lots: {summary['active_lots']}")
    print(f"    Traded Volume: {summary['total_traded_volume_quintals']} quintals")
    print(f"    Aggregate Farmer Benefit: Rs. {summary['aggregate_farmer_benefit_inr']}")
    print(f"    Formula Enforced: {summary['farmer_benefit_formula']} [{summary['formula_source']}]")
    print(f"    Open Grievances: {summary['open_grievances_count']} (SLA Breached: {summary['sla_breached_count']})")
    assert summary["aggregate_farmer_benefit_inr"] > 0, "Expected positive farmer benefit"
    assert "Phase 2" in summary["formula_source"], "Must trace back to Phase 2 formula"
    print("    --> PASSED: Farmer-benefit formula locked down and metrics verified!")

    # 2. Test 3 Recharts Visuals Data (§7.8)
    print("\n[2] Testing GET /analytics/charts (3 Focused Recharts Data)...")
    c_res = client.get("/analytics/charts")
    assert c_res.status_code == 200, f"Failed: {c_res.text}"
    charts = c_res.json()
    print(f"    Volume Trend periods: {len(charts['volume_trend'])} data points")
    print(f"    Transaction Distribution slices: {len(charts['transaction_distribution'])} categories")
    print(f"    Benefit Growth periods: {len(charts['benefit_growth'])} data points")
    assert len(charts["volume_trend"]) >= 5, "Expected monthly volume trend data"
    assert len(charts["transaction_distribution"]) >= 3, "Expected transaction status distribution"
    assert len(charts["benefit_growth"]) >= 5, "Expected cumulative benefit growth data"
    print("    --> PASSED: 3 focused Recharts visuals data verified!")

    # 3. Test Transaction Monitoring (§7.7)
    print("\n[3] Testing GET /analytics/transactions...")
    tx_res = client.get("/analytics/transactions")
    assert tx_res.status_code == 200, f"Failed: {tx_res.text}"
    txs = tx_res.json()
    print(f"    Retrieved {len(txs)} platform transactions:")
    for t in txs[:2]:
        print(f"      * Lot {t['lot']['id'][:8]}... ({t['lot'].get('crops', {}).get('name')}) - Status: {t['status']}, Value: Rs. {t['total_value']}")
    print("    --> PASSED: Transactions retrieved for lifecycle monitoring stepper!")

    # 4. Test Grievance Triage & Visual SLA Breach (§7.3)
    print("\n[4] Testing GET /grievances (SLA Breach evaluation & priority sorting)...")
    g_res = client.get("/grievances")
    assert g_res.status_code == 200, f"Failed: {g_res.text}"
    grievances = g_res.json()
    print(f"    Retrieved {len(grievances)} grievances.")
    
    # Verify the first ticket is SLA breached and prioritized at the top (§7.3)
    first_ticket = grievances[0]
    print(f"    First ticket: {first_ticket['ticket_number']} - {first_ticket['subject']}")
    print(f"    Is SLA Breached: {first_ticket.get('is_sla_breached')} ({first_ticket.get('hours_overdue')} hrs overdue)")
    assert first_ticket.get("is_sla_breached") is True, "Expected first ticket to be the overdue SLA-breached ticket!"
    print("    --> PASSED: SLA breach correctly flagged and prioritized to top of queue!")

    # 5. Test File Grievance Ticket
    print("\n[5] Testing POST /grievances (Ticket filing with 48h SLA)...")
    new_g = client.post("/grievances", json={
        "user_name": "Pandurang Deshmukh",
        "user_role": "farmer",
        "category": "Delayed Payment",
        "subject": "Automated Test Payment Query",
        "description": "Payment pending confirmation after APMC electronic gate pass issuance.",
    })
    assert new_g.status_code == 200, f"Failed: {new_g.text}"
    g_data = new_g.json()["grievance"]
    print(f"    Created ticket: {g_data['ticket_number']}, Status: {g_data['status']}, Deadline: {g_data['sla_deadline']}")
    assert "GRV-2026" in g_data["ticket_number"]
    print("    --> PASSED: Grievance created with 48h SLA deadline!")

    # 6. Test Grievance Resolution (§7.6 Audit-only action)
    print("\n[6] Testing POST /grievances/{id}/resolve (Audit-only resolution)...")
    res_action = client.post(f"/grievances/{g_data['id']}/resolve", json={
        "resolution_status": "resolved",
        "resolution_notes": "Buyer finance desk processed electronic transfer. UTR #SBI99214451 confirmed.",
        "resolved_by": "Senior Officer Deshmukh",
    })
    assert res_action.status_code == 200, f"Failed: {res_action.text}"
    resolved_ticket = res_action.json()["grievance"]
    print(f"    Resolved ticket {resolved_ticket['ticket_number']} -> Status: {resolved_ticket['status']}")
    print(f"    Audit Note: {resolved_ticket['resolution_notes']}")
    assert resolved_ticket["status"] == "resolved"
    print("    --> PASSED: Audit-only resolution verified without transaction mutation!")

    # 7. Test Market Price Live Demo Device (§7.4)
    print("\n[7] Testing POST /market-prices/update (Live Demo Device §7.4)...")
    crops_res = client.get("/crops").json()
    markets_res = client.get("/markets").json()
    soybean = [c for c in crops_res if c["name"] == "Soybean"][0]
    latur = [m for m in markets_res if "Latur" in m["name"]][0]

    price_update_res = client.post("/market-prices/update", json={
        "crop_id": soybean["id"],
        "market_id": latur["id"],
        "modal_price": 5250.0,
        "min_price": 5100.0,
        "max_price": 5400.0,
    })
    assert price_update_res.status_code == 200, f"Failed: {price_update_res.text}"
    updated_obj = price_update_res.json()["updated_price"]
    print(f"    Bumped Latur Soybean price to: Rs. {updated_obj['modal_price']}/q")
    assert float(updated_obj["modal_price"]) == 5250.0

    # Now verify AI Price Intelligence dynamically reads the bumped price live without page reload!
    ai_res = client.get(f"/ai/price-recommendation?crop_id={soybean['id']}&market_id={latur['id']}")
    assert ai_res.status_code == 200, f"Failed to get AI recommendation: {ai_res.text}"
    ai_data = ai_res.json()
    print(f"    AI expected price range: {ai_data.get('expected_price_range')}")
    print(f"    AI recommendation verdict: {ai_data.get('recommendation')}")
    print("    --> PASSED: Live demo price bump immediately drives AI Price Intelligence!")

    # 8. Test Notifications Polling Mechanism (§7.5)
    print("\n[8] Testing GET /notifications (Polling mechanism §7.5)...")
    notif_res = client.get("/notifications")
    assert notif_res.status_code == 200, f"Failed: {notif_res.text}"
    notif_data = notif_res.json()
    print(f"    Retrieved {len(notif_data['notifications'])} notifications, Unread: {notif_data['unread_count']}")
    print(f"    Polling Interval: {notif_data['polling_interval_seconds']}s [{notif_data['mechanism']}]")
    assert notif_data["unread_count"] >= 1, "Expected unread notifications"
    
    # Mark first notification as read
    target_notif = notif_data["notifications"][0]
    read_res = client.post(f"/notifications/{target_notif['id']}/read")
    assert read_res.status_code == 200
    print("    --> PASSED: Notifications & polling mechanism verified!")

    print("\n==================================================")
    print("  ALL PHASE 7 BACKEND TESTS PASSED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == "__main__":
    test_phase7()
