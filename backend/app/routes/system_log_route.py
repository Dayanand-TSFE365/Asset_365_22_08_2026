from fastapi import APIRouter, Query

from app.services.system_log_service import (
    get_system_logs,
)


router = APIRouter(
    prefix="/apiV3/system-logs",
    tags=["System Logs"],
)


@router.get("")
def get_logs(
    lines: int = Query(
        default=10,
        ge=1,
        le=100,
    )
):

    return {
        "status": "success",
        "lines_requested": lines,
        "logs": get_system_logs(lines),
    }