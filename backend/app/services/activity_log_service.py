import json

from app.repository.activity_log_repository import (
    create_activity_log,
    get_all_activity_logs
)


def log_activity(
    db,
    created_by,
    module,
    action,
    item_type,
    item_id=None,
    item_name=None,
    target_user_id=None,
    quantity=None,
    notes=None,
    changes=None
):
    if changes is not None:
        changes = json.dumps(
            changes,
            default=str,      # Handles datetime/date automatically
            indent=2          # Optional, makes JSON readable in SQL
        )

    data = {
        "created_by": created_by,
        "module": module,
        "action": action,
        "item_type": item_type,
        "item_id": item_id,
        "item_name": item_name,
        "target_user_id": target_user_id,
        "quantity": quantity,
        "notes": notes,
        "changes": changes
    }

    return create_activity_log(db, data)





def get_activity_report_service(
    db,
    page: int = 1,
    page_size: int = 50
):
    return get_all_activity_logs(
        db,
        page,
        page_size
    )