from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.database import (
    asset_engine,
    task_engine,
    AssetBase,
    TaskBase,
)

from app.core.logging_config import setup_logging
from app.core.database_health import check_database_connection

from app.routes import asset_route,consumable_route, kit_routes
from app.routes import component_route
from app.routes import auth_route
from app.routes import master_route
from app.routes import accessories_route
from app.routes import license_route

from app.routes.employee_route import router as employee_router
from app.routes.permission_route import router as permission_router
from app.routes.role_route import router as role_router
from app.routes.group_route import router as group_router
from app.routes.import_route import router as import_router

# from app.routes.asset_maintenance_route import router as asset_maintenance_router
from app.routes.assigned_items_route import router as assigned_items_router
# from app.routes.assets_custom_report_route import router as asset_custom_report
# from app.routes.depreciation_report_route import router as depreciation_asset_report
# from app.routes.licence_report_route import router as license_report
# from app.routes.asset_request_route import router as asset_request

from app.routes.activity_log_route import router as activity_router
from app.routes.profile_route import router as profile_router
from app.routes.role_permission_route import router as role_permission_router

from app.routes.asset_computer_route import router as asset_computer_router
from app.routes.asset_computer_import_route import router as asset_computer_import_router

from app.routes.client_licence_route import  router as client_licence_router
from app.routes.client_licence_import_route import router as license_import_router
from app.routes.client_license_file_route import router as client_license_file_router

from app.routes.job_new_route import router as new_job_router
from app.routes.job_file_new_route import router as new_job_file_router
from app.routes.job_import_new_route import router as new_job_import_new_router
from app.routes.job_sub_job_route import router as jobs_sub_job_router
from app.routes.job_user_permission_route import router as job_user_permission_router

# old Job panel routes
from app.routes.job_route import router as job_router
from app.routes.job_file_route import router as job_file_router
from app.routes.job_import_route import router as job_import_router
from app.routes.test_new_route import router as test_new_router



from app.routes.ticket_route import router as ticket_router
from app.routes.ticket_reply_route import router as ticket_reply_router
from app.routes.ticket_priority_route import router as ticket_priority_router
from app.routes.ticket_status_route import router as ticket_status_router
from app.routes.ticket_visit_report_route import router as ticket_visit_report_router
from app.routes.ticket_daily_task_route import router as ticket_daily_task_router
from app.routes.ticket_chat_attachement_route import router as ticket_chat_attachement_router
from app.routes.ticket_notification_route import router as ticket_notification_router
#websocke ticket route import 
from app.websocket.ticket_chat_websocket import router as ticket_chat_ws_router


from app.routes.task_route import router as task_router
from app.routes.task_progress_route import router as task_progress_router
from app.routes.task_progress_attachment_routes import router as task_progress_attachement_router
from app.routes.task_status_routes import router as task_status_router
from app.routes.task_notification_route import router as task_notification_router
# task websocket route 
from app.websocket.task_websocket import router as task_websocket_router

from app.routes.job_qr_route import router as job_qr_router

from app.routes.feedback_route import router as feedback_router
from app.routes.redis_celery_diagnostic_route import router as status_diagnostic_router

from app.routes.system_log_route import router as system_log_router
from app.middleware.websocket_logging import (
    WebSocketLoggingMiddleware
)


# ============================================================
# LOGGING
# ============================================================

setup_logging()

logger = logging.getLogger("app")

logger.info("=" * 60)
logger.info("FastAPI application starting")
logger.info("FastAPI logging initialized")
logger.info("=" * 60)
check_database_connection()





app = FastAPI()


logger.info("=" * 60)
logger.info("FastAPI application started")
logger.info("Application initialized successfully")
logger.info("=" * 60)


app.add_middleware(
    WebSocketLoggingMiddleware
)


# ======= CORS FIRST =======
origins = [
    "http://localhost:5173",
    "http://192.168.1.22:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




app.mount(
    "/apiV3/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR),
    name="uploads"
)


# Create Auth DB tables
AssetBase.metadata.create_all(bind=asset_engine)

# Create Task DB tables
TaskBase.metadata.create_all(bind=task_engine)




app.include_router(auth_route.router)
app.include_router(asset_route.router)
app.include_router(master_route.router)

# app.include_router(checkout_checkin_route.router)

app.include_router(license_route.router)
app.include_router(accessories_route.router)
app.include_router(consumable_route.router)
app.include_router(component_route.router)
app.include_router(kit_routes.router)

app.include_router(employee_router)

# Roles and Permission Routes
app.include_router(permission_router)
app.include_router(role_router)
app.include_router(role_permission_router)
app.include_router(group_router)

# asset,licence,accessories,component, consumables ->>  import and their History router (not in use)
app.include_router(import_router)

# activity Report Router
app.include_router(activity_router)

# Asset Custom Report Generation router old (not in use)
# app.include_router(asset_custom_report)

# Asset depreciation Router router (not in use)
# app.include_router(depreciation_asset_report)

# Asset Maintance Report and request asset (not in use)
# app.include_router(asset_maintenance_router)
# app.include_router(asset_request)

# old license route
# app.include_router(license_report)

#assign item to user not in use 
app.include_router(assigned_items_router)


# user profile router 
app.include_router(profile_router)


# new Asset (client and comapny ) router 
app.include_router(asset_computer_router)
app.include_router(asset_computer_import_router)


app.include_router(client_licence_router)
app.include_router(license_import_router)
app.include_router(client_license_file_router)


# old Job Panel router (not in use )
# app.include_router(job_router)
# app.include_router(job_file_router)
# app.include_router(job_import_router)


# new Job Panel Routes
app.include_router(new_job_router)
app.include_router(new_job_file_router)
app.include_router(new_job_import_new_router)
app.include_router(jobs_sub_job_router)

# job User permission router
app.include_router(job_user_permission_router)



# app.include_router(test_new_router)

#User Tickets Routes 

app.include_router(ticket_router)
app.include_router(ticket_reply_router)
app.include_router(ticket_chat_attachement_router)
app.include_router(ticket_priority_router)
app.include_router(ticket_status_router)
app.include_router(ticket_daily_task_router)
app.include_router(ticket_visit_report_router)
app.include_router(ticket_notification_router)

# ticket websocket route (not shown in Swagger )
app.include_router(ticket_chat_ws_router)




# Task Router

app.include_router(task_router)
app.include_router(task_progress_router)
app.include_router(task_progress_attachement_router)
app.include_router(task_status_router)
app.include_router(task_notification_router)


# task Websocket Router (Not Shown in Swagger) 
app.include_router(task_websocket_router)

app.include_router(job_qr_router)

# User Feedback Form Route 
app.include_router(feedback_router)

# System Diagnostic Route 
app.include_router(status_diagnostic_router)

app.include_router(system_log_router)







# Request → Route → Service → Repository → DB



