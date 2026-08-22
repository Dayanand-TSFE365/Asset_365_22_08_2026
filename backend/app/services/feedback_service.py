from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.feedback_model import Feedback

from app.repository.feedback_repository import (
    create_feedback_repo,
    get_feedback_by_id_repo,
    get_feedback_by_user_repo,
    get_all_feedback_repo,
    update_feedback_repo,
    delete_feedback_repo,
)

def create_feedback_service(
    db: Session,
    feedback_data,
    current_user
):

    feedback = Feedback(
        user_id=current_user.id,
        rating=feedback_data.rating,
        category=feedback_data.category,
        subject=feedback_data.subject,
        message=feedback_data.message,
        status="Pending"
    )

    return create_feedback_repo(
        db,
        feedback
    )


def get_my_feedback_service(
    db: Session,
    current_user
):

    return get_feedback_by_user_repo(
        db,
        current_user.id
    )

def get_feedback_service(
    db: Session,
    feedback_id: int,
    current_user
):

    feedback = get_feedback_by_id_repo(
        db,
        feedback_id
    )

    if not feedback:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found."
        )

    if feedback.user_id != current_user.id:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this feedback."
        )

    return feedback


def get_all_feedback_service(
    db: Session,
    current_user
):

    # Replace this with your existing permission/RBAC function

    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Superadmin access required."
        )

    return get_all_feedback_repo(db)


def update_feedback_service(
    db: Session,
    feedback_id: int,
    feedback_data,
    current_user
):

    feedback = get_feedback_by_id_repo(
        db,
        feedback_id
    )

    if not feedback:

        raise HTTPException(
            status_code=404,
            detail="Feedback not found."
        )

    if current_user.role != "superadmin":
            raise HTTPException(
                status_code=403,
                detail="Superadmin access required."
            )

    if feedback_data.status is not None:

        allowed_statuses = {
            "Pending",
            "Reviewed",
            "Resolved"
        }

        if feedback_data.status not in allowed_statuses:

            raise HTTPException(
                status_code=400,
                detail="Invalid feedback status."
            )

        feedback.status = feedback_data.status

    if feedback_data.admin_response is not None:

        feedback.admin_response = (
            feedback_data.admin_response
        )

    return update_feedback_repo(
        db,
        feedback
    )