"""
Recommendation routes for FoodWaste Analytics.
Provides endpoints for smart actionable recommendations and preparation guidelines.
"""

from flask import Blueprint, request, jsonify, current_app
from app.services.recommendation_service import RecommendationEngine

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api')


@recommendations_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Retrieve dynamic data-driven recommendations."""
    category = request.args.get('category')
    session = current_app.db_session()
    try:
        engine = RecommendationEngine(session)
        recommendations = engine.generate_recommendations(category_filter=category)
        return jsonify({'recommendations': recommendations})
    finally:
        session.close()


@recommendations_bp.route('/recommendations/preparation', methods=['GET'])
def get_preparation_recommendations():
    """Retrieve item-by-item preparation recommendations with safety buffer."""
    session = current_app.db_session()
    try:
        engine = RecommendationEngine(session)
        table_data = engine.get_preparation_table()
        return jsonify({'preparation_table': table_data})
    finally:
        session.close()

