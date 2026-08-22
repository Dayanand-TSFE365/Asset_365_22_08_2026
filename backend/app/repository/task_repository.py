from sqlalchemy.orm import Session, joinedload

from app.models.task_model import Task
from app.models.task_checklist_model import TaskChecklist
from app.models.task_attachment_model import TaskAttachment
from app.models.task_assignment_history_model import TaskAssignmentHistory
from app.models.task_progress_model import TaskProgress
from app.models.task_progress_attachment_model import TaskProgressAttachment
from app.models.task_status_history_model import TaskStatusHistory
from app.models.task_approval_history_model import TaskApprovalHistory

# ==========================================================
# Task
# ==========================================================

def create_task(db: Session, task: Task):
    db.add(task)
    db.flush()
    db.refresh(task)
    return task

def update_task(
    db: Session,
    task: Task,
):
    db.add(task)
    db.flush()
    db.refresh(task)

    return task

def get_task_by_id(db: Session, task_id: int):
    return (
        db.query(Task)
        .options(
            joinedload(Task.attachments),
            joinedload(Task.checklists),
            joinedload(Task.assignment_history),
        )
        .filter(
            Task.id == task_id,
            Task.is_deleted == False,
        )
        .first()
    )


# def get_all_tasks(db: Session):
#     return (
#         db.query(Task)
#         .filter(Task.is_deleted == False)
#         .order_by(Task.created_at.desc())
#         .all()
#     )

def get_all_tasks(db: Session):
    return (
        db.query(Task)
        .options(
            joinedload(Task.attachments),
            joinedload(Task.checklists),
        )
        .filter(Task.is_deleted == False)
        .order_by(Task.created_at.desc())
        .all()
    )


def update_checklist_item(
    db: Session,
    checklist: TaskChecklist,
):
    db.add(checklist)
    db.flush()
    db.refresh(checklist)

    return checklist

def delete_task(
    db: Session,
    task: Task,
):
    task.is_deleted = True
    db.add(task)

    return task


def get_deleted_tasks(
    db: Session
):
    return (
        db.query(Task)
        .options(
            joinedload(Task.attachments),
            joinedload(Task.checklists),
        )
        .filter(
            Task.is_deleted == True
        )
        .order_by(
            Task.created_at.desc()
        )
        .all()
    )


def get_deleted_task_by_id(
    db: Session,
    task_id: int
):
    return (
        db.query(Task)
        .options(
            joinedload(Task.attachments),
            joinedload(Task.checklists),
            joinedload(Task.assignment_history),
        )
        .filter(
            Task.id == task_id,
            Task.is_deleted == True
        )
        .first()
    )


def restore_task(
    db: Session,
    task: Task
):
    task.is_deleted = False
    db.add(task)

    return task


def permanently_delete_task(
    db: Session,
    task: Task
):
    db.delete(task)

# ==========================================================
# Checklist
# ==========================================================

def create_checklist_item(db: Session, checklist: TaskChecklist):
    db.add(checklist)
    db.flush()
    db.refresh(checklist)
    return checklist


def get_checklist_item(db: Session, checklist_id: int):
    return (
        db.query(TaskChecklist)
        .filter(TaskChecklist.id == checklist_id)
        .first()
    )


def delete_checklist_item(db: Session, checklist: TaskChecklist):
    db.delete(checklist)


# ==========================================================
# Attachment
# ==========================================================

def create_attachment(db: Session, attachment: TaskAttachment):
    db.add(attachment)
    db.flush()
    db.refresh(attachment)
    return attachment


def get_attachment(db: Session, attachment_id: int):
    return (
        db.query(TaskAttachment)
        .filter(TaskAttachment.id == attachment_id)
        .first()
    )


def delete_attachment(db: Session, attachment: TaskAttachment):
    db.delete(attachment)


# ==========================================================
# Assignment History
# ==========================================================

def create_assignment_history(
    db: Session,
    history: TaskAssignmentHistory,
):
    db.add(history)
    db.flush()
    db.refresh(history)
    return history


def create_task_progress(
    db: Session,
    progress: TaskProgress,
):
    db.add(progress)
    db.flush()
    db.refresh(progress)

    return progress

def get_task_progress_by_id(
    db: Session,
    progress_id: int,
):
    return (
        db.query(TaskProgress)
        .filter(TaskProgress.id == progress_id)
        .first()
    )

def get_task_progress_history(
    db: Session,
    task_id: int,
):
    return (
        db.query(TaskProgress)
        .filter(TaskProgress.task_id == task_id)
        .order_by(TaskProgress.created_at.desc())
        .all()
    )

def create_progress_attachment(db: Session, attachment: TaskProgressAttachment):
    db.add(attachment)
    db.flush()
    db.refresh(attachment)
    return attachment


def get_progress_attachments(db: Session, progress_id: int):
    return (
        db.query(TaskProgressAttachment)
        .filter(TaskProgressAttachment.task_progress_id == progress_id)
        .all()
    )


def get_progress_attachment_by_id(db: Session, attachment_id: int):
    return (
        db.query(TaskProgressAttachment)
        .filter(TaskProgressAttachment.id == attachment_id)
        .first()
    )


def delete_progress_attachment(db: Session, attachment: TaskProgressAttachment):
    db.delete(attachment)


def create_task_status_history(
    db: Session,
    history: TaskStatusHistory,
):
    db.add(history)
    db.flush()
    db.refresh(history)
    return history

def get_task_status_history(
    db: Session,
    task_id: int,
):
    return (
        db.query(TaskStatusHistory)
        .filter(TaskStatusHistory.task_id == task_id)
        .order_by(TaskStatusHistory.changed_at.desc())
        .all()
    )

def create_task_approval_history(
    db: Session,
    history: TaskApprovalHistory,
):
    db.add(history)
    db.flush()
    db.refresh(history)
    return history