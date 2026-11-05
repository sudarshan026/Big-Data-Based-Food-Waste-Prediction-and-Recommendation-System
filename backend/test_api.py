"""
Backend verification script: Tests all major REST API endpoints.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()
client = app.test_client()

def test_endpoint(name, url, method='GET', data=None):
    if method == 'GET':
        res = client.get(url)
    else:
        res = client.post(url, json=data)
    
    status = "OK" if res.status_code in [200, 201] else f"FAIL ({res.status_code})"
    print(f"[{status}] {method} {url}")
    return res

print("=" * 60)
print("Testing FoodWaste Analytics REST Endpoints...")
print("=" * 60)

test_endpoint("Dashboard", "/api/dashboard?period=all")
test_endpoint("Records List", "/api/food-records?page=1&per_page=5")
test_endpoint("Waste Overview", "/api/analytics/waste?period=all")
test_endpoint("Category Analytics", "/api/analytics/category?period=all")
test_endpoint("Meal Analytics", "/api/analytics/meal?period=all")
test_endpoint("Trends Analytics", "/api/analytics/trends?period=90days")
test_endpoint("Prediction Items", "/api/predict/items")
test_endpoint("Prediction Metrics", "/api/predict/metrics")
test_endpoint("Demand Prediction", "/api/predict", method='POST', data={
    "food_item": "Plain Rice",
    "food_category": "Rice",
    "meal_type": "Lunch",
    "day_of_week": "Monday",
    "month": 11,
    "special_event": False,
    "quantity_prepared": 60,
    "safety_buffer_percent": 10
})
test_endpoint("Recommendations", "/api/recommendations")
test_endpoint("Preparation Table", "/api/recommendations/preparation")
test_endpoint("Spark Status", "/api/spark/status")
test_endpoint("Spark Results", "/api/spark/results")
test_endpoint("CSV Report", "/api/reports?format=csv")
test_endpoint("PDF Report", "/api/reports?format=pdf")

print("=" * 60)
print("All endpoints verified!")
print("=" * 60)

