from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import Base, engine
from . import models  # noqa: F401  ensure models register with Base
from .modules import auth, checkout, orders, products, seo, storefront


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(title="ecomm API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(products.router)
    app.include_router(storefront.router)
    app.include_router(checkout.router)
    app.include_router(orders.router)
    app.include_router(seo.router)

    if not settings.s3_bucket:
        media_dir = Path(settings.media_local_dir)
        media_dir.mkdir(parents=True, exist_ok=True)
        app.mount("/media", StaticFiles(directory=media_dir), name="media")

    @app.get("/health")
    def health():
        return {"ok": True}

    return app


app = create_app()
