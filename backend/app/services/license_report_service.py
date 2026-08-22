from datetime import datetime
from app.models.license_model import License


def license_report_service(db):

    licenses = db.query(License).filter(
        License.is_deleted == False
    ).all()

    response = []

    for license in licenses:

        # REQUIRED FIELDS
        if not license.purchase_cost:
            continue

        if not license.purchase_date:
            continue

        if not license.depreciation:
            continue

        # TODAY
        today = datetime.utcnow().date()

        # MONTHS USED
        months_used = (
            (today.year - license.purchase_date.year) * 12
            +
            (today.month - license.purchase_date.month)
        )

        months_used = max(months_used, 0)

        # DEPRECIATION MONTHS
        depreciation_months = float(license.depreciation)

        # MONTHLY DEPRECIATION
        monthly_depreciation = (
            float(license.purchase_cost)
            /
            depreciation_months
        )

        # TOTAL DEPRECIATION USED
        depreciation_used = (
            monthly_depreciation
            * months_used
        )

        # CURRENT VALUE
        current_value = (
            float(license.purchase_cost)
            - depreciation_used
        )

        current_value = max(current_value, 0)

        # SEAT USAGE
        used_seats = (
            license.total
            - license.available
        )

        response.append({

            "license_id":
            license.license_id,

            "software_name":
            license.Software_name,

            "product_key":
            license.product_key,

            "total_seats":
            license.total,

            "available_seats":
            license.available,

            "used_seats":
            used_seats,

            "purchase_cost":
            float(license.purchase_cost),

            "purchase_date":
            license.purchase_date,

            "depreciation_months":
            depreciation_months,

            "months_used":
            months_used,

            "monthly_depreciation":
            round(monthly_depreciation, 2),

            "depreciation_used":
            round(depreciation_used, 2),

            "current_value":
            round(current_value, 2),

            "expiration_date":
            license.expiration_date,

            "termination_date":
            license.termination_date
        })

    return response