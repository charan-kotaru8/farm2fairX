"""
Buyer Matching Weights Configuration.
Single source of truth — surfaced in the UI for transparency.
Adjust numbers here; they are returned with every match response.

Crop compatibility is NOT a weighted factor — it is a hard pre-filter
applied in matching.py before scoring runs. Only buyers with an open
requirement for the lot's exact crop are ever scored.
"""

BUYER_MATCH_WEIGHTS = {
    "quantity_fit":  0.20,
    "quality_match": 0.20,
    "distance":      0.20,
    "price_fit":     0.25,
    "reliability":   0.15,
}

# Human-readable labels for the UI
WEIGHT_LABELS = {
    "quantity_fit":  "Quantity Fit",
    "quality_match": "Quality Match",
    "distance":      "Distance",
    "price_fit":     "Price Fit",
    "reliability":   "Reliability",
}

# District adjacency map for Maharashtra (used for distance scoring fallback
# outside geocoded coordinates — see follow-up note in the patch checklist
# re: replacing this with real haversine distance once buyer geocoding exists)
DISTRICT_ADJACENCY = {
    "Latur":   {"Osmanabad", "Nanded", "Parbhani", "Beed", "Solapur"},
    "Pune":    {"Satara", "Solapur", "Ahmednagar", "Raigad", "Nashik"},
    "Nashik":  {"Pune", "Ahmednagar", "Jalgaon", "Dhule", "Aurangabad"},
    "Solapur": {"Pune", "Satara", "Osmanabad", "Latur", "Beed", "Ahmednagar"},
    "Nagpur":  {"Wardha", "Bhandara", "Chandrapur", "Amravati"},
}
