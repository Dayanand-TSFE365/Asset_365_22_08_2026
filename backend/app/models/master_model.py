from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import AssetBase



class Models(AssetBase):
    __tablename__ = "Product_Models"

    model_id = Column(Integer, primary_key=True)
    model_name = Column(String, nullable=False)

    category_id = Column(Integer, ForeignKey("Product_Categories.category_id"))
    manufacturer_id = Column(Integer, ForeignKey("Product_Manufacturers.manufacturer_id"))

    category = relationship("Categories")
    manufacturer = relationship("Manufacturers")


class Categories(AssetBase):
    __tablename__ = "Product_Categories"

    category_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)


class Status(AssetBase):
    __tablename__ = "Product_Status"

    status_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)


class Locations(AssetBase):
    __tablename__ = "Product_Locations"

    location_id = Column(Integer, primary_key=True)
    location_name = Column(String, nullable=False)


class Companies(AssetBase):
    __tablename__ = "Product_Companies"

    company_id = Column(Integer, primary_key=True)
    company_name = Column(String, nullable=False)
    created_at = Column(DateTime)


class Manufacturers(AssetBase):
    __tablename__ = "Product_Manufacturers"

    manufacturer_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    contact_email = Column(String)
    contact_phone = Column(String)
    created_at = Column(DateTime)
    
    
class Suppliers(AssetBase):
    __tablename__ = "Suppliers"

    supplier_id = Column(Integer, primary_key=True)
    name = Column(String)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    created_at = Column(DateTime)