# routes package
from app.routes.user_routes import user_router
from app.routes.message_routes import message_router
from app.routes.ai_routes import router as ai_router

__all__ = ["user_router", "message_router", "ai_router"]
