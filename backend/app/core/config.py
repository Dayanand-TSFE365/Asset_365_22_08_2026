from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    ASSET_DATABASE_URL = os.getenv("ASSET_DATABASE_URL")
    TASK_DATABASE_URL= os.getenv("TASK_DATABASE_URL")
    TICKET_DATABASE_URL= os.getenv("TICKET_DATABASE_URL")
    SECRET_KEY = os.getenv("SECRET_KEY")
    BASE_URL = os.getenv("BASE_URL")
    LICENSE_PRODUCT_SECRET_KEY= os.getenv("LICENSE_PRODUCT_SECRET_KEY")
    ASSET_ADMIN_PASSWORD_SECRET_KEY=os.getenv("ASSET_ADMIN_PASSWORD_SECRET_KEY")
    JOB_ROOT_PATH=os.getenv("JOB_ROOT_PATH")
    UPLOAD_DIR= os.getenv("UPLOAD_DIR")

    #  EMAIL SETTINGS
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_FROM = os.getenv("MAIL_FROM")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_TO = os.getenv("MAIL_TO")

    
    REDIS_URL= os.getenv("REDIS_URL")
    REDIS_RESULT_URL= os.getenv("REDIS_RESULT_URL")

    LOG_DIR = os.getenv("LOG_DIR")

    def validate(self):
        if not self.ASSET_DATABASE_URL:
            raise ValueError("ASSET_DATABASE_URL missing")
        if not self.TASK_DATABASE_URL:
            raise ValueError("TASK_DATABASE_URL missing")
        if not self.TICKET_DATABASE_URL:
            raise ValueError("TICKET_DATABASE_URL missing")
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY missing")

settings = Settings()
settings.validate()