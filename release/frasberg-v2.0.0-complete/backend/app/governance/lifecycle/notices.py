"""Deprecation Notice Generation"""

from typing import Dict, Any


class NoticeGenerator:
    """Generate deprecation notices"""
    
    def __init__(self, deprecation_tracker):
        self.deprecation_tracker = deprecation_tracker
    
    def generate_notice(self, feature_name: str) -> str:
        """Generate deprecation notice"""
        notice = self.deprecation_tracker.get_deprecation_notice(feature_name)
        
        if not notice:
            return f"No deprecation notice found for {feature_name}"
        
        text = f"""
{'='*80}
DEPRECATION NOTICE
{'='*80}

Feature: {notice.feature_name}
Deprecated In: {notice.deprecated_in}
Will Be Removed In: {notice.removal_in}
Announced: {notice.announced_at}

REASON:
-------
{notice.reason}

MIGRATION GUIDE:
---------------
{notice.migration_guide}
"""
        
        if notice.alternative:
            text += f"""
ALTERNATIVE:
-----------
{notice.alternative}
"""
        
        text += "\n" + "="*80 + "\n"
        return text
    
    def generate_summary(self) -> str:
        """Generate summary of all deprecations"""
        deprecations = self.deprecation_tracker.list_deprecations()
        
        if not deprecations:
            return "No deprecated features."
        
        summary = f"""
{'='*80}
DEPRECATION SUMMARY
{'='*80}

Total Deprecated Features: {len(deprecations)}

"""
        
        for notice in deprecations:
            summary += f"""
• {notice.feature_name}
  Deprecated: {notice.deprecated_in} | Removal: {notice.removal_in}
  
"""
        
        return summary
