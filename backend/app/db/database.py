

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings



asset_engine = create_engine(settings.ASSET_DATABASE_URL)

AssetSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=asset_engine,
)

AssetBase = declarative_base()

# ----------------------------
# Task Database
# ----------------------------

task_engine = create_engine(settings.TASK_DATABASE_URL)

TaskSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=task_engine,
)

TaskBase = declarative_base()


# ----------------------------
# Ticket Database

ticket_engine = create_engine(settings.TICKET_DATABASE_URL)

TicketSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=ticket_engine,
)

TicketBase = declarative_base()






def get_asset_db():
    db = AssetSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_task_db():
    db = TaskSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_ticket_db():
    db = TicketSessionLocal()
    try:
        yield db
    finally:
        db.close()