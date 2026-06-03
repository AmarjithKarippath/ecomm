from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://ecomm:ecomm@db:5432/ecomm"
    redis_url: str = "redis://redis:6379/0"

    jwt_secret: str = "change-me"
    jwt_alg: str = "HS256"
    jwt_expire_min: int = 60 * 24 * 7
    cors_origins: str = "http://localhost:5173"

    s3_bucket: str = ""
    s3_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    media_local_dir: str = "/app/media"
    public_media_base: str = "http://localhost:8000/media"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
