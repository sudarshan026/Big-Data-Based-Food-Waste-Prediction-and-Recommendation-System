"""
Analytics routes for FoodWaste Analytics.
Provides endpoints for category, meal, trend, and overall waste analysis.
"""

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func
import pandas as pd
from datetime import datetime, date, timedelta
from app.models.food_record import FoodWasteRecord
from app.utils.helpers import parse_date, get_date_range, safe_divide

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


def _get_filtered_query(session, start_date=None, end_date=None, category=None):
    query = session.query(FoodWasteRecord)
    if start_date:
        query = query.filter(FoodWasteRecord.date >= start_date)
    if end_date:
        query = query.filter(FoodWasteRecord.date <= end_date)
    if category:
        query = query.filter(FoodWasteRecord.food_category == category)
    return query


@analytics_bp.route('/waste', methods=['GET'])
def get_waste_overview():
    """Overall waste analysis with aggregate metrics."""
    session = current_app.db_session()
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        period = request.args.get('period', 'all')
        
        start_date, end_date = get_date_range(period, start_date_str, end_date_str)
        query = _get_filtered_query(session, start_date, end_date)
        
        records = query.all()
        if not records:
            return jsonify({
                'total_prepared': 0,
                'total_consumed': 0,
                'total_wasted': 0,
                'waste_percentage': 0,
                'total_financial_loss': 0,
                'avg_daily_waste': 0,
                'avg_waste_per_record': 0,
                'days_with_high_waste': 0,
                'total_records': 0
            })
            
        data = [{
            'date': r.date,
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted,
            'cost': r.cost_per_kg or 0,
            'financial_loss': r.quantity_wasted * (r.cost_per_kg or 0)
        } for r in records]
        
        df = pd.DataFrame(data)
        
        total_prepared = round(float(df['prepared'].sum()), 2)
        total_consumed = round(float(df['consumed'].sum()), 2)
        total_wasted = round(float(df['wasted'].sum()), 2)
        waste_pct = round(safe_divide(total_wasted, total_prepared) * 100, 2)
        total_loss = round(float(df['financial_loss'].sum()), 2)
        
        # Daily aggregations for daily stats
        daily_df = df.groupby('date').agg({
            'prepared': 'sum',
            'wasted': 'sum'
        }).reset_index()
        daily_df['waste_pct'] = (daily_df['wasted'] / daily_df['prepared']) * 100
        
        avg_daily_waste = round(float(daily_df['wasted'].mean()), 2) if len(daily_df) > 0 else 0
        high_waste_days = int((daily_df['waste_pct'] > 20).sum())
        
        return jsonify({
            'total_prepared': total_prepared,
            'total_consumed': total_consumed,
            'total_wasted': total_wasted,
            'waste_percentage': waste_pct,
            'total_financial_loss': total_loss,
            'avg_daily_waste': avg_daily_waste,
            'avg_waste_per_record': round(total_wasted / len(records), 2),
            'days_with_high_waste': high_waste_days,
            'total_records': len(records),
            'unique_days': len(daily_df)
        })
    finally:
        session.close()


@analytics_bp.route('/category', methods=['GET'])
def get_category_analysis():
    """Detailed category-wise waste breakdown."""
    session = current_app.db_session()
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        period = request.args.get('period', 'all')
        
        start_date, end_date = get_date_range(period, start_date_str, end_date_str)
        query = _get_filtered_query(session, start_date, end_date)
        records = query.all()
        
        if not records:
            return jsonify({'categories': []})
            
        data = [{
            'category': r.food_category,
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted,
            'cost': r.cost_per_kg or 0,
            'financial_loss': r.quantity_wasted * (r.cost_per_kg or 0)
        } for r in records]
        
        df = pd.DataFrame(data)
        grouped = df.groupby('category').agg({
            'prepared': 'sum',
            'consumed': 'sum',
            'wasted': 'sum',
            'financial_loss': 'sum',
            'category': 'count'
        }).rename(columns={'category': 'record_count'})
        
        grouped['waste_percentage'] = (grouped['wasted'] / grouped['prepared'] * 100).round(2)
        grouped['prepared'] = grouped['prepared'].round(2)
        grouped['consumed'] = grouped['consumed'].round(2)
        grouped['wasted'] = grouped['wasted'].round(2)
        grouped['financial_loss'] = grouped['financial_loss'].round(2)
        
        grouped = grouped.sort_values(by='wasted', ascending=False).reset_index()
        
        return jsonify({
            'categories': grouped.to_dict(orient='records')
        })
    finally:
        session.close()


