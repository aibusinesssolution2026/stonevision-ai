"""
conftest.py — pytest configuration for StoneVision test suite.
Mocks Supabase client so tests run without real credentials.
"""
import sys, os
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Set required env vars BEFORE any imports
os.environ.setdefault("GEMINI_API_KEY",      "test-key-AIza-not-real")
os.environ.setdefault("SUPABASE_URL",        "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY",   "test-anon")
os.environ.setdefault("SUPABASE_SERVICE_KEY","test-service")

# Mock supabase.create_client so main.py doesn't try to connect
mock_supa = MagicMock()
mock_supa.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {}
mock_supa.storage.from_.return_value.upload.return_value = {}

import supabase as _supabase_mod
_supabase_mod.create_client = MagicMock(return_value=mock_supa)
