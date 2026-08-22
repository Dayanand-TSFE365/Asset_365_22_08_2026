from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.services.activity_log_service import log_activity






from app.repository.component_repo import (
    create_component,
    get_all_components,
    get_component_by_id,
    update_component,
    soft_delete_component,
    create_transaction,
    get_user_checkout_qty,
    get_transactions_by_component
)


def create_component_service(db: Session, component, user_id):

    if isinstance(component, dict):
        data = component
    else:
        data = component.dict()

    #  Important logic
    total_qty = data.get("total_qty", 0)
    unit_cost = data.get("unit_cost", 0)

    data["remaining_qty"] = total_qty
    data["total_cost"] = total_qty * unit_cost if unit_cost else 0

    component_obj = create_component(
        db,
        data
    )

    # ACTIVITY LOG
    log_activity(
        db=db,
        created_by=user_id,
        module="COMPONENT",
        action="CREATE",
        item_type="COMPONENT",
        item_id=component_obj.id,
        item_name=component_obj.name,
        quantity=component_obj.total_qty,
        notes="Component created"
    )

    db.commit()

    db.refresh(component_obj)

    return component_obj

  



def get_components_service(db: Session):
    return get_all_components(db)


def get_component_service(db: Session, component_id: int):
    component = get_component_by_id(db, component_id)

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    return component


def update_component_service(db: Session, component_id: int, update_data,user_id):
    component = get_component_by_id(db, component_id)

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    data = update_data.dict(exclude_unset=True)

    #  Recalculate if qty or cost updated
    if "total_qty" in data:
        component.remaining_qty = data["total_qty"]

    if "unit_cost" in data or "total_qty" in data:
        total_qty = data.get("total_qty", component.total_qty)
        unit_cost = data.get("unit_cost", component.unit_cost or 0)
        component.total_cost = total_qty * unit_cost


    update_component(
    db,
    component,
    data
    )

    log_activity(
    db=db,
    created_by=user_id,
    module="COMPONENT",
    action="UPDATE",
    item_type="COMPONENT",
    item_id=component.id,
    item_name=component.name,
    quantity=component.total_qty,
    notes="Component updated"
    )
    db.commit()

    db.refresh(component)

    return component


def delete_component_service(db: Session, component_id: int,user_id):
    component = get_component_by_id(db, component_id)

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    soft_delete_component(db, component)
    log_activity(
    db=db,
    created_by=user_id,
    module="COMPONENT",
    action="DELETE",
    item_type="COMPONENT",
    item_id=component.id,
    item_name=component.name,
    notes="Component deleted"
    )

    db.commit()

    return {"message": "Component deleted successfully"}




def checkout_component_service(db, component_id, performed_by, data):

    component = get_component_by_id(db, component_id)

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    #  SIMPLE: assign to given user OR fallback to current user
    target_user_id = data.user_id if data.user_id else performed_by

    #  STOCK VALIDATION
    if component.remaining_qty < data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

    #  reduce stock
    component.remaining_qty -= data.quantity

    #  create transaction
    create_transaction(db, {
        "component_id": component_id,
        "user_id": target_user_id,
        "type": "checkout",
        "quantity": data.quantity,
        "notes": data.notes
    })

    log_activity(
    db=db,
    created_by=performed_by,
    module="COMPONENT",
    action="CHECKOUT",
    item_type="COMPONENT",
    item_id=component.id,
    item_name=component.name,
    target_user_id=target_user_id,
    quantity=data.quantity,
    notes=data.notes
   )

    db.commit()
    db.refresh(component)

    return component



def checkin_component_service(db, component_id, performed_by, data):

    component = get_component_by_id(db, component_id)

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    #  determine which user is returning
    target_user_id = data.user_id if data.user_id else performed_by

   

    #  GET USER CHECKOUT BALANCE
    user_checked_out = get_user_checkout_qty(db, component_id, target_user_id)

    if user_checked_out <= 0:
        raise HTTPException(
            status_code=400,
            detail="No items to checkin for this user"
        )

    if data.quantity > user_checked_out:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot checkin more than checked out (max {user_checked_out})"
        )

    #  increase stock
    component.remaining_qty += data.quantity

    #  create transaction
    create_transaction(db, {
        "component_id": component_id,
        "user_id": target_user_id,
        "type": "checkin",
        "quantity": data.quantity,
        "notes": data.notes
    })

    log_activity(
    db=db,
    created_by=performed_by,
    module="COMPONENT",
    action="CHECKIN",
    item_type="COMPONENT",
    item_id=component.id,
    item_name=component.name,
    target_user_id=target_user_id,
    quantity=data.quantity,
    notes=data.notes
)

    db.commit()
    db.refresh(component)

    return component




def get_component_transactions_service(db, component_id: int):

    component = get_component_by_id(db, component_id)

    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    return get_transactions_by_component(db, component_id)