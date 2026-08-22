from fastapi import (
    APIRouter,
    Depends,
    status
)

from sqlalchemy.orm import Session

from app.db.database import get_asset_db

from app.schemas.feedback_schema import (
    FeedbackCreate,
    FeedbackUpdate,
    FeedbackResponse,
)

from app.services.feedback_service import (
    create_feedback_service,
    get_my_feedback_service,
    get_feedback_service,
    get_all_feedback_service,
    update_feedback_service,
)

from app.core.dependencies import (
    get_current_user
)


router = APIRouter(
    prefix="/apiV3/feedback",
    tags=["Feedback"]
)


@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED
)
def create_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):

    return create_feedback_service(
        db=db,
        feedback_data=feedback_data,
        current_user=current_user
    )


@router.get(
    "/my",
    response_model=list[FeedbackResponse]
)
def get_my_feedback(
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):

    return get_my_feedback_service(
        db=db,
        current_user=current_user
    )


@router.get(
    "/{feedback_id}",
    response_model=FeedbackResponse
)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):

    return get_feedback_service(
        db=db,
        feedback_id=feedback_id,
        current_user=current_user
    )

@router.get(
    "/",
    response_model=list[FeedbackResponse]
)
def get_all_feedback(
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):

    return get_all_feedback_service(
        db=db,
        current_user=current_user
    )

@router.patch(
    "/{feedback_id}",
    response_model=FeedbackResponse
)
def update_feedback(
    feedback_id: int,
    feedback_data: FeedbackUpdate,
    db: Session = Depends(get_asset_db),
    current_user=Depends(get_current_user)
):

    return update_feedback_service(
        db=db,
        feedback_id=feedback_id,
        feedback_data=feedback_data,
        current_user=current_user
    )