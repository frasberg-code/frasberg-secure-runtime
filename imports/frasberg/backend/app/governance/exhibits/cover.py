"""Cover Page Generator - Creates cover pages for exhibits"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone


class CoverPageGenerator:
    """Generate professional cover pages for court exhibits"""
    
    def __init__(self, case_info: Optional[Dict[str, Any]] = None):
        self.case_info = case_info or {}
    
    def generate_cover_page(
        self,
        exhibit_number: str,
        title: str,
        page_count: int,
        additional_info: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Generate a cover page for an exhibit"""
        info = additional_info or {}
        case_number = self.case_info.get("case_number", "[Case Number]")
        case_name = self.case_info.get("case_name", "[Case Name]")
        court = self.case_info.get("court", "[Court Name]")
        
        cover = f"""
{'='*80}
EXHIBIT {exhibit_number}
{'='*80}

{court}

{case_name}
Case No. {case_number}

{'='*80}

TITLE: {title}

PAGES: {page_count}

DATE: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

{'='*80}
"""
        
        if info.get("certified_by"):
            cover += f"\nCertified By: {info['certified_by']}\n"
        
        if info.get("notes"):
            cover += f"\nNotes: {info['notes']}\n"
        
        cover += "\n" + "="*80 + "\n"
        return cover
    
    def generate_bates_stamp(
        self,
        prefix: str,
        start_number: int,
        page_count: int,
    ) -> List[str]:
        """Generate Bates stamp numbers"""
        return [f"{prefix}{str(start_number + i).zfill(6)}" 
                for i in range(page_count)]
