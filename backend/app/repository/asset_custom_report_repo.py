from app.models.asset_model import Asset


def get_asset_report_query(db):

    return db.query(Asset)





