"""
Database module for Sofia AI Platform
"""
from db.database import db, Database
from db.supabase_client import get_supabase_client, get_supabase_admin_client, Tables

__all__ = ['db', 'Database', 'get_supabase_client', 'get_supabase_admin_client', 'Tables']
