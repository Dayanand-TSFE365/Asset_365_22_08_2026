from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.db.database import AssetBase


class ImportFile(AssetBase):

    __tablename__ = "import_files"

    id = Column(Integer, primary_key=True, index=True)

    file_name = Column(String(255), nullable=False)

    module_name = Column(String(100), nullable=False)

    total_rows = Column(Integer, default=0)

    success_rows = Column(Integer, default=0)

    failed_rows = Column(Integer, default=0)

    uploaded_by = Column(Integer, nullable=True)

    status = Column(String(50), default="completed")

    created_at = Column(DateTime, default=datetime.utcnow)