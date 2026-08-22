from app.models.activity_logs_model import ActivityLog


def create_activity_log(db, data):

    log = ActivityLog(**data)

    db.add(log)

    db.commit()

    db.refresh(log)

    return log

def get_all_activity_logs(
    db,
    page: int = 1,
    page_size: int = 50
):
    query = (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
    )

    total = query.count()

    logs = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": logs
    }