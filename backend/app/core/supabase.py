import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("BottlePOS.Supabase")

_supabase_client = None

def get_supabase_client():
    """
    Returns the Supabase Client if configured via SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY.
    Returns None if not configured, allowing smooth fallback to in-memory mode.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.supabase_url or not (settings.supabase_service_role_key or settings.supabase_key):
        return None

    try:
        from supabase import create_client, Client
        key = settings.supabase_service_role_key or settings.supabase_key
        _supabase_client = create_client(settings.supabase_url, key)
        logger.info("Successfully connected to Supabase: %s", settings.supabase_url)
        return _supabase_client
    except Exception as e:
        logger.warning("Could not initialize Supabase client: %s. Falling back to in-memory storage.", e)
        return None
