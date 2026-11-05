"""
Report generation service for FoodWaste Analytics.
Generates CSV and professional PDF reports using ReportLab with sustainability branding.
"""

import os
import io
import pandas as pd
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.models.food_record import FoodWasteRecord
from app.utils.helpers import get_date_range, safe_divide


class ReportGenerator:
    def __init__(self, session):
        self.session = session

    def generate_csv(self, start_date=None, end_date=None, report_type='records'):
        """Export records as CSV string or StringIO."""
        query = self.session.query(FoodWasteRecord)
        if start_date:
            query = query.filter(FoodWasteRecord.date >= start_date)
        if end_date:
            query = query.filter(FoodWasteRecord.date <= end_date)
            
        records = query.all()
        if not records:
            return "No records found for the specified period.\n"
            
        data = [r.to_dict() for r in records]
        df = pd.DataFrame(data)
        
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue()

    def generate_pdf(self, start_date=None, end_date=None):
        """Generate a complete professional PDF summary report."""
        query = self.session.query(FoodWasteRecord)
        if start_date:
            query = query.filter(FoodWasteRecord.date >= start_date)
        if end_date:
            query = query.filter(FoodWasteRecord.date <= end_date)
            
        records = query.all()
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Color palette
        brand_green = colors.HexColor('#16a34a')
        brand_dark = colors.HexColor('#14532d')
        soft_green = colors.HexColor('#dcfce7')
        gray_bg = colors.HexColor('#f8fafc')
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=brand_dark,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=brand_dark,
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1e293b')
        )
        
        # 1. Header
        elements.append(Paragraph("FoodWaste Analytics", title_style))
        period_str = f"{start_date.isoformat()} to {end_date.isoformat()}" if start_date and end_date else "All Available Time"
        elements.append(Paragraph(
            f"<b>Big Data-Based Food Waste Audit Report</b> &nbsp;|&nbsp; Generated on: {datetime.now().strftime('%d %B %Y, %I:%M %p')} &nbsp;|&nbsp; Period: {period_str}",
            subtitle_style
        ))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=brand_green, spaceAfter=14))
        
        if not records:
            elements.append(Paragraph("No records found in database for the selected period.", body_style))
            doc.build(elements)
            buffer.seek(0)
            return buffer.getvalue()
            
        # Aggregation
        data = [{
            'food_item': r.food_item,
            'category': r.food_category,
            'meal_type': r.meal_type,
            'prepared': r.quantity_prepared,
            'consumed': r.quantity_consumed,
            'wasted': r.quantity_wasted,
            'cost': r.cost_per_kg or 0,
            'financial_loss': r.quantity_wasted * (r.cost_per_kg or 0)
        } for r in records]
        df = pd.DataFrame(data)
        
        total_prepared = df['prepared'].sum()
        total_consumed = df['consumed'].sum()
        total_wasted = df['wasted'].sum()
        waste_pct = (total_wasted / total_prepared * 100) if total_prepared > 0 else 0
        total_loss = df['financial_loss'].sum()
        
        # 2. Executive KPI Summary Table
        elements.append(Paragraph("1. Executive Summary & Core Metrics", h2_style))
        kpi_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Total Prepared", f"{total_prepared:,.1f} kg", "Total Consumed", f"{total_consumed:,.1f} kg"],
            ["Total Wasted", f"{total_wasted:,.1f} kg", "Waste Percentage", f"{waste_pct:.1f}%"],
            ["Est. Financial Loss", f"₹{total_loss:,.0f}", "Total Records Analyzed", f"{len(records):,}"]
        ]
        kpi_table = Table(kpi_data, colWidths=[2.1*inch, 1.6*inch, 2.1*inch, 1.6*inch])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), brand_green),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, gray_bg]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 10))
        
        # 3. Category Breakdown Table
        elements.append(Paragraph("2. Category-Wise Wastage Breakdown", h2_style))
        cat_df = df.groupby('category').agg({
            'prepared': 'sum',
            'consumed': 'sum',
            'wasted': 'sum',
            'financial_loss': 'sum'
        }).reset_index()
        cat_df['waste_pct'] = (cat_df['wasted'] / cat_df['prepared'] * 100).round(1)
        cat_df = cat_df.sort_values(by='wasted', ascending=False)
        
        cat_rows = [["Food Category", "Prepared (kg)", "Consumed (kg)", "Wasted (kg)", "Waste %", "Loss (₹)"]]
        for _, row in cat_df.iterrows():
            cat_rows.append([
                row['category'],
                f"{row['prepared']:,.1f}",
                f"{row['consumed']:,.1f}",
                f"{row['wasted']:,.1f}",
                f"{row['waste_pct']:.1f}%",
                f"₹{row['financial_loss']:,.0f}"
            ])
            
        cat_table = Table(cat_rows, colWidths=[1.8*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.0*inch, 1.3*inch])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#15803d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, gray_bg]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(cat_table)
        elements.append(Spacer(1, 10))
        
        # 4. Top Wasted Items
        elements.append(Paragraph("3. Top 5 Most Wasted Items", h2_style))
        item_df = df.groupby(['food_item', 'category']).agg({
            'prepared': 'sum',
            'wasted': 'sum',
            'financial_loss': 'sum'
        }).reset_index()
        item_df['waste_pct'] = (item_df['wasted'] / item_df['prepared'] * 100).round(1)
        top_items = item_df.sort_values('wasted', ascending=False).head(5)
        
        item_rows = [["Food Item", "Category", "Prepared (kg)", "Wasted (kg)", "Waste %", "Loss (₹)"]]
        for _, row in top_items.iterrows():
            item_rows.append([
                row['food_item'],
                row['category'],
                f"{row['prepared']:,.1f}",
                f"{row['wasted']:,.1f}",
                f"{row['waste_pct']:.1f}%",
                f"₹{row['financial_loss']:,.0f}"
            ])
        item_table = Table(item_rows, colWidths=[1.8*inch, 1.4*inch, 1.0*inch, 1.0*inch, 1.0*inch, 1.2*inch])
        item_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#047857')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, gray_bg]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(item_table)
        elements.append(Spacer(1, 10))
        
        # 5. SDG & Recommendations
        elements.append(Paragraph("4. Sustainable Development Goals (SDG) Alignment & Recommendations", h2_style))
        sdg_text = (
            "<b>SDG 12 (Responsible Consumption & Production) & SDG 2 (Zero Hunger):</b> "
            "Analysis demonstrates opportunities to optimize canteen food preparation. "
            "Reducing food prep quantities for high-waste items by 10-15% with a 10% safety buffer "
            "will directly lower carbon footprint, conserve potable water, and save operational budget."
        )
        elements.append(Paragraph(sdg_text, body_style))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

