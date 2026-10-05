"""Exhibit Indexer - Creates searchable indexes for exhibits"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class IndexEntry:
    """Index entry for exhibit content"""
    entry_id: str
    exhibit_id: str
    page_number: int
    content_preview: str
    keywords: List[str]
    timestamp: Optional[str] = None


class ExhibitIndexer:
    """Create and manage exhibit indexes"""
    
    def __init__(self):
        self._indexes: Dict[str, List[IndexEntry]] = {}
    
    def index_exhibit(self, exhibit_id: str, content: List[Any]) -> int:
        """Index an exhibit's content"""
        entries = []
        for idx, item in enumerate(content):
            entry = IndexEntry(
                entry_id=f"{exhibit_id}_{idx}",
                exhibit_id=exhibit_id,
                page_number=idx + 1,
                content_preview=str(item)[:200],
                keywords=self._extract_keywords(item),
                timestamp=getattr(item, 'timestamp', None)
            )
            entries.append(entry)
        
        self._indexes[exhibit_id] = entries
        return len(entries)
    
    def search(self, exhibit_id: str, query: str) -> List[IndexEntry]:
        """Search within indexed exhibit"""
        if exhibit_id not in self._indexes:
            return []
        
        query_lower = query.lower()
        return [
            entry for entry in self._indexes[exhibit_id]
            if query_lower in entry.content_preview.lower() or
               any(query_lower in kw.lower() for kw in entry.keywords)
        ]
    
    def _extract_keywords(self, item: Any) -> List[str]:
        """Extract keywords from content"""
        if hasattr(item, 'action'):
            return [item.action]
        return []
