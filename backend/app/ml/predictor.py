"""
Machine Learning demand prediction module for FoodWaste Analytics.
Uses Scikit-learn RandomForestRegressor to forecast food consumption and optimal preparation.
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

logger = logging.getLogger(__name__)


class FoodWastePredictor:
    def __init__(self, model_dir=None):
        if model_dir is None:
            # Default to root/models directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..', 'models'))
        else:
            self.model_dir = model_dir
            
        os.makedirs(self.model_dir, exist_ok=True)
        self.model_path = os.path.join(self.model_dir, 'demand_predictor.joblib')
        self.meta_path = os.path.join(self.model_dir, 'model_meta.joblib')
        self.model = None
        self.label_encoders = {}
        self.is_trained = False
        self.metrics = {}
        self.feature_names = [
            'food_item_encoded', 'food_category_encoded', 'meal_type_encoded', 
            'day_of_week_encoded', 'month', 'special_event_int', 'quantity_prepared'
        ]
        self._load_model()
    
    def _load_model(self):
        """Try loading previously trained model and encoders."""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.meta_path):
                self.model = joblib.load(self.model_path)
                meta = joblib.load(self.meta_path)
                self.label_encoders = meta.get('encoders', {})
                self.metrics = meta.get('metrics', {})
                self.is_trained = True
                logger.info("Loaded trained FoodWastePredictor model.")
        except Exception as e:
            logger.warning(f"Could not load pre-existing model: {e}")
            self.is_trained = False

    def train(self, db_session):
        """Train RandomForestRegressor on database records."""
        from app.models.food_record import FoodWasteRecord
        
        records = db_session.query(FoodWasteRecord).all()
        if len(records) < 50:
            return {
                'status': 'insufficient_data',
                'message': f'Requires at least 50 historical records, but only {len(records)} found.'
            }
        
        data = []
        for r in records:
            dow = r.day_of_week or (r.date.strftime('%A') if r.date else 'Monday')
            month = r.date.month if r.date else 1
            data.append({
                'food_item': r.food_item,
                'food_category': r.food_category,
                'meal_type': r.meal_type,
                'day_of_week': dow,
                'month': month,
                'special_event': 1 if r.special_event else 0,
                'quantity_prepared': r.quantity_prepared,
                'quantity_consumed': r.quantity_consumed
            })
            
        df = pd.DataFrame(data)
        
        self.label_encoders = {}
        for col in ['food_item', 'food_category', 'meal_type', 'day_of_week']:
            le = LabelEncoder()
            df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
            self.label_encoders[col] = le
            
        df['special_event_int'] = df['special_event']
        
        X = df[self.feature_names]
        y = df['quantity_consumed']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        
        self.metrics = {
            'mae': round(float(mean_absolute_error(y_test, y_pred)), 3),
            'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 3),
            'r2_score': round(float(r2_score(y_test, y_pred)), 3),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'total_samples': len(df),
            'feature_importance': dict(zip(
                self.feature_names, 
                [round(float(x), 4) for x in self.model.feature_importances_]
            ))
        }
        
        joblib.dump(self.model, self.model_path)
        joblib.dump({'encoders': self.label_encoders, 'metrics': self.metrics}, self.meta_path)
        self.is_trained = True
        
        return {
            'status': 'trained',
            'metrics': self.metrics
        }

    def predict(self, input_data, db_session):
        """Predict expected consumption and recommend preparation amount."""
        from app.models.food_record import FoodWasteRecord
        from sqlalchemy import func
        
        food_item = input_data.get('food_item', '')
        meal_type = input_data.get('meal_type', '')
        qty_prepared = float(input_data.get('quantity_prepared', 50.0))
        safety_buffer_pct = float(input_data.get('safety_buffer_percent', 10.0))
        
        # Historical baseline calculations
        hist = db_session.query(
            func.avg(FoodWasteRecord.quantity_consumed).label('avg_consumed'),
            func.avg(FoodWasteRecord.quantity_wasted).label('avg_wasted'),
            func.avg(FoodWasteRecord.quantity_prepared).label('avg_prepared')
        ).filter(
            FoodWasteRecord.food_item == food_item,
            FoodWasteRecord.meal_type == meal_type
        ).first()
        
        hist_avg_consumed = round(float(hist.avg_consumed), 2) if hist and hist.avg_consumed else None
        hist_avg_wasted = round(float(hist.avg_wasted), 2) if hist and hist.avg_wasted else None
        hist_avg_prepared = round(float(hist.avg_prepared), 2) if hist and hist.avg_prepared else None
        
        if not self.is_trained:
            # Baseline estimation
            if hist_avg_consumed and hist_avg_prepared and hist_avg_prepared > 0:
                ratio = hist_avg_consumed / hist_avg_prepared
                pred_consumed = round(qty_prepared * ratio, 2)
            else:
                pred_consumed = round(qty_prepared * 0.82, 2)  # default 82% consumption
                
            pred_waste = round(max(0, qty_prepared - pred_consumed), 2)
            pred_waste_pct = round((pred_waste / qty_prepared) * 100, 2) if qty_prepared > 0 else 0
            recommended_prep = round(pred_consumed * (1 + (safety_buffer_pct / 100)), 2)
            
            return {
                'predicted_consumption': pred_consumed,
                'predicted_waste': pred_waste,
                'predicted_waste_percentage': pred_waste_pct,
                'recommended_preparation': recommended_prep,
                'safety_buffer_percent': safety_buffer_pct,
                'historical_avg_consumption': hist_avg_consumed,
                'historical_avg_waste': hist_avg_wasted,
                'historical_avg_prepared': hist_avg_prepared,
                'model_info': {
                    'model_type': 'Historical Average (Baseline)',
                    'is_trained': False,
                    'message': 'Baseline prediction. Train model for machine learning forecasts.'
                },
                'disclaimer': 'Estimates based on historical averages. Model training recommended.'
            }
            
        try:
            features = {}
            for col in ['food_item', 'food_category', 'meal_type', 'day_of_week']:
                le = self.label_encoders.get(col)
                val = str(input_data.get(col, ''))
                if le and val in le.classes_:
                    features[f'{col}_encoded'] = le.transform([val])[0]
                else:
                    features[f'{col}_encoded'] = 0
                    
            features['month'] = int(input_data.get('month', 11))
            features['special_event_int'] = 1 if input_data.get('special_event', False) else 0
            features['quantity_prepared'] = qty_prepared
            
            X_input = pd.DataFrame([features])[self.feature_names]
            raw_pred = float(self.model.predict(X_input)[0])
            pred_consumed = round(max(0.0, min(raw_pred, qty_prepared)), 2)
            pred_waste = round(max(0.0, qty_prepared - pred_consumed), 2)
            pred_waste_pct = round((pred_waste / qty_prepared) * 100, 2) if qty_prepared > 0 else 0
            recommended_prep = round(pred_consumed * (1 + (safety_buffer_pct / 100)), 2)
            
            return {
                'predicted_consumption': pred_consumed,
                'predicted_waste': pred_waste,
                'predicted_waste_percentage': pred_waste_pct,
                'recommended_preparation': recommended_prep,
                'safety_buffer_percent': safety_buffer_pct,
                'historical_avg_consumption': hist_avg_consumed,
                'historical_avg_waste': hist_avg_wasted,
                'historical_avg_prepared': hist_avg_prepared,
                'model_info': {
                    'model_type': 'Random Forest Regressor',
                    'is_trained': True,
                    'mae': self.metrics.get('mae'),
                    'rmse': self.metrics.get('rmse'),
                    'r2_score': self.metrics.get('r2_score'),
                    'training_samples': self.metrics.get('training_samples'),
                    'feature_importance': self.metrics.get('feature_importance')
                },
                'disclaimer': 'ML predictions are estimations based on trained Random Forest models.'
            }
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {'error': str(e)}

    def get_metrics(self):
        return {
            'is_trained': self.is_trained,
            'metrics': self.metrics if self.is_trained else {},
            'model_type': 'Random Forest Regressor' if self.is_trained else 'Not trained'
        }

