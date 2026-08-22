# from fastapi import APIRouter, Depends, UploadFile, File, Form
# from sqlalchemy.orm import Session
# from app.db.database import get_db
# from app.services import assets_audit_service
# from app.core.dependencies import get_current_user

# router = APIRouter(prefix="/apiV3/assets", tags=["Assets"])
# from app.schemas.asset_audit_schema import (
#     AssetAuditResponse
# )

# from app.services.assets_audit_service import (
#     get_asset_audit_history_service
# )
# # 

# @router.get(
#     "/audits",
#     response_model=list[AssetAuditResponse]
# )
# def get_all_asset_audits(

#     db: Session = Depends(get_db),

    

# ):

#     return assets_audit_service.get_all_asset_audits_service(db)

# @router.get(
#     "/{asset_id}/audits",
#     response_model=list[AssetAuditResponse]
# )
# def get_asset_audits(

#     asset_id: int,

#     db: Session = Depends(get_db),
    

# ):

#     return get_asset_audit_history_service(
#         db,
#         asset_id
#     )

# @router.post("/{asset_id}/audit")
# async def audit_asset(
#     asset_id: int,

#     location_id: int = Form(...),
#     update_location: bool = Form(False),
#     next_audit_date: str = Form(None),
#     notes: str = Form(None),

#     file: UploadFile = File(None),   #  image here

#     db: Session = Depends(get_asset_db),
#     current_user = Depends(get_current_user)
# ):
#     print("AUDIT ROUTE HIT")
#     return await assets_audit_service.audit_asset(
#         db,
#         asset_id,
#         location_id,
#         update_location,
#         next_audit_date,
#         notes,
#         file,
#         current_user.id 
#     )
