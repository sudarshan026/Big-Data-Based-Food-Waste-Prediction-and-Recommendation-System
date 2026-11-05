"""
Backend application entrypoint for FoodWaste Analytics.
"""

import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

app = create_app()

if __name__ == '__main__':
    print("=" * 60)
    print("  FoodWaste Analytics REST API Server")
    print("  Big Data Analytics & Demand Prediction System")
    print("  Accessible at: http://localhost:5000")
    print("=" * 60)
    # use_reloader=False prevents watchdog from restarting during PySpark imports/tasks
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
