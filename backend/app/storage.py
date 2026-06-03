import os
import uuid
from pathlib import Path

import boto3

from .config import settings


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower() or ".bin"


def save_image(*, store_id: int, filename: str, data: bytes, content_type: str) -> str:
    """Save an uploaded image and return a publicly-resolvable URL."""
    key = f"stores/{store_id}/products/{uuid.uuid4().hex}{_ext(filename)}"

    if settings.s3_bucket:
        s3 = boto3.client(
            "s3",
            region_name=settings.s3_region,
            aws_access_key_id=settings.aws_access_key_id or None,
            aws_secret_access_key=settings.aws_secret_access_key or None,
        )
        s3.put_object(
            Bucket=settings.s3_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            ACL="public-read",
        )
        return f"https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"

    target = Path(settings.media_local_dir) / key
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return f"{settings.public_media_base.rstrip('/')}/{key}"
