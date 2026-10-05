from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import traceback
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("frasberg-ai")

class FrasbergException(Exception):
    """Base exception for Frasberg AI"""
    def __init__(self, message: str, status_code: int = 500, details: dict = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ServiceUnavailableError(FrasbergException):
    """Service temporarily unavailable"""
    def __init__(self, service: str, details: dict = None):
        super().__init__(
            f"Service '{service}' is temporarily unavailable",
            status_code=503,
            details=details
        )

class ResourceNotFoundError(FrasbergException):
    """Resource not found"""
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            f"Resource '{resource}' with ID '{resource_id}' not found",
            status_code=404,
            details={"resource": resource, "id": resource_id}
        )

class ValidationError(FrasbergException):
    """Validation error"""
    def __init__(self, message: str, field: str = None):
        details = {"field": field} if field else {}
        super().__init__(message, status_code=400, details=details)

class RateLimitError(FrasbergException):
    """Rate limit exceeded"""
    def __init__(self, limit: int, window: str):
        super().__init__(
            f"Rate limit of {limit} requests per {window} exceeded",
            status_code=429,
            details={"limit": limit, "window": window}
        )

async def frasberg_exception_handler(request: Request, exc: FrasbergException):
    """Handle Frasberg AI exceptions"""
    logger.error(f"FrasbergException: {exc.message}", extra={
        "status_code": exc.status_code,
        "details": exc.details,
        "path": request.url.path
    })
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "status_code": exc.status_code,
            "details": exc.details,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "path": request.url.path
        }
    )

async def generic_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", extra={
        "traceback": traceback.format_exc(),
        "path": request.url.path
    })
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "path": request.url.path,
            "request_id": f"req_{int(time.time() * 1000)}"
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.errors()}", extra={
        "path": request.url.path
    })
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "details": exc.errors(),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "path": request.url.path
        }
    )
