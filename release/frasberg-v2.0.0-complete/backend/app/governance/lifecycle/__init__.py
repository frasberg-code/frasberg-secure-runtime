"""Lifecycle package for version and deprecation management"""

from .versioning import VersionManager
from .deprecation import DeprecationTracker
from .notices import NoticeGenerator

__all__ = ["VersionManager", "DeprecationTracker", "NoticeGenerator"]
