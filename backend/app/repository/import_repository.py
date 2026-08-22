from sqlalchemy import func

from app.models.asset_model import Asset
from app.models.license_model import License
from app.models.license_model import License
from app.models.master_model import Categories, Manufacturers, Models
from app.models.master_model import Status
from app.models.master_model import Companies


from app.models.import_file_model import ImportFile
from app.models.import_error_model import ImportFileError


from app.models.accessories_model import Accessory
from app.models.component_model import Component





def create_import_file(
    db,
    file_name,
    module_name,
    total_rows
):

    import_file = ImportFile(
        file_name=file_name,
        module_name=module_name,
        total_rows=total_rows,
        status="processing"
    )

    db.add(import_file)

    db.flush()

    db.refresh(import_file)

    return import_file


def create_import_error(
    db,
    import_id,
    row_number,
    reference_value,
    error_message
):
    error = ImportFileError(
        import_id=import_id,
        row_number=row_number,
        reference_value=reference_value,
        error_message=error_message
    )

    db.add(error)
    db.flush()

    return error
    
def update_import_summary(
    db,
    import_file,
    success_rows,
    failed_rows
):

    import_file.success_rows = success_rows

    import_file.failed_rows = failed_rows

    import_file.status = "completed"
    
    



# 🔹 GET MODEL BY NAME
def get_model_by_name(db, model_name):

    return db.query(Models).filter(
        func.lower(Models.model_name) ==
        str(model_name).strip().lower()
    ).first()


# 🔹 GET STATUS BY NAME
def get_status_by_name(db, status_name):

    return db.query(Status).filter(
        func.lower(Status.name) ==
        str(status_name).strip().lower()
    ).first()


# 🔹 GET COMPANY BY NAME
def get_company_by_name(db, company_name):

    return db.query(Companies).filter(
        func.lower(Companies.company_name) ==
        str(company_name).strip().lower()
    ).first()


# 🔹 CHECK DUPLICATE ASSET TAG
def get_asset_by_tag(db, asset_tag):

    return db.query(Asset).filter(
        func.lower(Asset.asset_tag) ==
        str(asset_tag).strip().lower()
    ).first()


# 🔹 CREATE ASSET
def create_asset(db, asset_data):

    asset = Asset(**asset_data)

    db.add(asset)

    return asset


def get_all_imports(db):

    return db.query(ImportFile).order_by(
        ImportFile.id.desc()
    ).all()
    
def get_import_errors_by_import_id(
    db,
    import_id
):

    return db.query(ImportFileError).filter(
        ImportFileError.import_id == import_id
    ).all()
    
    
    
# =========================================================
# 🔹 LICENSE IMPORT FUNCTIONS
# =========================================================

def get_manufacturer_by_name(
    db,
    manufacturer_name
):

    return db.query(Manufacturers).filter(
        func.lower(Manufacturers.name) ==
        str(manufacturer_name).strip().lower()
    ).first()


def get_category_by_name(
    db,
    category_name
):

    return db.query(Categories).filter(
        func.lower(Categories.name) ==
        str(category_name).strip().lower()
    ).first()


def get_license_by_product_key(
    db,
    product_key
):

    return db.query(License).filter(
        func.lower(License.product_key) ==
        str(product_key).strip().lower()
    ).first()


def create_license(
    db,
    license_data
):

    license_obj = License(**license_data)

    db.add(license_obj)

    db.flush()

    return license_obj


def get_accessory_by_name_and_model(
    db,
    name,
    model_no
):

    return db.query(Accessory).filter(

        func.lower(Accessory.name) ==
        str(name).strip().lower(),

        func.lower(Accessory.model_no) ==
        str(model_no).strip().lower()

    ).first()
    
    
    
def create_accessory(
    db,
    accessory_data
):

    accessory = Accessory(**accessory_data)

    db.add(accessory)

    db.flush()

    return accessory


# =========================================================
# 🔹 CONSUMABLE IMPORT FUNCTIONS
# =========================================================

from app.models.consumable_model import Consumable


# 🔹 CHECK DUPLICATE CONSUMABLE
def get_consumable_by_name_and_model(
    db,
    name,
    model_no
):

    return db.query(Consumable).filter(

        func.lower(Consumable.name) ==
        str(name).strip().lower(),

        func.lower(Consumable.model_no) ==
        str(model_no).strip().lower()

    ).first()


# 🔹 CREATE CONSUMABLE
def create_consumable(
    db,
    consumable_data
):

    consumable = Consumable(**consumable_data)

    db.add(consumable)

    db.flush()

    return consumable


def get_component_by_name_and_model(
    db,
    name,
    model_no
):

    return db.query(Component).filter(

        func.lower(Component.name) ==
        str(name).strip().lower(),

        func.lower(Component.model_no) ==
        str(model_no).strip().lower()

    ).first()
    
    
def create_component(
    db,
    component_data
):

    component = Component(**component_data)

    db.add(component)

    db.flush()

    return component