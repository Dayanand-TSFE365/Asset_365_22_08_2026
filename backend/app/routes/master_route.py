from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_asset_db
from typing import List
from app.core.dependencies import get_current_user
from app.services.master_service import fetch_categories, fetch_models, fetch_status, fetch_users, fetch_locations, fetch_companies,add_category, add_model, add_status, add_location, add_company, fetch_manufacturers,add_manufacturer, fetch_suppliers, add_supplier

from app.schemas.master_schema import ModelCreate, CategoryCreate, StatusCreate, LocationCreate, CompanyCreate, ManufacturerCreate, SupplierCreate  
from app.schemas.master_schema import DropdownResponse


router = APIRouter(prefix="/apiV3/master", tags=["Master"])

# 🔹 Models 
@router.get("/models",response_model=List[DropdownResponse])
def get_models(db: Session = Depends(get_asset_db)):
    return fetch_models(db)


# 🔹 Categories
@router.get("/categories",response_model=List[DropdownResponse])
def get_categories(db: Session = Depends(get_asset_db)):
    return fetch_categories(db)


# 🔹 Status
@router.get("/status",response_model=List[DropdownResponse])
def get_status(db: Session = Depends(get_asset_db)):
    return fetch_status(db)


# Users
@router.get("/users",response_model=List[DropdownResponse])
def get_users(db: Session = Depends(get_asset_db)):
    return fetch_users(db)


# 🔹 Locations
@router.get("/locations",response_model=List[DropdownResponse])
def get_locations(db: Session = Depends(get_asset_db)):
    return fetch_locations(db)

@router.get("/suppliers")
def get_suppliers(db: Session = Depends(get_asset_db)):
    return fetch_suppliers(db)


@router.get("/companies",response_model=List[DropdownResponse])
def get_companies(db: Session = Depends(get_asset_db)):
    return fetch_companies(db)

@router.get("/manufacturers")
def get_manufacturers(db: Session = Depends(get_asset_db)):
    return fetch_manufacturers(db)


@router.post("/models")
def create_model(data: ModelCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_model(db, data,current_user.id)

@router.post("/categories")
def create_category(data: CategoryCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_category(db, data,current_user.id)



@router.post("/status")
def create_status(data: StatusCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_status(db, data,current_user.id)

@router.post("/locations")
def create_location(data: LocationCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_location(db, data,current_user.id)


@router.post("/companies")
def create_company(data: CompanyCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_company(db,data,current_user.id)  



@router.post("/manufacturers")
def create_manufacturer(data: ManufacturerCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_manufacturer(db, data,current_user.id)


@router.post("/suppliers")
def create_supplier(data: SupplierCreate, db: Session = Depends(get_asset_db),current_user = Depends(get_current_user)):
    return add_supplier(db, data,current_user.id)