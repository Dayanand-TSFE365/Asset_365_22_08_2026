from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.db.database import AssetBase


class ImportFileError(AssetBase):

    __tablename__ = "import_errors"

    id = Column(Integer, primary_key=True, index=True)

    import_id = Column(
        Integer,
        ForeignKey("import_files.id", ondelete="CASCADE")
    )

    row_number = Column(Integer)

    # asset_tag = Column(String(100), nullable=True)
    reference_value = Column(
        String(100),
        nullable=True
    )

    error_message = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)