from datetime import datetime
from app.models.asset_model import Asset


def depreciation_report_service(db):

    assets = db.query(Asset).filter(
        Asset.is_deleted == False
    ).all()

    response = []

    for asset in assets:

        # Skip incomplete assets
        if not asset.purchase_cost:
            continue

        if not asset.purchase_date:
            continue

        if not asset.depreciation_months:
            continue

        # Today's date
        today = datetime.utcnow().date()

        # Months used
        months_used = (
            (today.year - asset.purchase_date.year) * 12
            +
            (today.month - asset.purchase_date.month)
        )

        # Prevent negative
        months_used = max(months_used, 0)

        # Monthly depreciation
        monthly_depreciation = (
            float(asset.purchase_cost)
            /
            asset.depreciation_months
        )

        # Total depreciation used
        depreciation_used = (
            monthly_depreciation
            * months_used
        )

        # Calculated value
        calculated_value = (
            float(asset.purchase_cost)
            - depreciation_used
        )

        # Prevent negative values
        calculated_value = max(
            calculated_value,
            0
        )

        response.append({

            "asset_id":
            asset.asset_id,

            "asset_tag":
            asset.asset_tag,

            "asset_name":
            asset.asset_name,

            "purchase_cost":
            float(asset.purchase_cost),

            "manual_current_value":
            float(asset.current_value)
            if asset.current_value else None,

            "purchase_date":
            asset.purchase_date,

            "depreciation_months":
            asset.depreciation_months,

            "months_used":
            months_used,

            "monthly_depreciation":
            round(monthly_depreciation, 2),

            "depreciation_used":
            round(depreciation_used, 2),

            "calculated_value":
            round(calculated_value, 2)
        })

    return response