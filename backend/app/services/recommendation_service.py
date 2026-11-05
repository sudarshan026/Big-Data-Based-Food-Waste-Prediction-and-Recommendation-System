"""
Recommendation engine service for FoodWaste Analytics.
Analyzes database records to generate rule-based dynamic recommendations
and item-level preparation quantity guidance with safety buffers.
"""

import pandas as pd
from sqlalchemy import func
from app.models.food_record import FoodWasteRecord


class RecommendationEngine:
    def __init__(self, session):
        self.session = session

    def generate_recommendations(self, category_filter=None):
        """Generate high-level smart recommendations based on real data patterns."""
        query = self.session.query(FoodWasteRecord)
        if category_filter:
            query = query.filter(FoodWasteRecord.food_category == category_filter)
            
        records = query.all()
        if not records:
            return []

        data = [{
            'food_item': r.food_item,
            'category': r.food_category,
            'meal_type': r.meal_type,
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted,
            'cost_per_kg': r.cost_per_kg or 0,
            'day_of_week': r.day_of_week or (r.date.strftime('%A') if r.date else 'Monday'),
            'special_event': r.special_event
        } for r in records]
        
        df = pd.DataFrame(data)
        df['financial_loss'] = df['wasted'] * df['cost_per_kg']
        
        recommendations = []
        rec_id = 1
        
        # 1. Overall Waste Alert
        total_prepared = df['prepared'].sum()
        total_wasted = df['wasted'].sum()
        total_loss = df['financial_loss'].sum()
        overall_waste_pct = (total_wasted / total_prepared * 100) if total_prepared > 0 else 0
        
        if overall_waste_pct > 20:
            recommendations.append({
                'id': rec_id,
                'type': 'critical',
                'priority': 'critical',
                'title': 'High Overall Canteen Waste Rate',
                'issue': f'Canteen food waste rate is {overall_waste_pct:.1f}%, exceeding the sustainable benchmark of 15%.',
                'data': {
                    'overall_waste_pct': round(overall_waste_pct, 1),
                    'total_wasted_kg': round(total_wasted, 1),
                    'total_loss_rs': round(total_loss, 0)
                },
                'action': 'Implement batch cooking, monitor student attendance closely, and establish immediate portion size controls.',
                'expected_benefit': f'Reducing waste by 5% could save ₹{round(total_loss * 0.25, 0):,} and eliminate {round(total_wasted * 0.25, 0)} kg of food waste.',
                'category': 'All Categories'
            })
            rec_id += 1
            
        # 2. Category-Level Analysis
        cat_grouped = df.groupby('category').agg({
            'prepared': 'sum',
            'wasted': 'sum',
            'financial_loss': 'sum'
        }).reset_index()
        cat_grouped['waste_pct'] = (cat_grouped['wasted'] / cat_grouped['prepared'] * 100).round(1)
        
        # Categories with critical waste
        for _, row in cat_grouped.iterrows():
            cat = row['category']
            pct = row['waste_pct']
            loss = row['financial_loss']
            wasted = row['wasted']
            
            if pct > 22:
                recommendations.append({
                    'id': rec_id,
                    'type': 'critical',
                    'priority': 'high',
                    'title': f'Critical Wastage in {cat} Category',
                    'issue': f'{cat} items show a high wastage rate of {pct:.1f}% with ₹{loss:,.0f} total estimated loss.',
                    'data': {
                        'category': cat,
                        'waste_pct': pct,
                        'wasted_kg': round(wasted, 1),
                        'financial_loss': round(loss, 0)
                    },
                    'action': f'Reduce standard preparation batches for {cat} by 15-20% and implement real-time demand counters.',
                    'expected_benefit': f'Estimated monthly financial savings of ₹{round(loss * 0.2, 0):,}.',
                    'category': cat
                })
                rec_id += 1
            elif pct > 16:
                recommendations.append({
                    'id': rec_id,
                    'type': 'warning',
                    'priority': 'medium',
                    'title': f'Elevated Wastage in {cat}',
                    'issue': f'{cat} category experiences {pct:.1f}% average waste ({round(wasted, 1)} kg wasted).',
                    'data': {
                        'category': cat,
                        'waste_pct': pct,
                        'wasted_kg': round(wasted, 1),
                        'financial_loss': round(loss, 0)
                    },
                    'action': f'Audit serving portions and improve storage management for perishable {cat} ingredients.',
                    'expected_benefit': f'Prevent surplus preparation and save up to ₹{round(loss * 0.15, 0):,}.',
                    'category': cat
                })
                rec_id += 1
                
        # 3. Item-Specific Wastage
        item_grouped = df.groupby(['food_item', 'category']).agg({
            'prepared': 'sum',
            'wasted': 'sum',
            'financial_loss': 'sum'
        }).reset_index()
        item_grouped['waste_pct'] = (item_grouped['wasted'] / item_grouped['prepared'] * 100).round(1)
        
        # Most wasted item
        worst_item = item_grouped.sort_values(by='wasted', ascending=False).iloc[0]
        recommendations.append({
            'id': rec_id,
            'type': 'critical',
            'priority': 'high',
            'title': f'Top Wasted Food Item: {worst_item["food_item"]}',
            'issue': f'{worst_item["food_item"]} is the highest wasted item with {round(worst_item["wasted"], 1)} kg discarded ({worst_item["waste_pct"]:.1f}% waste).',
            'data': {
                'item': worst_item['food_item'],
                'waste_pct': worst_item['waste_pct'],
                'wasted_kg': round(worst_item['wasted'], 1),
                'financial_loss': round(worst_item['financial_loss'], 0)
            },
            'action': f'Review recipe preference, calibrate portion sizes, and cut initial prep batch by 15%.',
            'expected_benefit': f'Save approximately ₹{round(worst_item["financial_loss"] * 0.25, 0):,} and preserve nutritious food.',
            'category': worst_item['category']
        })
        rec_id += 1
        
        # Well-managed items (Low Waste)
        best_items = item_grouped[item_grouped['waste_pct'] < 7].sort_values(by='prepared', ascending=False)
        if not best_items.empty:
            best_item = best_items.iloc[0]
            recommendations.append({
                'id': rec_id,
                'type': 'success',
                'priority': 'low',
                'title': f'Exemplary Demand Matching: {best_item["food_item"]}',
                'issue': f'{best_item["food_item"]} demonstrates exceptional consumption efficiency with only {best_item["waste_pct"]:.1f}% waste.',
                'data': {
                    'item': best_item['food_item'],
                    'waste_pct': best_item['waste_pct'],
                    'prepared_kg': round(best_item['prepared'], 1)
                },
                'action': 'Maintain current preparation methodology and use as benchmark standard across similar items.',
                'expected_benefit': 'Continued high student satisfaction with minimal food loss.',
                'category': best_item['category']
            })
            rec_id += 1
            
        # 4. Meal Pattern Analysis
        meal_grouped = df.groupby('meal_type').agg({
            'prepared': 'sum',
            'wasted': 'sum'
        }).reset_index()
        meal_grouped['waste_pct'] = (meal_grouped['wasted'] / meal_grouped['prepared'] * 100).round(1)
        worst_meal = meal_grouped.sort_values(by='waste_pct', ascending=False).iloc[0]
        
        recommendations.append({
            'id': rec_id,
            'type': 'info',
            'priority': 'medium',
            'title': f'{worst_meal["meal_type"]} Meal Optimization Needed',
            'issue': f'{worst_meal["meal_type"]} experiences the highest proportion of waste at {worst_meal["waste_pct"]:.1f}%.',
            'data': {
                'meal_type': worst_meal['meal_type'],
                'waste_pct': worst_meal['waste_pct'],
                'wasted_kg': round(worst_meal['wasted'], 1)
            },
            'action': f'Survey students regarding {worst_meal["meal_type"]} menu options and align preparation with class schedules.',
            'expected_benefit': 'Better align menu items with student meal timings and appetites.',
            'category': 'Meal Planning'
        })
        rec_id += 1
        
        return recommendations

    def get_preparation_table(self):
        """Item-wise demand forecast and recommended preparation quantities."""
        records = self.session.query(FoodWasteRecord).all()
        if not records:
            return []

        data = [{
            'food_item': r.food_item,
            'food_category': r.food_category,
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted,
            'cost_per_kg': r.cost_per_kg or 0
        } for r in records]
        
        df = pd.DataFrame(data)
        grouped = df.groupby(['food_item', 'food_category']).agg({
            'prepared': 'mean',
            'consumed': 'mean',
            'wasted': 'mean',
            'cost_per_kg': 'mean'
        }).reset_index()
        
        safety_buffer_pct = 10.0
        results = []
        
        for _, row in grouped.iterrows():
            avg_prep = round(float(row['prepared']), 2)
            avg_cons = round(float(row['consumed']), 2)
            avg_waste = round(float(row['wasted']), 2)
            waste_pct = round((avg_waste / avg_prep * 100), 2) if avg_prep > 0 else 0
            
            # Predicted demand is the historical consumption
            predicted_demand = avg_cons
            # Recommended prep = predicted demand + 10% safety buffer
            rec_prep = round(predicted_demand * (1 + (safety_buffer_pct / 100)), 2)
            potential_reduction = round(max(0.0, avg_prep - rec_prep), 2)
            
            if waste_pct > 25:
                recommendation = "Significantly reduce preparation"
                action_type = "critical"
                explanation = f"High waste rate ({waste_pct}%). Reduce prep by {potential_reduction} kg to limit excess."
            elif waste_pct > 15:
                recommendation = "Reduce preparation"
                action_type = "warning"
                explanation = f"Moderate waste rate ({waste_pct}%). Prep can be lowered by {potential_reduction} kg safely."
            elif waste_pct < 6:
                recommendation = "Well managed"
                action_type = "success"
                explanation = f"Minimal waste ({waste_pct}%). Maintain current preparation rate."
            else:
                recommendation = "Maintain current quantity"
                action_type = "info"
                explanation = f"Waste rate is within acceptable range ({waste_pct}%)."

            results.append({
                'food_item': row['food_item'],
                'food_category': row['food_category'],
                'avg_prepared': avg_prep,
                'avg_consumed': avg_cons,
                'avg_wasted': avg_waste,
                'waste_percentage': waste_pct,
                'predicted_demand': predicted_demand,
                'recommended_preparation': rec_prep,
                'safety_buffer': safety_buffer_pct,
                'potential_waste_reduction': potential_reduction,
                'recommendation': recommendation,
                'action_type': action_type,
                'recommendation_detail': explanation
            })
            
        results.sort(key=lambda x: x['waste_percentage'], reverse=True)
        return results
