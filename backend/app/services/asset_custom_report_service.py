from app.models.asset_model import Asset
from app.models.master_model import (
    Companies,
    Models,
    Status,
    Locations,
    Suppliers
)
from app.utils.asset_report_export import (
    export_csv
)
from app.repository.asset_custom_report_repo import (
    get_asset_report_query
)

from app.models.auth_model import AuthUser

COLUMN_MAP = {

    # ASSET
    "asset_id": Asset.asset_id,
    "asset_tag": Asset.asset_tag,
    "asset_name": Asset.asset_name,
    "serial_number": Asset.serial_number,

    "purchase_cost": Asset.purchase_cost,
    "current_value": Asset.current_value,

    "purchase_date": Asset.purchase_date,
    "warranty_expires": Asset.warranty_expires,
    "next_audit_date": Asset.next_audit_date,

    "order_number": Asset.order_number,
    "condition": Asset.condition,

    "created_at": Asset.created_at,
    "updated_at": Asset.updated_at,

    # RELATIONS
    "company_name": Companies.company_name,
    "model_name": Models.model_name,
    "status_name": Status.name,
    "location_name": Locations.location_name,
    "supplier_name": Suppliers.name,

    "assigned_user": AuthUser.email
}

def generate_asset_report_service(db, data, export_csv_file=False):
    query = get_asset_report_query(db)\
    .join(Companies, Asset.company_id == Companies.company_id, isouter=True)\
    .join(Models, Asset.model_id == Models.model_id, isouter=True)\
    .join(Status, Asset.status_id == Status.status_id, isouter=True)\
    .join(Locations, Asset.location_id == Locations.location_id, isouter=True)\
    .join(Suppliers, Asset.supplier_id == Suppliers.supplier_id, isouter=True)\
    .join(AuthUser, Asset.checked_out_to == AuthUser.id, isouter=True)

    if data.company_id:
        query = query.filter(
        Asset.company_id == data.company_id
    )
        
    if data.asset_name:
        query = query.filter(
        Asset.asset_name.ilike(f"%{data.asset_name}%")
    )
        
    if data.purchase_date_from:
        query = query.filter(
        Asset.purchase_date >= data.purchase_date_from
    )

    if data.purchase_date_to:
        query = query.filter(
        Asset.purchase_date <= data.purchase_date_to
    )
        
    if data.assigned is True:
        query = query.filter(
        Asset.checked_out_to != None
    )

    if data.assigned is False:
        query = query.filter(
        Asset.checked_out_to == None
    )
    
    if data.deleted is not None:
        query = query.filter(
        Asset.is_deleted == data.deleted
    )
        
    selected_columns = []

    for column in data.columns:

        if column in COLUMN_MAP:

            selected_columns.append(
                COLUMN_MAP[column].label(column)
            )

    if not selected_columns:
        return {
        "page": 1,
        "page_size": 0,
        "total_records": 0,
        "data": []
    }
    
    sort_order = (
    data.sort_order or "asc"
    ).lower()
    
    if data.sort_by in COLUMN_MAP:

        sort_column = COLUMN_MAP[data.sort_by]

        if sort_order == "desc":

            query = query.order_by(
            sort_column.desc()
            )

        else:

            query = query.order_by(
            sort_column.asc()
            )

    else:

        # MSSQL requires ORDER BY for pagination
        query = query.order_by(
        Asset.asset_id.desc()
        )

    total_records = query.distinct(
    Asset.asset_id
    ).distinct().count()

    page = max(data.page or 1, 1)

    page_size = min(
        max(data.page_size or 50, 1),
        500
    )

    if not export_csv_file:

        offset = (page - 1) * page_size

        query = query.offset(offset).limit(page_size)

    results = query.with_entities(
        *selected_columns
        ).all()
    response = []

    for row in results:

        item = {}

        for column in data.columns:

            item[column] = getattr(row, column, None)

        response.append(item)

    if export_csv_file:

        return export_csv(
        data.columns,
        response
        )

    return {
    "page": page,
    "page_size": page_size,
    "total_records": total_records,
    "data": response
}