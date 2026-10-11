from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "BottlePOS"
    environment: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "super_secret_key_change_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8 hours
    refresh_token_expire_minutes: int = 10080 # 7 days
    cors_origins: str = "http://localhost:3000,http://localhost:8000,https://bottlepos.onrender.com,https://bottle-pos.vercel.app"
    allowed_hosts: str = "localhost,127.0.0.1,*.onrender.com,bottlepos.onrender.com"
    rate_limit: str = "100/minute"
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_role_key: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "BottlePOS Security"
    smtp_tls: bool = True
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
