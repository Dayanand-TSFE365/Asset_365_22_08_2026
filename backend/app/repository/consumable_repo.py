
from datetime import datetime

from app.models.consumable_model import Consumable

from sqlalchemy import text

def create_consumable_repo(
    db,
    consumable
):

    db.add(consumable)

    db.flush()

    return consumable





def get_all_consumables_repo(db):
    return db.query(Consumable)\
        .filter(Consumable.deleted_at == None)\
        .order_by(Consumable.created_at.desc())\
        .all()
        
        
def get_consumable_by_id_repo(db, consumable_id: int):
    return db.query(Consumable).filter(
        Consumable.consumable_id == consumable_id,
        Consumable.deleted_at == None
    ).first()


def update_consumable_repo(
    db,
    consumable
):

    db.flush()

    return consumable


def soft_delete_consumable_repo(
    db,
    consumable
):

    consumable.deleted_at = datetime.utcnow()

    db.flush()

    return consumable


def create_consumable_txn_repo(
    db,
    txn
):

    db.add(txn)

    db.flush()

    return txn


def get_deleted_consumables_repo(db):
    return db.query(Consumable)\
        .filter(Consumable.deleted_at != None)\
        .order_by(Consumable.deleted_at.desc())\
        .all()
        
        
def get_consumable_transactions_repo(db, consumable_id: int):
    return db.execute(text("""
        SELECT 
            id,
            consumable_id,
            user_id,
            quantity,
            action,
            notes,
            created_at
        FROM consumable_transactions
        WHERE consumable_id = :consumable_id
        ORDER BY created_at DESC
    """), {"consumable_id": consumable_id}).fetchall()