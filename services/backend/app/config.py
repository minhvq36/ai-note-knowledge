"""
Configuration module for the backend application.

This module centralizes all environment-specific settings and secrets.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
