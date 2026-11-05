from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean
from app import Base

VALID_CATEGORIES = ['Rice', 'Curry', 'Bread', 'Snacks', 'Beverages', 'Desserts', 'Salad', 'Fruits']
VALID_MEAL_TYPES = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner']


class FoodWasteRecord(Base):
    __tablename__ = 'food_waste_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False)
    food_item = Column(String(100), nullable=False)
    food_category = Column(String(50), nullable=False)
    meal_type = Column(String(30), nullable=False)
    quantity_prepared = Column(Float, nullable=False)
    quantity_consumed = Column(Float, nullable=False)
    quantity_wasted = Column(Float, nullable=False)
    students_served = Column(Integer, nullable=True)
    cost_per_kg = Column(Float, nullable=True, default=0)
    day_of_week = Column(String(15), nullable=True)
    special_event = Column(Boolean, default=False)
    remarks = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'food_item': self.food_item,
            'food_category': self.food_category,
            'meal_type': self.meal_type,
            'quantity_prepared': round(self.quantity_prepared, 2),
            'quantity_consumed': round(self.quantity_consumed, 2),
            'quantity_wasted': round(self.quantity_wasted, 2),
            'students_served': self.students_served,
            'cost_per_kg': round(self.cost_per_kg, 2) if self.cost_per_kg else 0,
            'day_of_week': self.day_of_week,
            'special_event': self.special_event,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'waste_percentage': round((self.quantity_wasted / self.quantity_prepared) * 100, 2) if self.quantity_prepared and self.quantity_prepared > 0 else 0,
            'financial_loss': round(self.quantity_wasted * (self.cost_per_kg or 0), 2),
        }
