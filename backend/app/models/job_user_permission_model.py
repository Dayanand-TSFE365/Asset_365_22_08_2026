from sqlalchemy import (
    Column,
    Integer,
    Boolean,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.database import AssetBase


class JobUserPermission(AssetBase):
    __tablename__ = "JobUserPermissions"

    permission_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("Jobs_New.job_id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("AuthUsers.id"),
        nullable=False
    )

    # Job Permission
    can_view = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # File Permissions
    can_upload_file = Column(
        Boolean,
        default=False,
        nullable=False
    )

    can_view_file = Column(
        Boolean,
        default=False,
        nullable=False
    )

    can_download_file = Column(
        Boolean,
        default=False,
        nullable=False
    )

    can_delete_file = Column(
        Boolean,
        default=False,
        nullable=False
    )

    assigned_by = Column(
        Integer,
        ForeignKey("AuthUsers.id"),
        nullable=True
    )

    assigned_at = Column(
        DateTime,
        server_default=func.getdate()
    )

    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # Relationships

    job = relationship(
        "JobNew",
        back_populates="permissions",
        foreign_keys=[job_id]
    )

    user = relationship(
        "AuthUser",
        foreign_keys=[user_id]
    )

    assigned_user = relationship(
        "AuthUser",
        foreign_keys=[assigned_by]
    )