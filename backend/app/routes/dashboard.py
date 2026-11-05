"""
Dashboard API — GET /api/dashboard
Returns KPIs and chart data for the front-end dashboard.
"""

from flask import Blueprint, request, jsonify, current_app
import pandas as pd
from sqlalchemy import func

from app.models.food_record import FoodWasteRecord
from app.utils.helpers import get_date_range, safe_divide

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')


@dashboard_bp.route('/dashboard', methods=['GET'])
def dashboard():
    session = current_app.db_session()

    # ── Query-param filters ────────────────────────────────
    period = request.args.get('period', 'all')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')

    start, end = get_date_range(period, start_date, end_date)

    query = session.query(FoodWasteRecord)
    if start:
        query = query.filter(FoodWasteRecord.date >= start)
    if end:
        query = query.filter(FoodWasteRecord.date <= end)
    if category:
        query = query.filter(FoodWasteRecord.food_category == category)

    records = query.all()

    if not records:
        return jsonify({
            'kpis': {
                'total_prepared': 0,
                'total_consumed': 0,
                'total_wasted': 0,
                'waste_percentage': 0,
                'financial_loss': 0,
                'total_records': 0,
                'food_items_count': 0,
                'avg_daily_waste': 0,
            },
            'charts': {
                'prepared_consumed_wasted': [],
                'monthly_waste_trend': [],
                'waste_by_category': [],
                'waste_by_meal': [],
                'top_wasted_items': [],
                'daily_consumption': [],
            },
        })

    # ── Build a DataFrame for aggregation ──────────────────
    data = []
    for r in records:
        data.append({
            'id': r.id,
            'date': r.date.isoformat() if r.date else None,
            'food_item': r.food_item,
            'food_category': r.food_category,
            'meal_type': r.meal_type,
            'quantity_prepared': r.quantity_prepared or 0,
            'quantity_consumed': r.quantity_consumed or 0,
            'quantity_wasted': r.quantity_wasted or 0,
            'cost_per_kg': r.cost_per_kg or 0,
            'students_served': r.students_served,
        })

    df = pd.DataFrame(data)
    df['financial_loss'] = df['quantity_wasted'] * df['cost_per_kg']

    # ── KPIs ───────────────────────────────────────────────
    total_prepared = float(df['quantity_prepared'].sum())
    total_consumed = float(df['quantity_consumed'].sum())
    total_wasted = float(df['quantity_wasted'].sum())
    total_fin_loss = float(df['financial_loss'].sum())
    num_days = df['date'].nunique() if 'date' in df.columns else 1

    kpis = {
        'total_prepared': round(total_prepared, 2),
        'total_consumed': round(total_consumed, 2),
        'total_wasted': round(total_wasted, 2),
        'waste_percentage': round(safe_divide(total_wasted, total_prepared) * 100, 2),
        'financial_loss': round(total_fin_loss, 2),
        'total_records': len(df),
        'food_items_count': int(df['food_item'].nunique()),
        'avg_daily_waste': round(safe_divide(total_wasted, max(num_days, 1)), 2),
    }

    # ── Chart 1: prepared / consumed / wasted by category ──
    cat_agg = (
        df.groupby('food_category')
        .agg(
            prepared=('quantity_prepared', 'sum'),
            consumed=('quantity_consumed', 'sum'),
            wasted=('quantity_wasted', 'sum'),
        )
        .reset_index()
    )
    prepared_consumed_wasted = []
    for _, row in cat_agg.iterrows():
        prepared_consumed_wasted.append({
            'category': row['food_category'],
            'prepared': round(float(row['prepared']), 2),
            'consumed': round(float(row['consumed']), 2),
            'wasted': round(float(row['wasted']), 2),
        })

    # ── Chart 2: monthly waste trend ───────────────────────
    df['month'] = pd.to_datetime(df['date']).dt.to_period('M').astype(str)
    month_agg = (
        df.groupby('month')
        .agg(wasted=('quantity_wasted', 'sum'), prepared=('quantity_prepared', 'sum'))
        .reset_index()
        .sort_values('month')
    )
    monthly_waste_trend = []
    for _, row in month_agg.iterrows():
        monthly_waste_trend.append({
            'month': row['month'],
            'wasted': round(float(row['wasted']), 2),
            'prepared': round(float(row['prepared']), 2),
        })

    # ── Chart 3: waste by category ─────────────────────────
    waste_by_category = []
    for _, row in cat_agg.iterrows():
        pct = round(safe_divide(float(row['wasted']), total_wasted) * 100, 2)
        waste_by_category.append({
            'category': row['food_category'],
            'wasted': round(float(row['wasted']), 2),
            'percentage': pct,
        })

    # ── Chart 4: waste by meal type ────────────────────────
    meal_agg = (
        df.groupby('meal_type')
        .agg(wasted=('quantity_wasted', 'sum'))
        .reset_index()
    )
    waste_by_meal = []
    for _, row in meal_agg.iterrows():
        pct = round(safe_divide(float(row['wasted']), total_wasted) * 100, 2)
        waste_by_meal.append({
            'meal_type': row['meal_type'],
            'wasted': round(float(row['wasted']), 2),
            'percentage': pct,
        })

    # ── Chart 5: top 10 wasted food items ──────────────────
    item_agg = (
        df.groupby('food_item')
        .agg(total_wasted=('quantity_wasted', 'sum'))
        .reset_index()
        .sort_values('total_wasted', ascending=False)
        .head(10)
    )
    top_wasted_items = []
    for _, row in item_agg.iterrows():
        top_wasted_items.append({
            'food_item': row['food_item'],
            'total_wasted': round(float(row['total_wasted']), 2),
        })

    # ── Chart 6: daily consumption trend ───────────────────
    daily_agg = (
        df.groupby('date')
        .agg(consumed=('quantity_consumed', 'sum'), prepared=('quantity_prepared', 'sum'))
        .reset_index()
        .sort_values('date')
    )
    daily_consumption = []
    for _, row in daily_agg.iterrows():
        daily_consumption.append({
            'date': row['date'],
            'consumed': round(float(row['consumed']), 2),
            'prepared': round(float(row['prepared']), 2),
        })

    return jsonify({
        'kpis': kpis,
        'charts': {
            'prepared_consumed_wasted': prepared_consumed_wasted,
            'monthly_waste_trend': monthly_waste_trend,
            'waste_by_category': waste_by_category,
            'waste_by_meal': waste_by_meal,
            'top_wasted_items': top_wasted_items,
            'daily_consumption': daily_consumption,
        },
    })
