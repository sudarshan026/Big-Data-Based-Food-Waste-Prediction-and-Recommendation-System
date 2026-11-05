"""
Generate synthetic college canteen food waste dataset.
Creates 10,000+ records spanning one year (2025-11-01 to 2026-10-31).
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ============================================================
# Seed for reproducibility
# ============================================================
random.seed(42)
np.random.seed(42)

# ============================================================
# Food items by category
# ============================================================
FOOD_ITEMS = {
    'Rice': ['Plain Rice', 'Jeera Rice', 'Biryani', 'Pulao', 'Fried Rice', 'Lemon Rice'],
    'Curry': ['Dal Tadka', 'Paneer Butter Masala', 'Mixed Veg Curry', 'Chole',
              'Rajma', 'Aloo Gobi', 'Sambar', 'Palak Paneer'],
    'Bread': ['Chapati', 'Paratha', 'Naan', 'Puri', 'Pav'],
    'Snacks': ['Samosa', 'Vada Pav', 'Sandwich', 'Bhel Puri', 'Poha',
               'Upma', 'Idli', 'Dosa', 'Pakora'],
    'Beverages': ['Tea', 'Coffee', 'Juice', 'Buttermilk', 'Lassi', 'Lemonade'],
    'Desserts': ['Gulab Jamun', 'Kheer', 'Jalebi', 'Halwa', 'Ice Cream'],
    'Salad': ['Green Salad', 'Raita', 'Onion Salad', 'Cucumber Salad'],
    'Fruits': ['Banana', 'Apple', 'Orange', 'Seasonal Fruits', 'Fruit Salad'],
}

# ============================================================
# Meal-specific category pools
# ============================================================
MEAL_CATEGORIES = {
    'Breakfast': {
        'required': ['Bread', 'Beverages'],
        'optional': ['Rice', 'Snacks', 'Fruits'],
    },
    'Lunch': {
        'required': ['Rice', 'Curry', 'Bread'],
        'optional': ['Salad', 'Beverages', 'Desserts', 'Fruits'],
    },
    'Evening Snacks': {
        'required': ['Snacks', 'Beverages'],
        'optional': ['Fruits'],
    },
    'Dinner': {
        'required': ['Rice', 'Curry', 'Bread'],
        'optional': ['Salad', 'Beverages', 'Desserts'],
    },
}

# Breakfast-appropriate snacks
BREAKFAST_SNACKS = ['Poha', 'Upma', 'Idli', 'Dosa']
BREAKFAST_RICE = ['Plain Rice', 'Lemon Rice']

# ============================================================
# Popularity map (item → consumption ratio range)
# ============================================================
POPULAR_ITEMS = {
    'Biryani': (0.88, 0.95),
    'Paneer Butter Masala': (0.87, 0.95),
    'Dosa': (0.85, 0.94),
    'Samosa': (0.85, 0.93),
    'Chole': (0.83, 0.92),
    'Rajma': (0.82, 0.91),
    'Paratha': (0.83, 0.92),
    'Vada Pav': (0.84, 0.93),
    'Idli': (0.84, 0.92),
    'Tea': (0.87, 0.95),
    'Coffee': (0.86, 0.94),
    'Gulab Jamun': (0.85, 0.93),
    'Ice Cream': (0.87, 0.95),
    'Naan': (0.83, 0.92),
}

UNPOPULAR_ITEMS = {
    'Seasonal Fruits': (0.60, 0.78),
    'Green Salad': (0.60, 0.78),
    'Lemon Rice': (0.62, 0.80),
    'Cucumber Salad': (0.62, 0.79),
    'Onion Salad': (0.63, 0.80),
    'Fruit Salad': (0.63, 0.80),
    'Lemonade': (0.65, 0.80),
    'Pav': (0.65, 0.82),
    'Upma': (0.65, 0.80),
}

# Default consumption ratio for items not in either map
DEFAULT_CONSUMPTION_RANGE = (0.70, 0.92)

# ============================================================
# Cost per kg ranges by category
# ============================================================
COST_RANGES = {
    'Rice': (40, 60),
    'Curry': (80, 150),
    'Bread': (30, 60),
    'Snacks': (50, 100),
    'Beverages': (20, 50),
    'Desserts': (100, 200),
    'Salad': (40, 80),
    'Fruits': (60, 120),
}

# ============================================================
# Quantity prepared base ranges (kg) by category and meal
# ============================================================
QTY_BASE = {
    'Rice':      {'Breakfast': (5, 15),   'Lunch': (30, 60),  'Evening Snacks': (0, 0),  'Dinner': (25, 55)},
    'Curry':     {'Breakfast': (0, 0),    'Lunch': (20, 45),  'Evening Snacks': (0, 0),  'Dinner': (18, 40)},
    'Bread':     {'Breakfast': (10, 25),  'Lunch': (15, 35),  'Evening Snacks': (0, 0),  'Dinner': (12, 30)},
    'Snacks':    {'Breakfast': (10, 25),  'Lunch': (0, 0),    'Evening Snacks': (15, 35),'Dinner': (0, 0)},
    'Beverages': {'Breakfast': (20, 50),  'Lunch': (15, 40),  'Evening Snacks': (15, 35),'Dinner': (10, 30)},
    'Desserts':  {'Breakfast': (0, 0),    'Lunch': (8, 20),   'Evening Snacks': (0, 0),  'Dinner': (6, 18)},
    'Salad':     {'Breakfast': (0, 0),    'Lunch': (8, 20),   'Evening Snacks': (0, 0),  'Dinner': (6, 18)},
    'Fruits':    {'Breakfast': (5, 15),   'Lunch': (5, 15),   'Evening Snacks': (3, 10), 'Dinner': (0, 0)},
}


def get_consumption_ratio(food_item):
    """Return a consumption ratio for a food item based on its popularity."""
    if food_item in POPULAR_ITEMS:
        lo, hi = POPULAR_ITEMS[food_item]
    elif food_item in UNPOPULAR_ITEMS:
        lo, hi = UNPOPULAR_ITEMS[food_item]
    else:
        lo, hi = DEFAULT_CONSUMPTION_RANGE
    return round(random.uniform(lo, hi), 4)


def pick_items_for_meal(meal_type):
    """Select 4-8 food items appropriate for the meal type."""
    config = MEAL_CATEGORIES[meal_type]
    chosen = []

    # Pick one item from each required category
    for cat in config['required']:
        pool = FOOD_ITEMS[cat]
        # Filter for breakfast appropriateness
        if meal_type == 'Breakfast' and cat == 'Snacks':
            pool = BREAKFAST_SNACKS
        if meal_type == 'Breakfast' and cat == 'Rice':
            pool = BREAKFAST_RICE
        chosen.append((random.choice(pool), cat))

    # Pick items from optional categories
    num_optional = random.randint(3, 6)
    optional_cats = config['optional'] * 2
    random.shuffle(optional_cats)
    for cat in optional_cats[:num_optional]:
        pool = FOOD_ITEMS[cat]
        if meal_type == 'Breakfast' and cat == 'Snacks':
            pool = BREAKFAST_SNACKS
        if meal_type == 'Breakfast' and cat == 'Rice':
            pool = BREAKFAST_RICE
        item = random.choice(pool)
        # Avoid duplicates
        if item not in [c[0] for c in chosen]:
            chosen.append((item, cat))

    # Ensure between 6-9 items per meal to reach 10,000+ total records
    while len(chosen) < 7:
        cat = random.choice(config['required'] + config['optional'])
        pool = FOOD_ITEMS[cat]
        item = random.choice(pool)
        if item not in [c[0] for c in chosen]:
            chosen.append((item, cat))

    if len(chosen) > 9:
        chosen = chosen[:9]

    return chosen


def generate_dataset():
    """Generate the complete food waste dataset."""
    records = []
    record_id = 1

    start_date = datetime(2025, 11, 1)
    end_date = datetime(2026, 10, 31)
    total_days = (end_date - start_date).days + 1  # 365 days

    # Pre-select special event days (~5%)
    all_days = [start_date + timedelta(days=i) for i in range(total_days)]
    num_special = int(total_days * 0.05)
    special_days = set(random.sample(range(total_days), num_special))

    meal_types = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']

    for day_idx in range(total_days):
        current_date = all_days[day_idx]
        day_name = current_date.strftime('%A')
        is_weekend = day_name in ('Saturday', 'Sunday')
        is_special = day_idx in special_days

        # Base students count
        if is_weekend:
            base_students = random.randint(100, 250)
        else:
            base_students = random.randint(350, 500)

        # Special event boost
        if is_special:
            boost = random.uniform(1.30, 1.60)
            base_students = int(base_students * boost)

        for meal_type in meal_types:
            # Meal-specific student variation
            if meal_type == 'Breakfast':
                students = int(base_students * random.uniform(0.55, 0.75))
            elif meal_type == 'Lunch':
                students = int(base_students * random.uniform(0.85, 1.0))
            elif meal_type == 'Evening Snacks':
                students = int(base_students * random.uniform(0.35, 0.55))
            else:  # Dinner
                students = int(base_students * random.uniform(0.70, 0.90))

            items = pick_items_for_meal(meal_type)

            for food_item, food_category in items:
                # Quantity prepared depends on students, category, and meal
                qty_range = QTY_BASE.get(food_category, {}).get(meal_type, (5, 20))
                if qty_range[0] == 0 and qty_range[1] == 0:
                    qty_range = (3, 10)

                # Scale by students (normalise around 400 students)
                scale_factor = students / 400.0
                base_qty = random.uniform(qty_range[0], qty_range[1])
                quantity_prepared = round(base_qty * scale_factor, 2)
                quantity_prepared = max(1.0, quantity_prepared)

                # Consumption based on popularity
                ratio = get_consumption_ratio(food_item)
                quantity_consumed = round(quantity_prepared * ratio, 2)
                quantity_consumed = min(quantity_consumed, quantity_prepared)
                quantity_consumed = max(0.0, quantity_consumed)

                quantity_wasted = round(quantity_prepared - quantity_consumed, 2)
                quantity_wasted = max(0.0, quantity_wasted)

                # Cost per kg
                cost_lo, cost_hi = COST_RANGES[food_category]
                cost_per_kg = round(random.uniform(cost_lo, cost_hi), 2)

                records.append({
                    'record_id': record_id,
                    'date': current_date.strftime('%Y-%m-%d'),
                    'food_item': food_item,
                    'food_category': food_category,
                    'meal_type': meal_type,
                    'quantity_prepared': quantity_prepared,
                    'quantity_consumed': quantity_consumed,
                    'quantity_wasted': quantity_wasted,
                    'students_served': students,
                    'cost_per_kg': cost_per_kg,
                    'day_of_week': day_name,
                    'special_event': is_special,
                })
                record_id += 1

    df = pd.DataFrame(records)

    # --------------------------------------------------------
    # Introduce ~2% missing values in students_served and cost_per_kg
    # --------------------------------------------------------
    n = len(df)
    missing_students_idx = np.random.choice(n, size=int(n * 0.02), replace=False)
    df.loc[missing_students_idx, 'students_served'] = np.nan

    missing_cost_idx = np.random.choice(n, size=int(n * 0.02), replace=False)
    df.loc[missing_cost_idx, 'cost_per_kg'] = np.nan

    # --------------------------------------------------------
    # Introduce ~1% duplicate records
    # --------------------------------------------------------
    num_dupes = int(n * 0.01)
    dupe_idx = np.random.choice(n, size=num_dupes, replace=False)
    duplicates = df.iloc[dupe_idx].copy()
    # Re-assign record_ids for duplicates
    max_id = df['record_id'].max()
    duplicates['record_id'] = range(max_id + 1, max_id + 1 + num_dupes)
    df = pd.concat([df, duplicates], ignore_index=True)

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    # Re-assign record_ids sequentially after shuffle
    df['record_id'] = range(1, len(df) + 1)

    return df


def main():
    print("=" * 60)
    print("  FoodWaste Analytics — Synthetic Dataset Generator")
    print("=" * 60)

    df = generate_dataset()

    # Save
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'raw')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'food_waste_data.csv')
    df.to_csv(output_path, index=False)
    print(f"\nDataset saved to: {os.path.abspath(output_path)}")

    # Summary statistics
    print(f"\n{'─' * 50}")
    print(f"  Total records        : {len(df):,}")
    print(f"  Date range           : {df['date'].min()} to {df['date'].max()}")
    print(f"  Unique food items    : {df['food_item'].nunique()}")
    print(f"  Food categories      : {df['food_category'].nunique()}")
    print(f"  Meal types           : {df['meal_type'].nunique()}")
    print(f"  Special event days   : {df[df['special_event'] == True]['date'].nunique()}")
    print(f"  Missing students_served : {df['students_served'].isna().sum()}")
    print(f"  Missing cost_per_kg  : {df['cost_per_kg'].isna().sum()}")
    print(f"{'─' * 50}")
    print(f"  Total prepared (kg)  : {df['quantity_prepared'].sum():,.2f}")
    print(f"  Total consumed (kg)  : {df['quantity_consumed'].sum():,.2f}")
    print(f"  Total wasted (kg)    : {df['quantity_wasted'].sum():,.2f}")
    waste_pct = (df['quantity_wasted'].sum() / df['quantity_prepared'].sum()) * 100
    print(f"  Overall waste %      : {waste_pct:.2f}%")
    print(f"{'─' * 50}")

    print("\nRecords per meal type:")
    print(df['meal_type'].value_counts().to_string())

    print("\nRecords per category:")
    print(df['food_category'].value_counts().to_string())

    print("\nSample records:")
    print(df.head(5).to_string(index=False))
    print("\nDone!")


if __name__ == '__main__':
    main()
