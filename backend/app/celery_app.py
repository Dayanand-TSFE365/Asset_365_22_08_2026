import logging
from celery import Celery
from app.core.config import settings
from app.core.logging_config import setup_logging

# ============================================================
# SETUP LOGGING
# ============================================================

setup_logging()

logger = logging.getLogger("celery_app")

celery_app = Celery(
    "asset365",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_RESULT_URL,
)


celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=False,
)


celery_app.conf.imports = (
    "app.celery_task.test_tasks",
    "app.celery_task.ticket_email_tasks",
    "app.celery_task.task_email_tasks",

)

# ============================================================
# STARTUP LOG
# ============================================================

logger.info(
    "=================================================="
)

logger.info(
    "Celery application initialized"
)

logger.info(
    "Celery broker: %s",
    settings.REDIS_URL
)

logger.info(
    "Celery result backend: %s",
    settings.REDIS_RESULT_URL
)

logger.info(
    "Celery timezone: Asia/Kolkata"
)

logger.info(
    "Celery task modules loaded: %s",
    celery_app.conf.imports
)

logger.info(
    "=================================================="
)