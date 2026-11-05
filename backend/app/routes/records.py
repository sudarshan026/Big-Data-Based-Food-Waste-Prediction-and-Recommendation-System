"""
CRUD routes for food waste records.
Blueprint: records_bp, prefix /api
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import asc, desc

from app.models.food_record import FoodWasteRecord, VALID_CATEGORIES, VALID_MEAL_TYPES
from app.utils.helpers import parse_date

records_bp = Blueprint('records', __name__, url_prefix='/api')


# ───────────────────────────────────────────────────────────
# GET  /api/food-records  — list with pagination & filters
# ───────────────────────────────────────────────────────────
@records_bp.route('/food-records', methods=['GET'])
def list_records():
    session = current_app.db_session()

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    per_page = min(per_page, 100)  # cap

    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    meal_type = request.args.get('meal_type', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    sort_by = request.args.get('sort_by', 'date').strip()
    sort_order = request.args.get('sort_order', 'desc').strip().lower()

    query = session.query(FoodWasteRecord)

    # Filters
    if search:
        like = f'%{search}%'
        query = query.filter(
            FoodWasteRecord.food_item.ilike(like)
            | FoodWasteRecord.food_category.ilike(like)
            | FoodWasteRecord.meal_type.ilike(like)
        )
    if category:
        query = query.filter(FoodWasteRecord.food_category == category)
    if meal_type:
        query = query.filter(FoodWasteRecord.meal_type == meal_type)

    sd = parse_date(start_date)
    ed = parse_date(end_date)
    if sd:
        query = query.filter(FoodWasteRecord.date >= sd)
    if ed:
        query = query.filter(FoodWasteRecord.date <= ed)

    # Sorting
    sort_col_map = {
        'date': FoodWasteRecord.date,
        'food_item': FoodWasteRecord.food_item,
        'food_category': FoodWasteRecord.food_category,
        'meal_type': FoodWasteRecord.meal_type,
        'quantity_prepared': FoodWasteRecord.quantity_prepared,
        'quantity_consumed': FoodWasteRecord.quantity_consumed,
        'quantity_wasted': FoodWasteRecord.quantity_wasted,
        'students_served': FoodWasteRecord.students_served,
        'cost_per_kg': FoodWasteRecord.cost_per_kg,
        'id': FoodWasteRecord.id,
    }
    sort_column = sort_col_map.get(sort_by, FoodWasteRecord.date)
    if sort_order == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = min(page, total_pages)
    records = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'records': [r.to_dict() for r in records],
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': total_pages,
    })


# ───────────────────────────────────────────────────────────
# POST /api/food-records  — create a new record
# ───────────────────────────────────────────────────────────
@records_bp.route('/food-records', methods=['POST'])
def create_record():
    session = current_app.db_session()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    errors = _validate_record(data)
    if errors:
        return jsonify({'errors': errors}), 400

    qty_prepared = float(data['quantity_prepared'])
    qty_consumed = float(data.get('quantity_consumed', 0))
    qty_wasted = round(qty_prepared - qty_consumed, 2)

    record_date = parse_date(data['date'])

    record = FoodWasteRecord(
        date=record_date,
        food_item=data['food_item'].strip(),
        food_category=data['food_category'].strip(),
        meal_type=data['meal_type'].strip(),
        quantity_prepared=qty_prepared,
        quantity_consumed=qty_consumed,
        quantity_wasted=qty_wasted,
        students_served=int(data['students_served']) if data.get('students_served') is not None else None,
        cost_per_kg=float(data['cost_per_kg']) if data.get('cost_per_kg') is not None else None,
        day_of_week=record_date.strftime('%A') if record_date else data.get('day_of_week', ''),
        special_event=bool(data.get('special_event', False)),
        remarks=data.get('remarks', ''),
    )

    session.add(record)
    session.commit()
    session.refresh(record)

    return jsonify({'message': 'Record created successfully', 'record': record.to_dict()}), 201


# ───────────────────────────────────────────────────────────
# GET  /api/food-records/<id>  — single record
# ───────────────────────────────────────────────────────────
@records_bp.route('/food-records/<int:record_id>', methods=['GET'])
def get_record(record_id):
    session = current_app.db_session()
    record = session.query(FoodWasteRecord).get(record_id)
    if not record:
        return jsonify({'error': 'Record not found'}), 404
    return jsonify({'record': record.to_dict()})


# ───────────────────────────────────────────────────────────
# PUT  /api/food-records/<id>  — update
# ───────────────────────────────────────────────────────────
@records_bp.route('/food-records/<int:record_id>', methods=['PUT'])
def update_record(record_id):
    session = current_app.db_session()
    record = session.query(FoodWasteRecord).get(record_id)
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be JSON'}), 400

    errors = _validate_record(data, is_update=True)
    if errors:
        return jsonify({'errors': errors}), 400

    if 'date' in data:
        d = parse_date(data['date'])
        if d:
            record.date = d
            record.day_of_week = d.strftime('%A')
    if 'food_item' in data:
        record.food_item = data['food_item'].strip()
    if 'food_category' in data:
        record.food_category = data['food_category'].strip()
    if 'meal_type' in data:
        record.meal_type = data['meal_type'].strip()
    if 'quantity_prepared' in data:
        record.quantity_prepared = float(data['quantity_prepared'])
    if 'quantity_consumed' in data:
        record.quantity_consumed = float(data['quantity_consumed'])

    # Recalculate waste
    record.quantity_wasted = round(record.quantity_prepared - record.quantity_consumed, 2)

    if 'students_served' in data:
        record.students_served = int(data['students_served']) if data['students_served'] is not None else None
    if 'cost_per_kg' in data:
        record.cost_per_kg = float(data['cost_per_kg']) if data['cost_per_kg'] is not None else None
    if 'special_event' in data:
        record.special_event = bool(data['special_event'])
    if 'remarks' in data:
        record.remarks = data.get('remarks', '')

    session.commit()
    session.refresh(record)
    return jsonify({'message': 'Record updated successfully', 'record': record.to_dict()})


# ───────────────────────────────────────────────────────────
# DELETE /api/food-records/<id>
# ───────────────────────────────────────────────────────────
@records_bp.route('/food-records/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    session = current_app.db_session()
    record = session.query(FoodWasteRecord).get(record_id)
    if not record:
        return jsonify({'error': 'Record not found'}), 404

    session.delete(record)
    session.commit()
    return jsonify({'message': f'Record {record_id} deleted successfully'})


# ───────────────────────────────────────────────────────────
# Validation helper
# ───────────────────────────────────────────────────────────
def _validate_record(data, is_update=False):
    """Return a list of validation error strings (empty = valid)."""
    errors = []

    # For create, these fields are required
    if not is_update:
        if not data.get('date'):
            errors.append('date is required (YYYY-MM-DD)')
        elif not parse_date(data['date']):
            errors.append('date must be in YYYY-MM-DD format')

        if not data.get('food_item'):
            errors.append('food_item is required')
        if not data.get('food_category'):
            errors.append('food_category is required')
        if not data.get('meal_type'):
            errors.append('meal_type is required')
        if data.get('quantity_prepared') is None:
            errors.append('quantity_prepared is required')

    # Validate values when present
    if 'food_category' in data and data['food_category'] not in VALID_CATEGORIES:
        errors.append(f"food_category must be one of {VALID_CATEGORIES}")
    if 'meal_type' in data and data['meal_type'] not in VALID_MEAL_TYPES:
        errors.append(f"meal_type must be one of {VALID_MEAL_TYPES}")

    if 'quantity_prepared' in data:
        try:
            qp = float(data['quantity_prepared'])
            if qp <= 0:
                errors.append('quantity_prepared must be > 0')
        except (TypeError, ValueError):
            errors.append('quantity_prepared must be a number')

    if 'quantity_consumed' in data:
        try:
            qc = float(data['quantity_consumed'])
            if qc < 0:
                errors.append('quantity_consumed must be >= 0')
            qp = float(data.get('quantity_prepared', 0))
            if qp and qc > qp:
                errors.append('quantity_consumed cannot exceed quantity_prepared')
        except (TypeError, ValueError):
            errors.append('quantity_consumed must be a number')

    if 'date' in data and data['date'] and not parse_date(data['date']):
        errors.append('date must be in YYYY-MM-DD format')

    return errors
