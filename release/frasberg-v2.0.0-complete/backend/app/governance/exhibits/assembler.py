"""
Court Exhibits Assembler

Assembles audit logs and related materials into court-ready exhibits
with proper formatting, numbering, and documentation.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class Exhibit:
    """Court exhibit"""
    exhibit_id: str
    exhibit_number: str
    title: str
    description: str
    content_type: str
    content: Any
    page_count: int
    attachments: List[str]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "exhibit_id": self.exhibit_id,
            "exhibit_number": self.exhibit_number,
            "title": self.title,
            "description": self.description,
            "content_type": self.content_type,
            "page_count": self.page_count,
            "attachments": self.attachments,
            "metadata": self.metadata,
        }


class ExhibitAssembler:
    """
    Assemble court exhibits from audit data.
    
    Creates properly formatted exhibits suitable for court filing,
    including cover pages, indexes, and supporting documentation.
    """
    
    def __init__(self, case_info: Optional[Dict[str, Any]] = None):
        """
        Initialize exhibit assembler.
        
        Args:
            case_info: Case information for exhibit headers
        """
        self.case_info = case_info or {}
        self._exhibits: Dict[str, Exhibit] = {}
    
    def create_exhibit(
        self,
        exhibit_number: str,
        title: str,
        description: str,
        content: Any,
        content_type: str = "audit_log",
        attachments: Optional[List[str]] = None,
    ) -> Exhibit:
        """
        Create a new exhibit.
        
        Args:
            exhibit_number: Exhibit number (e.g., "A", "B-1")
            title: Exhibit title
            description: Description of exhibit
            content: Exhibit content
            content_type: Type of content
            attachments: List of attachment IDs
            
        Returns:
            Created exhibit
        """
        import uuid
        
        exhibit = Exhibit(
            exhibit_id=str(uuid.uuid4()),
            exhibit_number=exhibit_number,
            title=title,
            description=description,
            content_type=content_type,
            content=content,
            page_count=self._estimate_pages(content),
            attachments=attachments or [],
            metadata={
                "created_at": datetime.now(timezone.utc).isoformat(),
                "case_info": self.case_info,
            },
        )
        
        self._exhibits[exhibit.exhibit_id] = exhibit
        return exhibit
    
    def create_audit_log_exhibit(
        self,
        exhibit_number: str,
        audit_entries: List[Any],
        title: Optional[str] = None,
    ) -> Exhibit:
        """
        Create exhibit from audit log entries.
        
        Args:
            exhibit_number: Exhibit number
            audit_entries: List of audit entries
            title: Custom title (uses default if None)
            
        Returns:
            Created exhibit
        """
        if title is None:
            title = f"Exhibit {exhibit_number} - Audit Log Records"
        
        description = (
            f"Authenticated audit log records from Frasberg Governance System. "
            f"Contains {len(audit_entries)} entries with cryptographic hash chain verification."
        )
        
        return self.create_exhibit(
            exhibit_number=exhibit_number,
            title=title,
            description=description,
            content=audit_entries,
            content_type="audit_log",
        )
    
    def assemble_exhibit_package(
        self,
        exhibit_ids: List[str],
        include_index: bool = True,
        include_cover: bool = True,
    ) -> Dict[str, Any]:
        """
        Assemble complete exhibit package.
        
        Args:
            exhibit_ids: List of exhibit IDs to include
            include_index: Include exhibit index
            include_cover: Include cover page
            
        Returns:
            Assembled exhibit package
        """
        exhibits = [self._exhibits[eid] for eid in exhibit_ids if eid in self._exhibits]
        
        package = {
            "case_info": self.case_info,
            "exhibits": [e.to_dict() for e in exhibits],
            "total_exhibits": len(exhibits),
            "total_pages": sum(e.page_count for e in exhibits),
            "assembled_at": datetime.now(timezone.utc).isoformat(),
        }
        
        if include_index:
            package["index"] = self._generate_index(exhibits)
        
        if include_cover:
            package["cover_page"] = self._generate_cover_page(exhibits)
        
        return package
    
    def generate_exhibit_list(self) -> List[Dict[str, Any]]:
        """
        Generate list of all exhibits.
        
        Returns:
            List of exhibit summaries
        """
        return [
            {
                "exhibit_number": e.exhibit_number,
                "title": e.title,
                "page_count": e.page_count,
                "content_type": e.content_type,
            }
            for e in sorted(
                self._exhibits.values(),
                key=lambda x: x.exhibit_number
            )
        ]
    
    def _estimate_pages(self, content: Any) -> int:
        """Estimate page count for content"""
        if isinstance(content, list):
            # Assume ~3 entries per page for audit logs
            return max(1, len(content) // 3)
        return 1
    
    def _generate_index(self, exhibits: List[Exhibit]) -> str:
        """Generate exhibit index"""
        index = "EXHIBIT INDEX\n"
        index += "="*80 + "\n\n"
        
        for exhibit in sorted(exhibits, key=lambda x: x.exhibit_number):
            index += f"Exhibit {exhibit.exhibit_number}: {exhibit.title}\n"
            index += f"  Pages: {exhibit.page_count}\n"
            index += f"  Description: {exhibit.description}\n\n"
        
        return index
    
    def _generate_cover_page(self, exhibits: List[Exhibit]) -> str:
        """Generate cover page"""
        case_number = self.case_info.get("case_number", "[Case Number]")
        case_name = self.case_info.get("case_name", "[Case Name]")
        
        cover = f"""
{'='*80}
EXHIBITS
{'='*80}

{case_name}
Case No. {case_number}

Total Exhibits: {len(exhibits)}
Total Pages: {sum(e.page_count for e in exhibits)}

Submitted: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

{'='*80}
"""
        return cover