@analytics_bp.route('/meal', methods=['GET'])
def get_meal_analysis():
    """Meal-wise waste comparison."""
    session = current_app.db_session()
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        period = request.args.get('period', 'all')
        
        start_date, end_date = get_date_range(period, start_date_str, end_date_str)
        query = _get_filtered_query(session, start_date, end_date)
        records = query.all()
        
        if not records:
            return jsonify({'meals': []})
            
        data = [{
            'meal_type': r.meal_type,
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted,
            'students': r.students_served or 0,
            'financial_loss': r.quantity_wasted * (r.cost_per_kg or 0)
        } for r in records]
        
        df = pd.DataFrame(data)
        grouped = df.groupby('meal_type').agg({
            'prepared': 'sum',
            'consumed': 'sum',
            'wasted': 'sum',
            'students': 'mean',
            'financial_loss': 'sum',
            'meal_type': 'count'
        }).rename(columns={'meal_type': 'record_count'})
        
        grouped['waste_percentage'] = (grouped['wasted'] / grouped['prepared'] * 100).round(2)
        grouped['prepared'] = grouped['prepared'].round(2)
        grouped['consumed'] = grouped['consumed'].round(2)
        grouped['wasted'] = grouped['wasted'].round(2)
        grouped['students'] = grouped['students'].round(0)
        grouped['financial_loss'] = grouped['financial_loss'].round(2)
        
        # Sort by typical meal order
        meal_order = {'Breakfast': 1, 'Lunch': 2, 'Evening Snacks': 3, 'Dinner': 4}
        grouped['order'] = grouped.index.map(lambda x: meal_order.get(x, 99))
        grouped = grouped.sort_values('order').drop(columns=['order']).reset_index()
        
        return jsonify({
            'meals': grouped.to_dict(orient='records')
        })
    finally:
        session.close()


@analytics_bp.route('/trends', methods=['GET'])
def get_trends():
    """Daily, weekly, and monthly waste trends."""
    session = current_app.db_session()
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        period = request.args.get('period', '90days')
        
        start_date, end_date = get_date_range(period, start_date_str, end_date_str)
        query = _get_filtered_query(session, start_date, end_date)
        records = query.all()
        
        if not records:
            return jsonify({'daily': [], 'weekly': [], 'monthly': []})
            
        data = [{
            'date': r.date.isoformat(),
            'date_obj': r.date,
            'day_of_week': r.date.strftime('%A'),
            'month': r.date.strftime('%Y-%m'),
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted
        } for r in records]
        
        df = pd.DataFrame(data)
        
        # Daily trend
        daily = df.groupby('date').agg({
            'prepared': 'sum',
            'consumed': 'sum',
            'wasted': 'sum'
        }).reset_index().sort_values('date')
        daily['waste_pct'] = (daily['wasted'] / daily['prepared'] * 100).round(2)
        daily['prepared'] = daily['prepared'].round(2)
        daily['consumed'] = daily['consumed'].round(2)
        daily['wasted'] = daily['wasted'].round(2)
        
        # Weekly pattern (Mon-Sun)
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        weekly = df.groupby('day_of_week').agg({
            'prepared': 'mean',
            'consumed': 'mean',
            'wasted': 'mean'
        }).reindex(day_order).reset_index()
        weekly['waste_pct'] = (weekly['wasted'] / weekly['prepared'] * 100).round(2)
        weekly['prepared'] = weekly['prepared'].round(2)
        weekly['consumed'] = weekly['consumed'].round(2)
        weekly['wasted'] = weekly['wasted'].round(2)
        
        # Monthly trend
        monthly = df.groupby('month').agg({
            'prepared': 'sum',
            'consumed': 'sum',
            'wasted': 'sum'
        }).reset_index().sort_values('month')
        monthly['waste_pct'] = (monthly['wasted'] / monthly['prepared'] * 100).round(2)
        monthly['prepared'] = monthly['prepared'].round(2)
        monthly['consumed'] = monthly['consumed'].round(2)
        monthly['wasted'] = monthly['wasted'].round(2)
        
        return jsonify({
            'daily': daily.to_dict(orient='records'),
            'weekly': weekly.to_dict(orient='records'),
            'monthly': monthly.to_dict(orient='records')
        })
    finally:
        session.close()

