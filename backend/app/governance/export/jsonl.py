"""
JSONL Audit Export

Exports audit logs in JSON Lines format for programmatic processing,
data analysis, and integration with log analysis tools.
"""

import json
from typing import List, Dict, Any, Optional, TextIO
from datetime import datetime
import gzip


class JSONLExporter:
    """
    Export audit logs to JSON Lines (JSONL) format.
    
    JSON Lines format has one JSON object per line, making it ideal for:
    - Streaming processing
    - Large datasets
    - Log aggregation systems
    - Data pipelines
    """
    
    def __init__(self, compress: bool = False):
        """
        Initialize JSONL exporter.
        
        Args:
            compress: Whether to gzip compress output
        """
        self.compress = compress
    
    def export_entries(
        self,
        entries: List[Any],
        include_metadata: bool = True,
    ) -> bytes:
        """
        Export audit entries to JSONL format.
        
        Args:
            entries: List of audit entries
            include_metadata: Include metadata header
            
        Returns:
            JSONL data as bytes
        """
        lines = []
        
        # Add metadata header if requested
        if include_metadata:
            metadata = self._generate_metadata(entries)
            lines.append(json.dumps(metadata, separators=(',', ':')))
        
        # Add each entry as a JSON line
        for entry in entries:
            if hasattr(entry, 'to_dict'):
                entry_dict = entry.to_dict()
            else:
                entry_dict = entry
            
            lines.append(json.dumps(entry_dict, separators=(',', ':')))
        
        # Join with newlines
        jsonl_content = '\n'.join(lines) + '\n'
        
        # Compress if requested
        if self.compress:
            return gzip.compress(jsonl_content.encode('utf-8'))
        else:
            return jsonl_content.encode('utf-8')
    
    def export_to_file(
        self,
        entries: List[Any],
        filepath: str,
        include_metadata: bool = True,
    ) -> int:
        """
        Export audit entries to JSONL file.
        
        Args:
            entries: List of audit entries
            filepath: Path to output file
            include_metadata: Include metadata header
            
        Returns:
            Number of lines written
        """
        lines_written = 0
        
        open_func = gzip.open if self.compress else open
        mode = 'wt' if not self.compress else 'wt'
        
        with open_func(filepath, mode, encoding='utf-8') as f:
            # Write metadata
            if include_metadata:
                metadata = self._generate_metadata(entries)
                f.write(json.dumps(metadata, separators=(',', ':')) + '\n')
                lines_written += 1
            
            # Write entries
            for entry in entries:
                if hasattr(entry, 'to_dict'):
                    entry_dict = entry.to_dict()
                else:
                    entry_dict = entry
                
                f.write(json.dumps(entry_dict, separators=(',', ':')) + '\n')
                lines_written += 1
        
        return lines_written
    
    def stream_export(
        self,
        entries: List[Any],
        output_stream: TextIO,
        include_metadata: bool = True,
        batch_size: int = 100,
    ) -> int:
        """
        Stream export for large datasets.
        
        Args:
            entries: List of audit entries
            output_stream: Output stream to write to
            include_metadata: Include metadata header
            batch_size: Number of entries to batch before flushing
            
        Returns:
            Number of entries exported
        """
        count = 0
        
        # Write metadata
        if include_metadata:
            metadata = self._generate_metadata(entries)
            output_stream.write(json.dumps(metadata, separators=(',', ':')) + '\n')
        
        # Stream entries in batches
        for idx, entry in enumerate(entries):
            if hasattr(entry, 'to_dict'):
                entry_dict = entry.to_dict()
            else:
                entry_dict = entry
            
            output_stream.write(json.dumps(entry_dict, separators=(',', ':')) + '\n')
            count += 1
            
            # Flush periodically
            if (idx + 1) % batch_size == 0:
                output_stream.flush()
        
        # Final flush
        output_stream.flush()
        
        return count
    
    def export_filtered(
        self,
        entries: List[Any],
        filter_func: callable,
        include_metadata: bool = True,
    ) -> bytes:
        """
        Export filtered audit entries.
        
        Args:
            entries: List of audit entries
            filter_func: Function to filter entries (returns bool)
            include_metadata: Include metadata header
            
        Returns:
            JSONL data as bytes
        """
        filtered_entries = [e for e in entries if filter_func(e)]
        return self.export_entries(filtered_entries, include_metadata)
    
    def export_by_date_range(
        self,
        entries: List[Any],
        start_date: datetime,
        end_date: datetime,
        include_metadata: bool = True,
    ) -> bytes:
        """
        Export entries within date range.
        
        Args:
            entries: List of audit entries
            start_date: Start of date range
            end_date: End of date range
            include_metadata: Include metadata header
            
        Returns:
            JSONL data as bytes
        """
        def in_range(entry):
            if hasattr(entry, 'timestamp'):
                entry_time = datetime.fromisoformat(entry.timestamp.replace('Z', '+00:00'))
            else:
                entry_time = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
            return start_date <= entry_time <= end_date
        
        return self.export_filtered(entries, in_range, include_metadata)
    
    def _generate_metadata(self, entries: List[Any]) -> Dict[str, Any]:
        """
        Generate metadata header for export.
        
        Args:
            entries: List of audit entries
            
        Returns:
            Metadata dictionary
        """
        return {
            "_metadata": True,
            "export_format": "jsonl",
            "export_version": "1.0",
            "export_timestamp": datetime.utcnow().isoformat() + "Z",
            "total_entries": len(entries),
            "compressed": self.compress,
            "source_system": "frasberg-ai-governance",
            "chain_validation": "enabled",
        }
    
    @staticmethod
    def read_jsonl(filepath: str, skip_metadata: bool = True) -> List[Dict[str, Any]]:
        """
        Read JSONL file back into entries.
        
        Args:
            filepath: Path to JSONL file
            skip_metadata: Skip metadata line if present
            
        Returns:
            List of entry dictionaries
        """
        entries = []
        
        # Detect if file is compressed
        is_compressed = filepath.endswith('.gz')
        open_func = gzip.open if is_compressed else open
        mode = 'rt' if is_compressed else 'r'
        
        with open_func(filepath, mode, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                entry = json.loads(line)
                
                # Skip metadata line if requested
                if skip_metadata and entry.get('_metadata'):
                    continue
                
                entries.append(entry)
        
        return entries
    
    @staticmethod
    def validate_jsonl(filepath: str) -> Dict[str, Any]:
        """
        Validate JSONL file format.
        
        Args:
            filepath: Path to JSONL file
            
        Returns:
            Validation result dictionary
        """
        is_valid = True
        line_count = 0
        error_lines = []
        
        is_compressed = filepath.endswith('.gz')
        open_func = gzip.open if is_compressed else open
        mode = 'rt' if is_compressed else 'r'
        
        try:
            with open_func(filepath, mode, encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        json.loads(line)
                        line_count += 1
                    except json.JSONDecodeError as e:
                        is_valid = False
                        error_lines.append({
                            "line": line_num,
                            "error": str(e),
                        })
        except Exception as e:
            return {
                "valid": False,
                "error": f"Failed to read file: {str(e)}",
            }
        
        return {
            "valid": is_valid,
            "line_count": line_count,
            "errors": error_lines,
        }
    
    def export_with_hash_chain(
        self,
        entries: List[Any],
        include_verification: bool = True,
    ) -> bytes:
        """
        Export with hash chain verification data.
        
        Args:
            entries: List of audit entries
            include_verification: Include chain verification in metadata
            
        Returns:
            JSONL data with chain verification
        """
        lines = []
        
        # Add metadata with chain info
        metadata = self._generate_metadata(entries)
        
        if include_verification and entries:
            # Add chain verification data
            first_entry = entries[0]
            last_entry = entries[-1]
            
            if hasattr(first_entry, 'entry_hash'):
                metadata["chain_start_hash"] = first_entry.previous_hash
                metadata["chain_end_hash"] = last_entry.entry_hash
                metadata["chain_length"] = len(entries)
        
        lines.append(json.dumps(metadata, separators=(',', ':')))
        
        # Add entries
        for entry in entries:
            if hasattr(entry, 'to_dict'):
                entry_dict = entry.to_dict()
            else:
                entry_dict = entry
            
            lines.append(json.dumps(entry_dict, separators=(',', ':')))
        
        jsonl_content = '\n'.join(lines) + '\n'
        
        if self.compress:
            return gzip.compress(jsonl_content.encode('utf-8'))
        else:
            return jsonl_content.encode('utf-8')
