"""
Prediction routes for FoodWaste Analytics.
Provides endpoints for predicting consumption demand, model metrics, and item lists.
"""

from flask import Blueprint, request, jsonify, current_app
from app.models.food_record import FoodWasteRecord
from app.ml.predictor import FoodWastePredictor

predictions_bp = Blueprint('predictions', __name__, url_prefix='/api')
_predictor_instance = None


def get_predictor():
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = FoodWastePredictor()
    return _predictor_instance


@predictions_bp.route('/predict', methods=['POST'])
def predict_demand():
    """Predict food consumption and recommended preparation amount."""
    data = request.get_json() or {}
    
    if not data.get('food_item'):
        return jsonify({'error': 'food_item is required'}), 400
    if not data.get('meal_type'):
        return jsonify({'error': 'meal_type is required'}), 400
        
    session = current_app.db_session()
    try:
        predictor = get_predictor()
        result = predictor.predict(data, session)
        return jsonify(result)
    finally:
        session.close()


@predictions_bp.route('/predict/train', methods=['POST'])
def train_model():
    """Trigger training or retraining of the ML prediction model."""
    session = current_app.db_session()
    try:
        predictor = get_predictor()
        train_result = predictor.train(session)
        return jsonify(train_result)
    finally:
        session.close()


@predictions_bp.route('/predict/metrics', methods=['GET'])
def get_model_metrics():
    """Get the evaluation metrics of the demand prediction model."""
    predictor = get_predictor()
    return jsonify(predictor.get_metrics())


@predictions_bp.route('/predict/items', methods=['GET'])
def get_prediction_items():
    """Return distinct food items, categories, and meal types for selection."""
    session = current_app.db_session()
    try:
        # Get items and categories
        items_query = session.query(
            FoodWasteRecord.food_item,
            FoodWasteRecord.food_category
        ).distinct().order_by(FoodWasteRecord.food_item).all()
        
        items = [{'food_item': item, 'food_category': cat} for item, cat in items_query]
        categories = sorted(list(set(cat for _, cat in items_query)))
        meal_types = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        return jsonify({
            'items': items,
            'categories': categories,
            'meal_types': meal_types,
            'days_of_week': days_of_week
        })
    finally:
        session.close()

