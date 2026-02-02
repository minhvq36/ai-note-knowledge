"""
Supabase client initialization module.

Responsibilities:
- Initialize Supabase client
- Centralize database configuration
- Provide injectable database client for adapters and services

This module MUST NOT contain any business logic.
"""

from typing import Optional
from supabase import Client, create_client
from app.config import settings


"""
Internal singleton instance of Supabase client.
This is intentionally kept private to prevent accidental re-initialization
across the application lifecycle.
"""
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """
    Get a singleton instance of Supabase client.
    This function is the single entry point for obtaining a database client.
    It ensures:
    - Centralized configuration
    - Reusable connection
    - Easy mocking for tests
    Returns:
        Client: Initialized Supabase client
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    return _supabase_client


def override_supabase_client(client: Client) -> None:
    """
    Override the Supabase client instance.
    This function is intended ONLY for testing purposes,
    allowing dependency injection of a mock or fake client.
    Args:
        client (Client): A Supabase client instance to override the default one
    """
    global _supabase_client
    _supabase_client = client
