from fastapi import APIRouter
import redis
from app.core.config import settings
from app.celery_app import celery_app

router = APIRouter( 
    prefix="/apiV3",
    tags=["System Status"]
)


@router.get("/system/diagnostics")
def system_diagnostics():

    result = {
        "backend": {
            "status": "online"
        },
        "redis": {
            "status": "unknown"
        },
        "celery": {
            "status": "unknown"
        }
    }

    # -----------------------------------------
    # REDIS
    # -----------------------------------------

    try:

        r = redis.Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=2,
            socket_timeout=2,
        )

        response = r.ping()

        if response:
            result["redis"] = {
                "status": "online",
                "message": "Redis connection successful"
            }

    except Exception as e:

        result["redis"] = {
            "status": "offline",
            "message": str(e)
        }

    # -----------------------------------------
    # CELERY
    # -----------------------------------------

    try:

        inspector = celery_app.control.inspect(
            timeout=2
        )

        workers = inspector.ping()

        if workers:

            result["celery"] = {
                "status": "online",
                "message": "Celery worker is responding",
                "workers": list(workers.keys())
            }

        else:

            result["celery"] = {
                "status": "offline",
                "message": "No Celery worker is responding"
            }

    except Exception as e:

        result["celery"] = {
            "status": "offline",
            "message": str(e)
        }

    return result