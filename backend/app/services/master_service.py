from app.repository import master_repo
from app.services.activity_log_service import log_activity

def fetch_models(db):
    models = master_repo.get_all_models(db)

    return [
        {
            "id": m.model_id,
            "name": m.model_name
        }
        for m in models
    ]

def fetch_categories(db):
    category= master_repo.get_all_categories(db)
    return [
        {
            "id": c.category_id,
            "name": c.name
        }
        for c in category
    ]

def fetch_status(db):
    status= master_repo.get_all_status(db)

    return [
        {
            "id": s.status_id,
            "name": s.name
        }
        for s in status
    ]

def fetch_users(db):
    users = master_repo.get_all_users(db)

    return [
        {
            "id": u.id,
            "name": u.email
        }
        for u in users
    ]

def fetch_locations(db):
    location = master_repo.get_all_locations(db)

    return [
        {
            "id": l.location_id,
            "name": l.location_name
        }
        for l in location
    ]


def fetch_companies(db):
    companies = master_repo.get_all_companies(db)

    return [
        {
            "id": c.company_id,
            "name": c.company_name
        }
        for c in companies
    ]

def fetch_suppliers(db):
    suppliers = master_repo.get_all_suppliers(db)

    return [
        {
            "id": s.supplier_id,
            "name": s.name,
            "contact_person": s.contact_person,
            "email": s.email,
            "phone": s.phone,
            "address": s.address
        }
        for s in suppliers
    ]
    

def fetch_manufacturers(db):
    manufacturers = master_repo.get_all_manufacturers(db)

    return [
        {
            "id": m.manufacturer_id,
            "name": m.name,
            "email": m.contact_email,
            "phone": m.contact_phone
        }
        for m in manufacturers
    ]
    
def add_model(
    db,
    data,
    performed_by
):

    obj = master_repo.create_model(
        db,
        data
    )

    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="MODEL",
        item_id=obj.model_id,
        item_name=obj.model_name,
        notes=f"Created model '{obj.model_name}'."
    )

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.model_id,
        "name": obj.model_name
    }
    
    
def add_category(db, data,performed_by):
    obj = master_repo.create_category(db, data)
    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="CATEGORY",
        item_id=obj.category_id,
        item_name=obj.name,
        notes=f"Created category '{obj.name}'."
    )

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.category_id,
        "name": obj.name
    }
    
def add_status(db, data,performed_by):
    obj = master_repo.create_status(db, data)
    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="STATUS",
        item_id=obj.status_id,
        item_name=obj.name,
        notes=f"Created status '{obj.name}'."
    )

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.status_id,
        "name": obj.name
    }
    
def add_location(db, data,performed_by):
    obj = master_repo.create_location(db, data)
    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="LOCATION",
        item_id=obj.location_id,
        item_name=obj.location_name,
        notes=f"Created location '{obj.location_name}'."
    )

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.location_id,
        "name": obj.location_name
    }
    
    
def add_company(db, data,performed_by):  
    obj = master_repo.create_company(db, data)
    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="COMPANY",
        item_id=obj.company_id,
        item_name=obj.company_name,
        notes=f"Created company '{obj.company_name}'."
    )

    db.commit()

    db.refresh(obj)

    return {
        "id": obj.company_id,
        "name": obj.company_name
    }
    



def add_supplier(db, data,performed_by):
    obj = master_repo.create_supplier(db, data)

    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="Supplier",
        item_id=obj.supplier_id,
        item_name=obj.name,
        notes=(
            f"Created supplier '{obj.name}' "
            f"(Contact: {obj.contact_person})."
        )
    )

    db.commit()
    db.refresh(obj)

    return {
        "id": obj.supplier_id,
        "name": obj.name
    }
    



def add_manufacturer(db, data,performed_by):
    obj = master_repo.create_manufacturer(db, data)
    log_activity(
        db=db,
        created_by=performed_by,
        module="MASTER",
        action="CREATE",
        item_type="Manufacturer",
        item_id=obj.manufacturer_id,
        item_name=obj.name,
        notes=f"Created manufacturer '{obj.name}'."
    )

    db.commit()
    db.refresh(obj)


    return {
        "id": obj.manufacturer_id,
        "name": obj.name
    }