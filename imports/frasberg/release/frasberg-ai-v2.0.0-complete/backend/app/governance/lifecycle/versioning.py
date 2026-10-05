"""Version Management"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone
import re


@dataclass
class Version:
    """Software version"""
    version_string: str
    major: int
    minor: int
    patch: int
    released_at: str
    status: str
    changelog: List[str]
    breaking_changes: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "version_string": self.version_string,
            "major": self.major,
            "minor": self.minor,
            "patch": self.patch,
            "released_at": self.released_at,
            "status": self.status,
            "changelog": self.changelog,
            "breaking_changes": self.breaking_changes,
        }


class VersionManager:
    """Manage software versions"""
    
    def __init__(self, current_version: str = "1.0.0"):
        self._versions: Dict[str, Version] = {}
        self._current_version = current_version
    
    def register_version(
        self,
        version_string: str,
        changelog: Optional[List[str]] = None,
        breaking_changes: Optional[List[str]] = None,
    ) -> Version:
        """Register a new version"""
        major, minor, patch = self._parse_version(version_string)
        
        version = Version(
            version_string=version_string,
            major=major,
            minor=minor,
            patch=patch,
            released_at=datetime.now(timezone.utc).isoformat(),
            status="active",
            changelog=changelog or [],
            breaking_changes=breaking_changes or [],
        )
        
        self._versions[version_string] = version
        return version
    
    def get_version(self, version_string: str) -> Optional[Version]:
        """Get version info"""
        return self._versions.get(version_string)
    
    def get_current_version(self) -> str:
        """Get current version string"""
        return self._current_version
    
    def compare_versions(self, v1: str, v2: str) -> int:
        """Compare two versions. Returns -1, 0, or 1"""
        v1_parts = self._parse_version(v1)
        v2_parts = self._parse_version(v2)
        
        if v1_parts < v2_parts:
            return -1
        elif v1_parts > v2_parts:
            return 1
        return 0
    
    def list_versions(self) -> List[Version]:
        """List all versions"""
        return sorted(
            self._versions.values(),
            key=lambda v: (v.major, v.minor, v.patch),
            reverse=True
        )
    
    def _parse_version(self, version_string: str) -> tuple:
        """Parse version string into (major, minor, patch)"""
        match = re.match(r'(\d+)\.(\d+)\.(\d+)', version_string)
        if match:
            return (int(match.group(1)), int(match.group(2)), int(match.group(3)))
        return (0, 0, 0)
