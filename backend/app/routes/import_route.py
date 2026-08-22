from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user

from app.db.database import get_asset_db

from app.services.assets_import_service import (
    import_assets_service,
    get_import_history_service,
    get_import_errors_service
)
from app.services.license_import_service import (
    import_licenses_service
)
from app.services.accessory_import_service import (
    import_accessories_service
)
from app.services.consumables_import_service import (
    import_consumables_service  
    )
from app.services.component_import_service import (
    import_components_service   
)



router = APIRouter(
    prefix="/apiV3/import",
    tags=["Import"]
)


#  IMPORT ASSETS CSV
@router.post("/assets")
def import_assets(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):

    return import_assets_service(db, file,current_user.id)


#  GET IMPORT HISTORY
@router.get("/")
def get_import_history(
    db: Session = Depends(get_asset_db)
):

    return get_import_history_service(db)


#  GET IMPORT ERRORS
@router.get("/{import_id}/errors")
def get_import_errors(
    import_id: int,
    db: Session = Depends(get_asset_db)
):

    return get_import_errors_service(
        db,
        import_id
    )


#  DOWNLOAD ASSET TEMPLATE
@router.get("/assets/template")
def download_asset_template():

    file_path = "templates/assets/assets_template.csv"

    return FileResponse(
        path=file_path,
        filename="assets_template.csv",
        media_type="text/csv"
    ) 
    
    
@router.post("/licenses")
def import_licenses(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):

    return import_licenses_service(db, file,current_user.id)

@router.get("/licenses/template")
def download_license_template():

    file_path = "templates/licenses/licenses_template.csv"

    return FileResponse(
        path=file_path,
        filename="license_template.csv",
        media_type="text/csv"
    )
    
# =====================================================
#  ACCESSORY IMPORT
# =====================================================

@router.post("/accessories")
def import_accessories(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)

):

    return import_accessories_service(
        db,
        file,
        current_user.id
    )
    
# =====================================================
#  ACCESSORY TEMPLATE
# =====================================================

@router.get("/accessories/template")
def download_accessory_template():

    file_path = "templates/accessories/accessories_template.csv"

    return FileResponse(
        path=file_path,
        filename="accessories_template.csv",
        media_type="text/csv"
    )
    
    
# =====================================================
#  CONSUMABLE IMPORT
# =====================================================

@router.post("/consumables")
def import_consumables(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):

    return import_consumables_service(
        db,
        file,
        current_user.id
    )
    

# =====================================================
#  CONSUMABLE TEMPLATE
# =====================================================

@router.get("/consumables/template")
def download_consumable_template():

    file_path = "templates/consumables/consumables_template.csv"

    return FileResponse(
        path=file_path,
        filename="consumables_template.csv",
        media_type="text/csv"
    )
    
    
# =====================================================
#  COMPONENT IMPORT
# =====================================================

@router.post("/components")
def import_components(
    file: UploadFile = File(...),
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)

):

    return import_components_service(
        db,
        file,
        current_user.id
    )
    
# =====================================================
#  COMPONENT TEMPLATE
# =====================================================

@router.get("/components/template")
def download_component_template():

    file_path = "templates/components/components_template.csv"

    return FileResponse(
        path=file_path,
        filename="components_template.csv",
        media_type="text/csv"
    )