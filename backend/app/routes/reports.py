"""
Report routes for FoodWaste Analytics.
Provides endpoints for downloading CSV exports and PDF analytical audit reports.
"""

from flask import Blueprint, request, make_response, current_app
from datetime import datetime
from app.services.report_service import ReportGenerator
from app.utils.helpers import get_date_range

reports_bp = Blueprint('reports', __name__, url_prefix='/api')


@reports_bp.route('/reports', methods=['GET'])
def export_report():
    """Download CSV data export or generated PDF report."""
    fmt = request.args.get('format', 'csv').lower()
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    period = request.args.get('period', 'all')
    
    start_date, end_date = get_date_range(period, start_date_str, end_date_str)
    session = current_app.db_session()
    
    try:
        generator = ReportGenerator(session)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if fmt == 'pdf':
            pdf_bytes = generator.generate_pdf(start_date, end_date)
            response = make_response(pdf_bytes)
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename=FoodWaste_Report_{timestamp}.pdf'
            return response
            
        # Default CSV export
        csv_data = generator.generate_csv(start_date, end_date)
        response = make_response(csv_data)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename=FoodWaste_Records_{timestamp}.csv'
        return response
    finally:
        session.close()

