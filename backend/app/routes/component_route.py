from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
import shutil
import os
import uuid
from typing import Optional
from app.core.dependencies import get_current_user



from app.db.database import get_asset_db
from app.schemas.component_schema import (
    ComponentResponse,
    ComponentUpdate,
    ComponentCheckout,
    ComponentCheckin,
    ComponentTransactionResponse
)
from app.services.component_service import (
    create_component_service,
    get_components_service,
    get_component_service,
    update_component_service,
    delete_component_service,
    checkout_component_service,
    checkin_component_service,
    get_component_transactions_service
)

router = APIRouter(prefix="/apiV3/components", tags=["Components"])


# Upload folder
UPLOAD_DIR = "uploads/components"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# =========================
#  CREATE COMPONENT
# =========================
@router.post("/", response_model=ComponentResponse)
def create_component(
    name: str = Form(...),
    company_id: Optional[int] = Form(None),
    category_id: Optional[int] = Form(None),
    supplier_id: Optional[int] = Form(None),
    manufacturer_id: Optional[int] = Form(None),
    location_id: Optional[int] = Form(None),

    serial_no: Optional[str] = Form(None),
    model_no: Optional[str] = Form(None),
    order_number: Optional[str] = Form(None),

    purchase_date: Optional[str] = Form(None),

    min_qty: int = Form(0),
    total_qty: int = Form(0),
    unit_cost: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),

    image: UploadFile = File(None),

    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    file_path = None

    #  Validate & Save Image
    if image:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files allowed")

        filename = f"{uuid.uuid4()}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    data = {
        "name": name,
        "company_id": company_id,
        "category_id": category_id,
        "supplier_id": supplier_id,
        "manufacturer_id": manufacturer_id,
        "location_id": location_id,
        "serial_no": serial_no,
        "model_no": model_no,
        "order_number": order_number,
        "purchase_date": purchase_date,
        "min_qty": min_qty,
        "total_qty": total_qty,
        "unit_cost": unit_cost,
        "notes": notes,
        "image_url": file_path
    }

    return create_component_service(db, data, current_user.id)


# =========================
#  GET ALL
# =========================
@router.get("/", response_model=list[ComponentResponse])
def get_components(db: Session = Depends(get_asset_db)):
    return get_components_service(db)


# =========================
#  GET BY ID
# =========================
@router.get("/{component_id}", response_model=ComponentResponse)
def get_component(component_id: int, db: Session = Depends(get_asset_db)):
    return get_component_service(db, component_id)


# =========================
#  UPDATE COMPONENT
# =========================
@router.patch("/{component_id}", response_model=ComponentResponse)
def update_component(
    component_id: int,

    name: Optional[str] = Form(None),
    company_id: Optional[int] = Form(None),
    category_id: Optional[int] = Form(None),
    supplier_id: Optional[int] = Form(None),
    manufacturer_id: Optional[int] = Form(None),
    location_id: Optional[int] = Form(None),

    serial_no: Optional[str] = Form(None),
    model_no: Optional[str] = Form(None),
    order_number: Optional[str] = Form(None),

    purchase_date: Optional[str] = Form(None),

    min_qty: Optional[int] = Form(None),
    total_qty: Optional[int] = Form(None),
    unit_cost: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),

    image: UploadFile = File(None),

    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    component = get_component_service(db, component_id)

    file_path = component.image_url

    # Replace image if new one provided
    if image:
        if not image.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files allowed")

        #  delete old image
        if file_path and os.path.exists(file_path):
            os.remove(file_path)

        filename = f"{uuid.uuid4()}_{image.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    data = {
        "name": name,
        "company_id": company_id,
        "category_id": category_id,
        "supplier_id": supplier_id,
        "manufacturer_id": manufacturer_id,
        "location_id": location_id,
        "serial_no": serial_no,
        "model_no": model_no,
        "order_number": order_number,
        "purchase_date": purchase_date,
        "min_qty": min_qty,
        "total_qty": total_qty,
        "unit_cost": unit_cost,
        "notes": notes,
        "image_url": file_path
    }

    # remove None values
    data = {k: v for k, v in data.items() if v is not None}

    return update_component_service(db, component_id, ComponentUpdate(**data),current_user.id)


# =========================
#  DELETE (SOFT)
# =========================
@router.delete("/{component_id}", status_code=status.HTTP_200_OK)
def delete_component(component_id: int, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return delete_component_service(db, component_id,current_user.id)




@router.post("/{component_id}/checkout")
def checkout_component(
    component_id: int,
    data: ComponentCheckout,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user),

):
    return checkout_component_service(db, component_id,current_user.id, data)


# 🔺 CHECKIN
# @router.post("/{component_id}/checkin", response_model=ComponentResponse)
# def checkin_component(
#     component_id: int,
#     data: ComponentCheckin,
#     db: Session = Depends(get_asset_db),
#     user = Depends(get_current_user)
# ):
#     return checkin_component_service(db, component_id, user.id, data)
@router.post("/{component_id}/checkin")
def checkin_component(
    component_id: int,
    data: ComponentCheckin,
    db: Session = Depends(get_asset_db),
    current_user = Depends(get_current_user)
):
    return checkin_component_service(db, component_id, current_user.id, data)



@router.get("/{component_id}/transactions", response_model=list[ComponentTransactionResponse])
def get_component_transactions(component_id: int, db: Session = Depends(get_asset_db)):
    return get_component_transactions_service(db, component_id)