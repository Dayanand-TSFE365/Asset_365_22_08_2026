import logging

from sqlalchemy import text

from app.db.database import asset_engine, task_engine,ticket_engine


logger = logging.getLogger("database")


def check_database_connection():

    databases = {
        "asset_db": asset_engine,
        "task_db": task_engine,
        "ticket_db":ticket_engine,
    }

    for db_name, engine in databases.items():

        try:

            with engine.connect() as connection:

                connection.execute(text("SELECT 1"))

            logger.info(
                "[DB HEALTH] Database connection successful "
                "| database=%s",
                db_name,
            )

        except Exception as e:

            logger.error(
                "[DB HEALTH] Database connection FAILED "
                "| database=%s "
                "| error=%s",
                db_name,
                str(e),
                exc_info=True,
            )