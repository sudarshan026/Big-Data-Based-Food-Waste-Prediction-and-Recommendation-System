"""
Database initialization and data loading utility.
Populates SQLite database from raw CSV records.
"""

import os
import sys
import pandas as pd
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, Base
from app.models.food_record import FoodWasteRecord


def init_database(load_data=True):
    app = create_app()
    with app.app_context():
        Base.metadata.create_all(app.engine)
        print("Database schema verified / created.")
        
        if load_data:
            session = app.db_session()
            existing = session.query(FoodWasteRecord).count()
            if existing > 0:
                print(f"Database already populated with {existing} records. (Run with --reset to reload).")
                session.close()
                return
                
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', 'food_waste_data.csv'))
            if not os.path.exists(csv_path):
                print(f"Warning: Raw dataset not found at {csv_path}. Run generate_dataset.py first.")
                session.close()
                return
                
            print(f"Loading records from {csv_path}...")
            df = pd.read_csv(csv_path)
            
            records = []
            for _, row in df.iterrows():
                try:
                    dt = datetime.strptime(str(row['date']), '%Y-%m-%d').date()
                    r = FoodWasteRecord(
                        date=dt,
                        food_item=str(row['food_item']),
                        food_category=str(row['food_category']),
                        meal_type=str(row['meal_type']),
                        quantity_prepared=float(row['quantity_prepared']),
                        quantity_consumed=float(row['quantity_consumed']),
                        quantity_wasted=float(row['quantity_wasted']),
                        students_served=int(row['students_served']) if pd.notna(row.get('students_served')) else None,
                        cost_per_kg=float(row['cost_per_kg']) if pd.notna(row.get('cost_per_kg')) else None,
                        day_of_week=str(row.get('day_of_week', '')),
                        special_event=bool(row.get('special_event', False))
                    )
                    records.append(r)
                except Exception:
                    continue
                    
            print(f"Inserting {len(records)} records into SQLite...")
            # Insert in chunks of 2000
            chunk_size = 2000
            for i in range(0, len(records), chunk_size):
                chunk = records[i:i + chunk_size]
                session.bulk_save_objects(chunk)
                session.commit()
                
            print(f"Successfully loaded {len(records)} records into database.")
            session.close()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--reset', action='store_true', help='Drop existing tables and reload')
    parser.add_argument('--no-data', action='store_true', help='Create tables without loading data')
    args = parser.parse_args()
    
    if args.reset:
        app = create_app()
        with app.app_context():
            Base.metadata.drop_all(app.engine)
            print("Dropped all existing database tables.")
            
    init_database(load_data=not args.no_data)

