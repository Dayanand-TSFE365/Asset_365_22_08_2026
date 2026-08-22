from sqlalchemy.orm import Session

from app.models.feedback_model import Feedback


def create_feedback_repo(
    db: Session,
    feedback: Feedback
):

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback


def get_feedback_by_id_repo(
    db: Session,
    feedback_id: int
):

    return (
        db.query(Feedback)
        .filter(
            Feedback.id == feedback_id
        )
        .first()
    )


def get_feedback_by_user_repo(
    db: Session,
    user_id: int
):

    return (
        db.query(Feedback)
        .filter(
            Feedback.user_id == user_id
        )
        .order_by(
            Feedback.created_at.desc()
        )
        .all()
    )


def get_all_feedback_repo(
    db: Session
):

    return (
        db.query(Feedback)
        .order_by(
            Feedback.created_at.desc()
        )
        .all()
    )


def update_feedback_repo(
    db: Session,
    feedback: Feedback
):

    db.commit()
    db.refresh(feedback)

    return feedback


def delete_feedback_repo(
    db: Session,
    feedback: Feedback
):

    db.delete(feedback)
    db.commit()

    return True