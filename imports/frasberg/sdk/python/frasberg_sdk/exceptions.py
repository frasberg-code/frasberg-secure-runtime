"""Frasberg SDK Exceptions"""

class FrasbergException(Exception):
    """Base exception for Frasberg SDK"""
    pass

class APIError(FrasbergException):
    """API request failed"""
    pass

class ValidationError(FrasbergException):
    """Validation error"""
    pass
