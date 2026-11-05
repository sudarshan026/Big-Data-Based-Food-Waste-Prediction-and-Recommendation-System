"""
Utility / helper functions used across the application.
"""

from datetime import datetime, date, timedelta


def parse_date(date_str):
    """Parse an ISO-format date string (YYYY-MM-DD) to a date object.
    Returns None if parsing fails.
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(str(date_str).strip(), '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def get_date_range(period=None, start_date=None, end_date=None):
    """Return a (start, end) date tuple based on the requested period or
    explicit start/end params.

    Supported periods: '7days', '30days', '90days', 'all' (or None).
    """
    today = date.today()

    if start_date and end_date:
        s = parse_date(start_date)
        e = parse_date(end_date)
        if s and e:
            return (s, e)

    if period == '7days':
        return (today - timedelta(days=7), today)
    elif period == '30days':
        return (today - timedelta(days=30), today)
    elif period == '90days':
        return (today - timedelta(days=90), today)
    else:
        # 'all' or unrecognised → no date filter
        return (None, None)


def safe_divide(numerator, denominator, default=0):
    """Division that returns *default* when the denominator is zero or None."""
    try:
        if denominator is None or denominator == 0:
            return default
        return numerator / denominator
    except (TypeError, ZeroDivisionError):
        return default


def format_currency(amount):
    """Format a numeric amount as Indian Rupees: ₹1,23,456.78"""
    if amount is None:
        return '₹0'
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return '₹0'
    if amount < 0:
        sign = '-'
        amount = abs(amount)
    else:
        sign = ''
    # Standard comma formatting (international style for simplicity)
    formatted = f'{amount:,.2f}'
    return f'{sign}\u20b9{formatted}'
