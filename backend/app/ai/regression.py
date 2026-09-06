"""
Price Regression Module.
Regression's ONLY job: predict the expected price range.

Fits simple OLS on day-index → modal_price.
Band = midpoint ± 1×std_dev of residuals.
Also computes the confidence score (real formula, not vibes).

All functions are pure — they take lists, return numbers.
No DB calls here; data_prep.py handles fetching.
"""
from statistics import mean, stdev
from typing import List, Dict, Any
import math


def fit_ols(prices: List[float]) -> Dict[str, float]:
    """
    Fit simple OLS: y = intercept + slope * x, where x = day index (0..n-1).
    Returns slope, intercept, residuals_std, r_squared.
    """
    n = len(prices)
    if n < 2:
        p = prices[0] if prices else 0.0
        return {
            "slope": 0.0,
            "intercept": p,
            "residuals_std": 0.0,
            "r_squared": 0.0,
            "n": n,
        }

    x_mean = (n - 1) / 2.0
    y_mean = mean(prices)

    # Compute slope and intercept
    ss_xy = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(prices))
    ss_xx = sum((i - x_mean) ** 2 for i in range(n))

    slope = ss_xy / ss_xx if ss_xx != 0 else 0.0
    intercept = y_mean - slope * x_mean

    # Compute residuals and R²
    predictions = [intercept + slope * i for i in range(n)]
    residuals = [actual - pred for actual, pred in zip(prices, predictions)]
    ss_res = sum(r ** 2 for r in residuals)
    ss_tot = sum((y - y_mean) ** 2 for y in prices)
    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot != 0 else 0.0

    residuals_std = stdev(residuals) if len(residuals) > 1 else 0.0

    return {
        "slope": round(slope, 4),
        "intercept": round(intercept, 2),
        "residuals_std": round(residuals_std, 2),
        "r_squared": round(max(0, r_squared), 4),
        "n": n,
    }


def predict_price_range(prices: List[float]) -> Dict[str, Any]:
    """
    Predict the expected price range from historical prices.

    Returns:
        midpoint: predicted next-day price (extrapolation)
        low: midpoint - 1×std_dev
        high: midpoint + 1×std_dev
        slope: daily price change
        std_dev: residuals standard deviation
        r_squared: model fit quality
    """
    if not prices:
        return {
            "midpoint": 0, "low": 0, "high": 0,
            "slope": 0, "std_dev": 0, "r_squared": 0, "n": 0,
        }

    ols = fit_ols(prices)
    n = ols["n"]

    # Extrapolate one step ahead
    midpoint = ols["intercept"] + ols["slope"] * n
    band = ols["residuals_std"]

    return {
        "midpoint": round(midpoint),
        "low": round(midpoint - band),
        "high": round(midpoint + band),
        "slope": ols["slope"],
        "std_dev": ols["residuals_std"],
        "r_squared": ols["r_squared"],
        "n": n,
    }


def _round_to_nearest_5(x: float) -> int:
    """Round a number to the nearest multiple of 5."""
    return int(5 * round(x / 5))


def _clamp(value: int, lo: int, hi: int) -> int:
    """Clamp a value between lo and hi."""
    return max(lo, min(hi, value))


def compute_confidence(
    prices: List[float],
    std_dev: float,
    price_mean: float,
    data_points: int,
) -> int:
    """
    Compute confidence score — a REAL formula, not vibes.

    confidence = 90 − volatility_penalty − sparsity_penalty
    Clamped to [50, 95], rounded to nearest 5%.

    volatility_penalty: scales with (std_dev / mean) * 100, capped at 25
    sparsity_penalty:   max(0, 15 - data_points), so 0 penalty at 15+ points
    """
    if price_mean == 0 or data_points == 0:
        return 50

    # Volatility penalty: how noisy are the prices relative to the mean?
    cv = (std_dev / price_mean) * 100  # coefficient of variation as %
    volatility_penalty = min(25.0, cv * 5)  # scale up so 5% CV = 25 penalty

    # Sparsity penalty: fewer data points = less confidence
    sparsity_penalty = max(0.0, 15.0 - data_points)

    raw = 90.0 - volatility_penalty - sparsity_penalty
    return _clamp(_round_to_nearest_5(raw), 50, 95)


def backtest_check(
    prices: List[float],
    holdout: List[float],
) -> Dict[str, Any]:
    """
    Backtest: predict range from training prices, check if holdout prices
    fall within the predicted band.

    Returns:
        within_band: count of holdout prices inside [low, high]
        total: total holdout prices
        accuracy_pct: within_band / total * 100
        predicted_range: {low, high, midpoint}
    """
    pred = predict_price_range(prices)

    within = sum(1 for p in holdout if pred["low"] <= p <= pred["high"])
    total = len(holdout)
    accuracy = (within / total * 100) if total > 0 else 0.0

    return {
        "within_band": within,
        "total": total,
        "accuracy_pct": round(accuracy, 1),
        "predicted_range": {
            "low": pred["low"],
            "high": pred["high"],
            "midpoint": pred["midpoint"],
        },
    }
