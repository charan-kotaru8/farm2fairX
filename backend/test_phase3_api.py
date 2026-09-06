"""Automated verification of Phase 3 backend logic and endpoints."""
import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("Testing GET /buyers...")
    req = urllib.request.urlopen(f"{BASE_URL}/buyers")
    buyers = json.loads(req.read().decode())
    print(f"  Retrieved {len(buyers)} buyers.")
    for b in buyers:
        print(f"  - {b['business_name']}: Tier={b['verification_tier']}, Status={b['verification_status']}, Deals={b['completed_transactions']}, Rating={b['avg_rating']}")
    
    # Assert Apex is trusted_partner (earned threshold >=5 deals, >=4.5 rating)
    apex = next(b for b in buyers if "Apex" in b["business_name"])
    assert apex["verification_tier"] == "trusted_partner", f"Apex should be trusted_partner, got {apex['verification_tier']}"
    
    # Assert MGT is verified (not trusted_partner because deals < 5)
    mgt = next(b for b in buyers if "Maharashtra Grain" in b["business_name"])
    assert mgt["verification_tier"] == "verified", f"MGT should be verified, got {mgt['verification_tier']}"
    
    print("\nTesting GET /offers...")
    req = urllib.request.urlopen(f"{BASE_URL}/offers")
    offers = json.loads(req.read().decode())
    print(f"  Retrieved {len(offers)} offers.")
    for o in offers:
        print(f"  - Offer ID {o['id'][:8]}: Rs.{o['price_per_quintal']}/q, Status={o['status']}, Buyer={o.get('buyers', {}).get('business_name')} (Tier: {o.get('buyers', {}).get('verification_tier')})")
        
    print("\nTesting GET /buyer-requirements...")
    req = urllib.request.urlopen(f"{BASE_URL}/buyer-requirements")
    requirements = json.loads(req.read().decode())
    print(f"  Retrieved {len(requirements)} buyer requirements.")
    for r in requirements:
        print(f"  - {r.get('buyers', {}).get('business_name')}: {r['quantity_quintals']}q {r.get('crops', {}).get('name')} (Max Rs.{r['max_price_per_quintal']})")

    print("\nALL PHASE 3 BACKEND LOGIC CHECKS PASSED!")

if __name__ == "__main__":
    test_api()
