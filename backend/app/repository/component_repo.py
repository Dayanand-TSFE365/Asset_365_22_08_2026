from sqlalchemy.orm import Session
from datetime import datetime
from app.models.component_model import Component
from app.models.component_transaction_model import ComponentTransaction
from sqlalchemy import func



def create_component(
    db: Session,
    data: dict
):

    component = Component(**data)

    db.add(component)

    db.flush()

    return component


def get_all_components(db: Session):
    return db.query(Component)\
        .filter(Component.is_deleted == 0)\
        .order_by(Component.id.desc())\
        .all()


def get_component_by_id(db: Session, component_id: int):
    return db.query(Component).filter(
        Component.id == component_id,
        Component.is_deleted == 0
    ).first()


def update_component(
    db: Session,
    component,
    update_data: dict
):

    for key, value in update_data.items():
        setattr(component, key, value)

    component.updated_at = datetime.utcnow()

    db.flush()

    return component

def soft_delete_component(
    db: Session,
    component
):

    component.is_deleted = 1

    component.updated_at = datetime.utcnow()

    db.flush()

    return component
    
    
    



def create_transaction(
    db,
    data
):

    tx = ComponentTransaction(**data)

    db.add(tx)

    db.flush()

    return tx


def get_user_checkout_qty(db, component_id, user_id):

    checkout_sum = db.query(func.coalesce(func.sum(ComponentTransaction.quantity), 0))\
        .filter(
            ComponentTransaction.component_id == component_id,
            ComponentTransaction.user_id == user_id,
            ComponentTransaction.type == "checkout"
        ).scalar()

    checkin_sum = db.query(func.coalesce(func.sum(ComponentTransaction.quantity), 0))\
        .filter(
            ComponentTransaction.component_id == component_id,
            ComponentTransaction.user_id == user_id,
            ComponentTransaction.type == "checkin"
        ).scalar()

    return checkout_sum - checkin_sum





def get_transactions_by_component(db, component_id: int):
    return db.query(ComponentTransaction)\
        .filter(ComponentTransaction.component_id == component_id)\
        .order_by(ComponentTransaction.id.desc())\
        .all()