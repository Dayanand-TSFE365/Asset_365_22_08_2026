from pathlib import Path

from app.core.config import settings


LOG_DIR = Path(settings.LOG_DIR)


LOG_FILES = {
    "app": "app.log",
    "db": "db.log",
    "websocket": "websocket.log",
    "celery": "celery.log",
}


def get_last_lines(
    file_path: Path,
    lines: int = 10,
):
    """
    Read the last N lines from a log file.
    """

    if not file_path.exists():
        return []

    try:
        with file_path.open(
            "r",
            encoding="utf-8",
            errors="replace",
        ) as file:

            all_lines = file.readlines()

        return [
            line.rstrip("\n")
            for line in all_lines[-lines:]
        ]

    except Exception as e:
        raise RuntimeError(
            f"Unable to read log file: {str(e)}"
        )


def get_system_logs(lines: int = 10):

    result = {}

    for service, filename in LOG_FILES.items():

        file_path = LOG_DIR / filename

        try:

            result[service] = {
                "status": "available",
                "file": filename,
                "lines": get_last_lines(
                    file_path,
                    lines,
                ),
            }

        except Exception as e:

            result[service] = {
                "status": "error",
                "file": filename,
                "lines": [],
                "message": str(e),
            }

    return result