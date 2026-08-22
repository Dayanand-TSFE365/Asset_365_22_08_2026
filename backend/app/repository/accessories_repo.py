from datetime import datetime

from sqlalchemy.orm import Session
from app.models.accessories_model import Accessory
from sqlalchemy import text


def create_accessory_repo(
    db: Session,
    accessory: Accessory
):

    db.add(accessory)

    db.flush()

    return accessory




def get_all_accessories_repo(db: Session):
    return db.query(Accessory)\
        .filter(Accessory.deleted_at == None)\
        .order_by(Accessory.created_at.desc())\
        .all()
        
def get_accessory_by_id_repo(db, accessory_id: int):
    return db.query(Accessory).filter(
        Accessory.accessory_id == accessory_id,
        Accessory.deleted_at == None
    ).first()
    
def update_accessory_repo(db, accessory):

    db.flush()

    return accessory


def soft_delete_accessory_repo(db, accessory):

    accessory.deleted_at = datetime.utcnow()

    db.flush()

    return accessory



def get_deleted_accessories_repo(db):
    return db.query(Accessory).filter(
        Accessory.deleted_at != None
    ).all()
        




def create_transaction_repo(db, txn):

    db.add(txn)

    db.flush()

    return txn


def get_user_checked_out_qty_repo(db, accessory_id: int, user_id: int):
    result = db.execute(text("""
        SELECT 
            SUM(
                CASE 
                    WHEN action = 'checkout' THEN quantity
                    WHEN action = 'checkin' THEN -quantity
                END
            ) AS qty
        FROM accessory_transactions
        WHERE accessory_id = :accessory_id
        AND user_id = :user_id
    """), {
        "accessory_id": accessory_id,
        "user_id": user_id
    }).fetchone()

    return result.qty or 0

def get_accessory_transactions_repo(db, accessory_id: int):
    return db.execute(text("""
        SELECT 
            t.user_id,
            SUM(
                CASE 
                    WHEN t.action = 'checkout' THEN t.quantity
                    WHEN t.action = 'checkin' THEN -t.quantity
                END
            ) AS quantity,
            MAX(t.created_at) AS last_activity
        FROM accessory_transactions t
        WHERE t.accessory_id = :accessory_id
        GROUP BY t.user_id
        HAVING SUM(
                CASE 
                    WHEN t.action = 'checkout' THEN t.quantity
                    WHEN t.action = 'checkin' THEN -t.quantity
                END
            ) > 0
        ORDER BY last_activity DESC
    """), {"accessory_id": accessory_id}).fetchall()
        
        



