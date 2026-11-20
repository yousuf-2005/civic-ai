from pathlib import Path
from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Civic AI — AI-Powered Grievance Redressal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Security & JWT
    SECRET_KEY: str = Field(
        default="civic_ai_super_secret_development_key_minimum_32_characters_2026",
        description="Cryptographic secret key for signing JWT tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = "sqlite:///./civic_ai.db"

    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 10
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,webp"

    # AI Configuration
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-3.8-flash"
    AI_MOCK_MODE: bool = True

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    PORT: int = 8000

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower().lstrip(".") for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            # Relative to backend root
            path = Path(__file__).resolve().parent.parent.parent / self.UPLOAD_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_ORIGIN.rstrip("/")]
        # Also allow localhost:5173, 127.0.0.1:5173, localhost:4173 in development
        if self.ENVIRONMENT == "development":
            extra = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://localhost:3000"]
            for o in extra:
                if o not in origins:
                    origins.append(o)
        return origins


settings = Settings()
