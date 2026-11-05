import os
from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base

Base = declarative_base()


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config['SECRET_KEY'] = 'foodwaste-analytics-2026'

    os.makedirs(app.instance_path, exist_ok=True)
    db_path = os.path.join(app.instance_path, 'foodwaste.db')
    app.config['DATABASE_URI'] = f'sqlite:///{db_path}'

    engine = create_engine(app.config['DATABASE_URI'], echo=False)
    session_factory = sessionmaker(bind=engine)
    Session = scoped_session(session_factory)

    app.engine = engine
    app.db_session = Session

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.models.food_record import FoodWasteRecord
    Base.metadata.create_all(engine)

    # Register all blueprints
    from app.routes.dashboard import dashboard_bp
    from app.routes.records import records_bp
    from app.routes.analytics import analytics_bp
    from app.routes.predictions import predictions_bp
    from app.routes.recommendations import recommendations_bp
    from app.routes.reports import reports_bp
    from app.routes.spark_routes import spark_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(records_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(predictions_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(spark_bp)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        Session.remove()

    return app
