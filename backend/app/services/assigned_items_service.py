from sqlalchemy.orm import Session

from app.repository.assigned_items_repo import (
    get_assigned_assets,
    get_assigned_accessories,
    get_assigned_components,
    get_assigned_consumables,
    get_assigned_licenses
)


#  GET MY ASSIGNED ITEMS
def get_my_assigned_items_service(
    db: Session,
    user_id: int
):

    assets = get_assigned_assets(
        db,
        user_id
    )

    accessories = get_assigned_accessories(
        db,
        user_id
    )

    components = get_assigned_components(
        db,
        user_id
    )

    consumables = get_assigned_consumables(
        db,
        user_id
    )

    licenses = get_assigned_licenses(
        db,
        user_id
    )

    # 🔹 FORMAT RESPONSE
    asset_response = []

    for item in assets:

        asset_response.append({

            "asset_id": item.asset_id,

            "asset_tag": item.asset_tag,

            "asset_name": item.asset_name,

            "image_url": item.image_url,

            "serial_number": item.serial_number
        })

    accessory_response = []

    for item in accessories:

        accessory_response.append({

            "accessory_id":
                item.accessory_id,

            "accessory_name":
                item.accessory.name,

            "quantity":
                item.quantity
        })

    component_response = []

    for item in components:

        component_response.append({

            "component_id":
                item.component_id,

            "component_name":
                item.component.name,

            "quantity":
                item.quantity
        })

    consumable_response = []

    for item in consumables:

        consumable_response.append({

            "consumable_id":
                item.consumable_id,

            "consumable_name":
                item.consumable.name,

            "quantity":
                item.quantity
        })

    license_response = []

    for item in licenses:

        license_response.append({

            "license_id":
                item.license_id,

            "license_name":
                item.license.name
        })

    return {

        "assets": asset_response,

        "accessories": accessory_response,

        "components": component_response,

        "consumables": consumable_response,

        "licenses": license_response
    }