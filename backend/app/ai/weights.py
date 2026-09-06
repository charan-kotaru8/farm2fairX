"""
Buyer Matching Weights Configuration.
Single source of truth — surfaced in the UI for transparency.
Adjust numbers here; they are returned with every match response.
"""

BUYER_MATCH_WEIGHTS = {
    "crop_compatibility": 0.25,
    "quantity_fit":       0.20,
    "quality_match":      0.20,
    "distance":           0.15,
    "price_fit":          0.10,
    "reliability":        0.10,
}

# Human-readable labels for the UI
WEIGHT_LABELS = {
    "crop_compatibility": "Crop Compatibility",
    "quantity_fit":       "Quantity Fit",
    "quality_match":      "Quality Match",
    "distance":           "Distance",
    "price_fit":          "Price Fit",
    "reliability":        "Reliability",
}

# District adjacency map for Maharashtra (for distance scoring)
# Each district maps to its neighboring districts.
DISTRICT_ADJACENCY = {
    "Latur":   {"Osmanabad", "Nanded", "Parbhani", "Beed", "Solapur"},
    "Pune":    {"Satara", "Solapur", "Ahmednagar", "Raigad", "Nashik"},
    "Nashik":  {"Pune", "Ahmednagar", "Jalgaon", "Dhule", "Aurangabad"},
    "Solapur": {"Pune", "Satara", "Osmanabad", "Latur", "Beed", "Ahmednagar"},
    "Nagpur":  {"Wardha", "Bhandara", "Chandrapur", "Amravati"},
}
