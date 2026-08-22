from sqlalchemy.orm import Session
from app.models import auth_model,master_model



# adjust imports based on your structure

def get_all_models(db: Session):
    return db.query(master_model.Models).all()

def get_all_categories(db: Session):
    return db.query(master_model.Categories).all()

def get_all_status(db: Session):
    return db.query(master_model.Status).all()

def get_all_users(db: Session):
    return db.query(
        auth_model.AuthUser.id,
        auth_model.AuthUser.email
    ).all()

def get_all_locations(db: Session):
    return db.query(master_model.Locations).all()


def get_all_companies(db):
    return db.query(master_model.Companies).all()



def get_all_manufacturers(db: Session):
    return db.query(master_model.Manufacturers).all()

def create_manufacturer(db: Session, data):
    obj = master_model.Manufacturers(**data.dict())
    db.add(obj)
    db.flush()
    return obj


def get_all_suppliers(db: Session):
    return db.query(master_model.Suppliers).all()

def create_supplier(db: Session, data):
    obj = master_model.Suppliers(**data.dict())
    db.add(obj)
    db.flush()
    return obj


def create_model(db: Session, data):
    obj = master_model.Models(**data.dict())
    db.add(obj)
    db.flush()
    return obj


def create_category(db: Session, data):
    obj = master_model.Categories(**data.dict())
    db.add(obj)
    db.flush()
    return obj

def create_status(db: Session, data):
    obj = master_model.Status(**data.dict())
    db.add(obj)
    db.flush()
    return obj

def create_location(db: Session, data):
    obj = master_model.Locations(**data.dict())
    db.add(obj)
    db.flush()
    return obj

def create_company(db: Session, data):
    obj = master_model.Companies(**data.dict())
    db.add(obj)
    db.flush()
    return obj




from app.models.employee_model import Employee


def get_employee_by_auth_user_id(
    db: Session,
    auth_user_id: int,
):
    return (
        db.query(Employee)
        .filter(Employee.auth_user_id == auth_user_id)
        .first()
    )

def get_user_by_id(
    db: Session,
    user_id: int
):
    return (
        db.query(auth_model.AuthUser)
        .filter(auth_model.AuthUser.id == user_id)
        .first()
    )