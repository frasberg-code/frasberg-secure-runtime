from pydantic import Field
from pydantic import AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Luchii Engine API"
    app_env: str = Field(default="production", pattern="^(development|staging|production)$")
    app_version: str = "1.0.0"
    api_prefix: str = "/luchii/v1"
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"
    cors_origins: list[str] = ["*"]
    default_model_name: str = "genesis-prime"
    model_source: str | None = None
    api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("FRASBERGAI_API_KEY", "API_KEY"),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="LUCHII_",
        extra="ignore",
    )


settings = Settings()
