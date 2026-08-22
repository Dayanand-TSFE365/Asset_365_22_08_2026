# ============================================================
# File: app/core/logging_config.py
# ============================================================
import os
import logging
from app.core.config import settings
from logging.handlers import RotatingFileHandler

# ============================================================
# LOG DIRECTORY
# ============================================================

LOG_DIR = settings.LOG_DIR

os.makedirs(LOG_DIR, exist_ok=True)


# ============================================================
# FORMAT
# ============================================================

LOG_FORMAT = (
    "%(asctime)s | "
    "%(levelname)s | "
    "%(name)s | "
    "%(message)s"
)

formatter = logging.Formatter(LOG_FORMAT)


# ============================================================
# HELPER
# ============================================================

def create_file_handler(filename: str):

    handler = RotatingFileHandler(
        os.path.join(LOG_DIR, filename),
        maxBytes=10 * 1024 * 1024,   # 10 MB
        backupCount=5,
        encoding="utf-8",
    )

    handler.setLevel(logging.INFO)
    handler.setFormatter(formatter)

    return handler


# ============================================================
# SETUP LOGGING
# ============================================================

def setup_logging():

    # --------------------------------------------------------
    # FASTAPI / APPLICATION LOG
    # --------------------------------------------------------

    app_handler = create_file_handler(
        "app.log"
    )

    app_logger = logging.getLogger("app")

    app_logger.setLevel(logging.INFO)

    if not app_logger.handlers:
        app_logger.addHandler(app_handler)

    app_logger.propagate = False


    # --------------------------------------------------------
    # WEBSOCKET LOG
    # --------------------------------------------------------

    websocket_handler = create_file_handler(
        "websocket.log"
    )

    websocket_logger = logging.getLogger(
        "websocket"
    )

    websocket_logger.setLevel(logging.INFO)

    if not websocket_logger.handlers:
        websocket_logger.addHandler(
            websocket_handler
        )

    websocket_logger.propagate = False


    # --------------------------------------------------------
    # CELERY LOG
    # --------------------------------------------------------

    celery_handler = create_file_handler(
        "celery.log"
    )


    # --------------------------------------------------------
    # CELERY MAIN LOGGER
    # --------------------------------------------------------

    celery_logger = logging.getLogger(
        "celery"
    )

    celery_logger.setLevel(logging.INFO)

    if not celery_logger.handlers:
        celery_logger.addHandler(
            celery_handler
        )

    celery_logger.propagate = False


    # --------------------------------------------------------
    # CELERY WORKER LOGGER
    # --------------------------------------------------------

    celery_worker_logger = logging.getLogger(
        "celery.worker"
    )

    celery_worker_logger.setLevel(
        logging.INFO
    )

    if not celery_worker_logger.handlers:
        celery_worker_logger.addHandler(
            celery_handler
        )

    celery_worker_logger.propagate = False


    # --------------------------------------------------------
    # CELERY TRACE LOGGER
    # --------------------------------------------------------

    celery_trace_logger = logging.getLogger(
        "celery.app.trace"
    )

    celery_trace_logger.setLevel(
        logging.INFO
    )

    if not celery_trace_logger.handlers:
        celery_trace_logger.addHandler(
            celery_handler
        )

    celery_trace_logger.propagate = False


    # --------------------------------------------------------
    # YOUR CELERY APPLICATION LOGGER
    # --------------------------------------------------------

    celery_app_logger = logging.getLogger(
        "celery_app"
    )

    celery_app_logger.setLevel(
        logging.INFO
    )

    if not celery_app_logger.handlers:
        celery_app_logger.addHandler(
            celery_handler
        )

    celery_app_logger.propagate = False

    # ============================================================
    # DATABASE LOG
    # ============================================================

    db_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "db.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )

    db_handler.setLevel(logging.INFO)
    db_handler.setFormatter(formatter)

    db_logger = logging.getLogger("database")
    db_logger.setLevel(logging.INFO)

    if not db_logger.handlers:
        db_logger.addHandler(db_handler)


    # --------------------------------------------------------
    # RETURN LOGGERS
    # --------------------------------------------------------

    return {
        "app": app_logger,
        "websocket": websocket_logger,
        "celery": celery_logger,
        "celery_app": celery_app_logger,
    }