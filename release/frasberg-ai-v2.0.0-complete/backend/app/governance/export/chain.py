"""
Hash Chain Verification

Cryptographic verification of audit log integrity.
Detects tampering, missing entries, and broken chains.
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import hashlib
import json


@dataclass
class ChainLink:
    """Single link in the hash chain"""
    index: int
    entry_id: str
    current_hash: str
    previous_hash: str
    is_valid: bool = True
    error: Optional[str] = None


@dataclass
class ChainAnalysis:
    """Detailed analysis of hash chain"""
    total_links: int
    valid_links: int
    broken_links: List[int] = field(default_factory=list)
    tampered_entries: List[str] = field(default_factory=list)
    hash_collisions: List[Tuple[int, int]] = field(default_factory=list)
    gap_analysis: Dict[str, Any] = field(default_factory=dict)
    integrity_score: float = 0.0


class ChainVerifier:
    """
    Verify integrity of hash-chained audit logs.
    
    Provides comprehensive verification including:
    - Chain continuity verification
    - Entry hash verification
    - Tampering detection
    - Gap analysis
    - Statistical analysis
    """
    
    GENESIS_HASH = "0" * 64
    
    def __init__(self):
        """Initialize chain verifier"""
        self.strict_mode = True  # Fail on any discrepancy
    
    def verify_chain(self, entries: List[Any]) -> Dict[str, Any]:
        """
        Verify complete hash chain.
        
        Args:
            entries: List of audit entries to verify
            
        Returns:
            Verification result dictionary
        """
        if not entries:
            return {
                "valid": True,
                "message": "Empty chain (no entries to verify)",
                "total_entries": 0,
            }
        
        # Build chain links
        links = self._build_chain_links(entries)
        
        # Verify each link
        verification_results = []
        for link in links:
            result = self._verify_link(link, entries)
            verification_results.append(result)
        
        # Analyze results
        analysis = self._analyze_results(links, verification_results)
        
        return {
            "valid": analysis.valid_links == analysis.total_links,
            "total_entries": analysis.total_links,
            "valid_entries": analysis.valid_links,
            "broken_links": analysis.broken_links,
            "tampered_entries": analysis.tampered_entries,
            "integrity_score": analysis.integrity_score,
            "analysis": analysis.__dict__,
        }
    
    def verify_entry(self, entry: Any) -> bool:
        """
        Verify single entry hash.
        
        Args:
            entry: Audit entry to verify
            
        Returns:
            True if entry hash is valid
        """
        if hasattr(entry, 'compute_hash'):
            computed = entry.compute_hash()
            return computed == entry.entry_hash
        
        # Manual verification for dict entries
        if isinstance(entry, dict):
            stored_hash = entry.get('entry_hash', '')
            entry_copy = entry.copy()
            entry_copy.pop('entry_hash', None)
            
            canonical = json.dumps(entry_copy, sort_keys=True, separators=(',', ':'))
            computed = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
            
            return computed == stored_hash
        
        return False
    
    def verify_continuity(self, entries: List[Any]) -> Dict[str, Any]:
        """
        Verify chain continuity (no gaps or breaks).
        
        Args:
            entries: List of audit entries
            
        Returns:
            Continuity verification result
        """
        if len(entries) < 2:
            return {
                "continuous": True,
                "gaps": [],
                "message": "Insufficient entries for continuity check",
            }
        
        gaps = []
        expected_previous = self.GENESIS_HASH
        
        for idx, entry in enumerate(entries):
            if hasattr(entry, 'previous_hash'):
                previous_hash = entry.previous_hash
                entry_hash = entry.entry_hash
            else:
                previous_hash = entry.get('previous_hash', '')
                entry_hash = entry.get('entry_hash', '')
            
            if previous_hash != expected_previous:
                gaps.append({
                    "index": idx,
                    "expected": expected_previous[:16] + "...",
                    "actual": previous_hash[:16] + "...",
                })
            
            expected_previous = entry_hash
        
        return {
            "continuous": len(gaps) == 0,
            "gaps": gaps,
            "total_checked": len(entries),
        }
    
    def detect_tampering(self, entries: List[Any]) -> List[Dict[str, Any]]:
        """
        Detect tampered entries by hash verification.
        
        Args:
            entries: List of audit entries
            
        Returns:
            List of tampered entry reports
        """
        tampered = []
        
        for idx, entry in enumerate(entries):
            if not self.verify_entry(entry):
                if hasattr(entry, 'entry_id'):
                    entry_id = entry.entry_id
                else:
                    entry_id = entry.get('entry_id', f'entry_{idx}')
                
                tampered.append({
                    "index": idx,
                    "entry_id": entry_id,
                    "reason": "Hash mismatch - entry has been modified",
                })
        
        return tampered
    
    def verify_timestamps(self, entries: List[Any]) -> Dict[str, Any]:
        """
        Verify timestamp consistency and ordering.
        
        Args:
            entries: List of audit entries
            
        Returns:
            Timestamp verification result
        """
        from datetime import datetime
        
        if not entries:
            return {"valid": True, "issues": []}
        
        issues = []
        previous_time = None
        
        for idx, entry in enumerate(entries):
            if hasattr(entry, 'timestamp'):
                timestamp_str = entry.timestamp
            else:
                timestamp_str = entry.get('timestamp', '')
            
            try:
                current_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                
                # Check ordering
                if previous_time and current_time < previous_time:
                    issues.append({
                        "index": idx,
                        "issue": "out_of_order",
                        "message": "Timestamp is earlier than previous entry",
                    })
                
                previous_time = current_time
            except (ValueError, AttributeError) as e:
                issues.append({
                    "index": idx,
                    "issue": "invalid_format",
                    "message": f"Invalid timestamp format: {str(e)}",
                })
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "total_checked": len(entries),
        }
    
    def generate_verification_report(self, entries: List[Any]) -> Dict[str, Any]:
        """
        Generate comprehensive verification report.
        
        Args:
            entries: List of audit entries
            
        Returns:
            Complete verification report
        """
        chain_result = self.verify_chain(entries)
        continuity_result = self.verify_continuity(entries)
        tampering = self.detect_tampering(entries)
        timestamp_result = self.verify_timestamps(entries)
        
        # Overall verdict
        all_valid = (
            chain_result["valid"] and
            continuity_result["continuous"] and
            len(tampering) == 0 and
            timestamp_result["valid"]
        )
        
        return {
            "overall_valid": all_valid,
            "chain_verification": chain_result,
            "continuity_verification": continuity_result,
            "tampering_detection": {
                "tampered_count": len(tampering),
                "tampered_entries": tampering,
            },
            "timestamp_verification": timestamp_result,
            "summary": {
                "total_entries": len(entries),
                "verified_entries": chain_result.get("valid_entries", 0),
                "integrity_score": chain_result.get("integrity_score", 0.0),
                "recommendation": "ACCEPT" if all_valid else "REJECT",
            },
        }
    
    def _build_chain_links(self, entries: List[Any]) -> List[ChainLink]:
        """Build chain link objects from entries"""
        links = []
        
        for idx, entry in enumerate(entries):
            if hasattr(entry, 'entry_id'):
                entry_id = entry.entry_id
                current_hash = entry.entry_hash
                previous_hash = entry.previous_hash
            else:
                entry_id = entry.get('entry_id', f'entry_{idx}')
                current_hash = entry.get('entry_hash', '')
                previous_hash = entry.get('previous_hash', '')
            
            link = ChainLink(
                index=idx,
                entry_id=entry_id,
                current_hash=current_hash,
                previous_hash=previous_hash,
            )
            links.append(link)
        
        return links
    
    def _verify_link(self, link: ChainLink, entries: List[Any]) -> Dict[str, Any]:
        """Verify single chain link"""
        entry = entries[link.index]
        
        # Verify entry hash
        hash_valid = self.verify_entry(entry)
        
        # Verify chain link
        if link.index == 0:
            # First entry should link to genesis hash
            link_valid = link.previous_hash == self.GENESIS_HASH
        else:
            # Should link to previous entry's hash
            prev_entry = entries[link.index - 1]
            if hasattr(prev_entry, 'entry_hash'):
                expected_previous = prev_entry.entry_hash
            else:
                expected_previous = prev_entry.get('entry_hash', '')
            
            link_valid = link.previous_hash == expected_previous
        
        return {
            "index": link.index,
            "entry_id": link.entry_id,
            "hash_valid": hash_valid,
            "link_valid": link_valid,
            "overall_valid": hash_valid and link_valid,
        }
    
    def _analyze_results(
        self,
        links: List[ChainLink],
        results: List[Dict[str, Any]]
    ) -> ChainAnalysis:
        """Analyze verification results"""
        total = len(links)
        valid = sum(1 for r in results if r["overall_valid"])
        broken = [r["index"] for r in results if not r["link_valid"]]
        tampered = [r["entry_id"] for r in results if not r["hash_valid"]]
        
        # Calculate integrity score (0.0 to 1.0)
        integrity_score = valid / total if total > 0 else 0.0
        
        return ChainAnalysis(
            total_links=total,
            valid_links=valid,
            broken_links=broken,
            tampered_entries=tampered,
            integrity_score=integrity_score,
        )
    
    def export_verification_certificate(
        self,
        entries: List[Any],
        report: Dict[str, Any],
    ) -> str:
        """
        Generate verification certificate for legal use.
        
        Args:
            entries: Verified entries
            report: Verification report
            
        Returns:
            Certificate as formatted string
        """
        from datetime import datetime
        
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        certificate = f"""
{'='*80}
HASH CHAIN VERIFICATION CERTIFICATE
{'='*80}

Verification Timestamp: {timestamp}
System: Frasberg AI Governance v1.0.0
Verification Method: SHA-256 Hash Chain Analysis

RESULTS:
--------
Total Entries Verified: {report['summary']['total_entries']}
Valid Entries: {report['summary']['verified_entries']}
Integrity Score: {report['summary']['integrity_score']:.2%}
Overall Status: {'VALID' if report['overall_valid'] else 'INVALID'}

CHAIN ANALYSIS:
--------------
Chain Continuity: {'VERIFIED' if report['continuity_verification']['continuous'] else 'BROKEN'}
Tampering Detected: {'NO' if report['tampering_detection']['tampered_count'] == 0 else 'YES'}
Timestamp Ordering: {'VALID' if report['timestamp_verification']['valid'] else 'INVALID'}

RECOMMENDATION: {report['summary']['recommendation']}

This certificate attests to the cryptographic verification of the audit log
hash chain. The verification process validates:
1. Each entry's cryptographic hash (SHA-256)
2. Chain continuity (each entry links to previous)
3. Absence of tampering or modification
4. Timestamp consistency and ordering

{'='*80}
"""
        
        return certificate
