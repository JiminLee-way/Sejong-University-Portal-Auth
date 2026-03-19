from fastapi import FastAPI

from sejong_auth.api.routes import router


def create_app() -> FastAPI:
    app = FastAPI(title="Sejong Portal Auth API")
    app.include_router(router)
    return app


app = create_app()
