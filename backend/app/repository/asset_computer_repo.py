from app.models.asset_computer_model import AssetComputerDetails



def get_asset_computers_repo(db):
    return (
        db.query(AssetComputerDetails)
        .filter(AssetComputerDetails.is_deleted == False)
        .all()
    )




def get_deleted_asset_computers_repo(db):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.is_deleted == True
        )
        .order_by(
            AssetComputerDetails.computer_detail_id.desc()
        )
        .all()
    )

def get_asset_computer_by_id_repo(db, computer_detail_id):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.computer_detail_id == computer_detail_id,
            AssetComputerDetails.is_deleted == False
        )
        .first()
    )


def get_company_assets_repo(db):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.asset_type == "COMPANY" ,
            AssetComputerDetails.is_deleted == False
        )
        .order_by(
            AssetComputerDetails.computer_detail_id.desc()
        )
        .all()
    )


def get_client_assets_repo(db):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.asset_type == "CLIENT" ,
            AssetComputerDetails.is_deleted==False
        )
        .order_by(
            AssetComputerDetails.computer_detail_id.desc()
        )
        .all()
    )

def get_asset_computer_by_id_repo(
    db,
    computer_detail_id: int
):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.computer_detail_id
            == computer_detail_id
        )
        .first()
    )


def save_asset_computer_repo(
    db,
    asset
):
    db.commit()
    db.refresh(asset)
    return asset


def delete_asset_computer_repo(
    db,
    asset
):
    asset.is_deleted = True
    db.commit()



def bulk_delete_asset_repo(
    db,
    ids: list[int]
):
    assets = (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.computer_detail_id.in_(ids),
            AssetComputerDetails.is_deleted == False
        )
        .all()
    )

    for asset in assets:
        asset.is_deleted = True

    db.commit()

    return len(assets)


def get_deleted_asset_computer_by_id_repo(
    db,
    computer_detail_id: int
):
    return (
        db.query(AssetComputerDetails)
        .filter(
            AssetComputerDetails.computer_detail_id == computer_detail_id,
            AssetComputerDetails.is_deleted == True
        )
        .first()
    )


def restore_asset_computer_repo(
    db,
    asset
):
    asset.is_deleted = False

    db.commit()
    db.refresh(asset)

    return asset


def permanently_delete_asset_computer_repo(
    db,
    asset
):
    db.delete(asset)
    db.commit()

    return asset