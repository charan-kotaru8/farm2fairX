import urllib.request
import json

BASE = 'http://localhost:8000'

def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read().decode())

def post(path, data):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())

print("1. Testing /fpo/dashboard-stats...")
stats = get('/fpo/dashboard-stats')
assert stats['total_members'] == 6, f"Expected 6 members, got {stats['total_members']}"
assert stats['aggregated_lots_count'] >= 1, "Expected at least 1 aggregated lot"
print(f"   [OK] Dashboard stats: {stats['total_members']} members, Escrow: Rs. {stats['total_escrow_amount']}")

print("2. Testing /fpo/members...")
members = get('/fpo/members')
assert len(members) == 6, f"Expected 6 members, got {len(members)}"
print(f"   [OK] Members count: {len(members)}, Names: {[m['farmer_name'] for m in members]}")

print("3. Testing /fpo/lots/candidate...")
candidates = get('/fpo/lots/candidate')
assert len(candidates) >= 6, f"Expected >= 6 candidate lots, got {len(candidates)}"
print(f"   [OK] Candidate lots count: {len(candidates)}")

print("4. Testing /fpo/lots/check-eligibility...")
ref_id = candidates[0]['id']
check = post('/fpo/lots/check-eligibility', {'reference_lot_id': ref_id, 'selected_lot_ids': [ref_id]})
eligible_count = len(check['eligible_ids'])
print(f"   [OK] Eligibility check: {eligible_count} eligible lots out of {len(check['lot_evaluations'])} evaluated.")
for lid, ev in check['lot_evaluations'].items():
    if not ev['eligible']:
        print(f"     - Flagged ineligible: {ev['reason']}")

print("5. Testing /fpo/benefit...")
benefit = get('/fpo/benefit?quantity=100')
price_delta = benefit['benefit_delta']['price_delta_per_quintal']
total_gain = benefit['benefit_delta']['total_extra_member_gain']
assert price_delta == 170, f"Expected delta 170, got {price_delta}"
assert total_gain == 17000, f"Expected gain 17000, got {total_gain}"
print(f"   [OK] Benefit calculated: Without FPO: Rs. {benefit['without_fpo']['best_price_per_quintal']}, With FPO: Rs. {benefit['with_fpo']['best_price_per_quintal']}, Delta: +Rs. {price_delta}")

print("6. Testing /fpo/aggregate...")
eligible_ids = check['eligible_ids']
agg_result = post('/fpo/aggregate', {'lot_ids': eligible_ids, 'description': 'Automated test 100q Soybean pool'})
new_lot = agg_result['parent_lot']
print(f"   [OK] Aggregated lot created! ID: {new_lot['id']}, Quantity: {new_lot['quantity']} Q, Members: {new_lot['member_count']}")

print("7. Testing /fpo/payouts/{new_lot_id}...")
payouts = get(f"/fpo/payouts/{new_lot['id']}")
assert len(payouts['members']) == 4, f"Expected 4 payout member shares, got {len(payouts['members'])}"
assert payouts['summary']['shares_sum_percentage'] == 100.0, "Expected 100% total shares"
print(f"   [OK] Payout splits verified! Shares sum: {payouts['summary']['shares_sum_percentage']}%")
for m in payouts['members']:
    print(f"     - {m['farmer_name']}: {m['contributed_quantity']} Q ({m['share_percentage']}%) -> Status: {m['payout_status']}")

print("8. Submitting and accepting an offer on the newly aggregated lot...")
offer_data = {
    'lot_id': new_lot['id'],
    'buyer_id': '11111111-0000-0000-0000-000000000001',
    'price_per_quintal': 4950.0,
    'offered_quantity': 100.0,
    'payment_terms': 'Escrow on delivery',
    'pickup_terms': 'Farmgate Pickup',
    'notes': 'Accepting full 100q bulk pool at premium processor price'
}
offer_res = post('/offers', offer_data)
offer_id = offer_res['id']
print(f"   [OK] Offer submitted: ID: {offer_id} @ Rs. 4,950/q")

accept_res = post(f"/offers/{offer_id}/accept", {})
assert accept_res['fpo_payouts_updated'] == True, "Expected fpo_payouts_updated to be True"
print(f"   [OK] Offer accepted! Payouts updated in escrow: {accept_res['fpo_payouts_updated']}")

# Verify updated payouts
updated_payouts = get(f"/fpo/payouts/{new_lot['id']}")
total_payout = updated_payouts['summary']['total_payout_amount']
assert total_payout == 495000.0, f"Expected 495,000 payout, got {total_payout}"
print(f"   [OK] Escrow Payout Verified! Total amount: Rs. {total_payout}")
for m in updated_payouts['members']:
    assert m['payout_status'] == 'escrow', f"Expected escrow status, got {m['payout_status']}"
    print(f"     - {m['farmer_name']}: {m['contributed_quantity']} Q @ Rs. {m['price_per_quintal']} = Rs. {m['share_amount']} [{m['payout_status']}]")

print("\n=======================================================")
print("ALL 8 AUTOMATED FPO AGGREGATION TESTS PASSED SUCCESSFULLY!")
print("=======================================================")
