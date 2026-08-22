const BASE = import.meta.env.VITE_AUTH_BASE;

export const API = {
  // ─────────────────────────────
  // AUTH
  // ─────────────────────────────
  SIGNUP: `${BASE}/auth/signup`,
  LOGIN: `${BASE}/auth/login`,
  LOGOUT: `${BASE}/auth/logout`,
  REFRESH: `${BASE}/auth/refresh`,
  FORGOT_PASSWORD: `${BASE}/auth/forgot-password`,
  VERIFY_OTP: `${BASE}/auth/verify-otp`,
  RESET_PASSWORD_OTP: `${BASE}/auth/reset-password_otp`,
  VERIFY_EMAIL: `${BASE}/auth/verify-email`,
  ADMIN_ROUTE: `${BASE}/auth/admin`,
  APPROVE_USER: `${BASE}/auth/approve-user`,
  PENDING_USERS: `${BASE}/auth/pending-users`,

  // ─────────────────────────────
  // ASSETS
  // ─────────────────────────────
  GET_ASSETS: `${BASE}/assets/`,
  GET_DELETED_ASSETS: `${BASE}/assets/deleted`,
  GET_ASSET_BY_ID: (id) => `${BASE}/assets/${id}`,
  GET_ALL_ASSET_AUDITS: `${BASE}/assets/audits`,
  CREATE_ASSET: `${BASE}/assets/upload`,
  UPDATE_ASSET: (id) => `${BASE}/assets/${id}`,
  DELETE_ASSET: (id) => `${BASE}/assets/${id}`,

  // ASSET ACTIONS
  ASSET_CHECKOUT: (id) => `${BASE}/assets/${id}/checkout`,
  ASSET_CHECKIN: (id) => `${BASE}/assets/${id}/checkin`,
  ASSET_AUDIT: (id) => `${BASE}/assets/${id}/audit`,

 // ─────────────────────────────
 // ASSET REQUESTS
 // ─────────────────────────────

  GET_ASSET_REQUESTS: `${BASE}/asset-request/`,

  GET_ASSET_REQUEST_BY_ID: (id) =>
    `${BASE}/asset-request/${id}`,

  CREATE_ASSET_REQUEST: `${BASE}/asset-request/`,

  DELETE_ASSET_REQUEST: (id) =>
    `${BASE}/asset-request/${id}`,

  UPDATE_ASSET_REQUEST_STATUS: (id) =>
    `${BASE}/asset-request/${id}/status`,

  UPDATE_ASSET_REQUEST: (id) =>
    `${BASE}/asset-request/${id}`,

  GET_USER_ASSET_REQUESTS: (userId) =>
    `${BASE}/asset-request/user/${userId}`,

  GET_REQUESTABLE_ASSETS: `${BASE}/asset-request/requestable-assets`,

  CHECKOUT_ASSET_REQUEST: (id) =>
    `${BASE}/asset-request/${id}/checkout`,
  // ─────────────────────────────
  // COMPUTER ASSETS
  // ─────────────────────────────

  GET_COMPUTER_ASSETS: `${BASE}/computer-assets/`,
  GET_COMPUTER_ASSETS_COMPANY: `${BASE}/computer-assets/company`,
  GET_COMPUTER_ASSETS_CLIENT: `${BASE}/computer-assets/client`,

  CREATE_COMPUTER_ASSET: `${BASE}/computer-assets/`,
  // ✅ UPDATE COMPUTER ASSET
  UPDATE_COMPUTER_ASSET: (id) =>
    `${BASE}/computer-assets/${id}`,

  // ✅ DELETE COMPUTER ASSET
  DELETE_COMPUTER_ASSET: (id) =>
    `${BASE}/computer-assets/${id}`,
  REVEAL_COMPUTER_PASSWORD: (id) =>
  `${BASE}/computer-assets/${id}/reveal-password`,
  BULK_DELETE_COMPUTER_ASSETS: `${BASE}/computer-assets/action/bulk-delete`,
  // ─────────────────────────────
// COMPUTER ASSETS - RECYCLE BIN
// ─────────────────────────────

GET_DELETED_COMPUTER_ASSETS:
  `${BASE}/computer-assets/deleted`,

RESTORE_COMPUTER_ASSET: (id) =>
  `${BASE}/computer-assets/${id}/restore`,

PERMANENT_DELETE_COMPUTER_ASSET: (id) =>
  `${BASE}/computer-assets/${id}/permanent`,

  // ─────────────────────────────
  // LICENSES
  // ─────────────────────────────
  GET_LICENSES: `${BASE}/licenses/`,
  GET_DELETED_LICENSES: `${BASE}/licenses/deleted`,
  CREATE_LICENSE: `${BASE}/licenses/`,
  UPDATE_LICENSE: (id) => `${BASE}/licenses/${id}`,
  DELETE_LICENSE: (id) => `${BASE}/licenses/${id}`,
  LICENSE_CHECKOUT: (id) => `${BASE}/licenses/${id}/checkout`,
  LICENSE_CHECKIN: (id) => `${BASE}/licenses/${id}/checkin`,
  // REVEAL PRODUCT KEY (Super Admin Only)
  REVEAL_LICENSE_KEY: (licenseId) => `${BASE}/licenses/${licenseId}/reveal-key`,
  BULK_DELETE_CLIENT_LICENSES: `${BASE}/Clientlicenses/action/bulk-delete`,

  // ===============================
  // CLIENT LICENSES
  // ===============================

  GET_CLIENT_LICENSES: `${BASE}/Clientlicenses/`,
  CREATE_CLIENT_LICENSE: `${BASE}/Clientlicenses/`,
  GET_CLIENT_LICENSE_TYPES: `${BASE}/Clientlicenses/licence-type`,
  UPDATE_CLIENT_LICENSE: (license_id) =>
  `${BASE}/Clientlicenses/${license_id}`,
  DELETE_CLIENT_LICENSE: (license_id) =>
    `${BASE}/Clientlicenses/${license_id}`,
  REVEAL_PRODUCT_KEY: (licenseId) =>
  `${BASE}/Clientlicenses/${licenseId}/reveal-product-key`,
  // ===============================
// CLIENT LICENSES - RECYCLE BIN
// ===============================

GET_DELETED_CLIENT_LICENSES:
  `${BASE}/Clientlicenses/deleted`,

RESTORE_CLIENT_LICENSE: (license_id) =>
  `${BASE}/Clientlicenses/${license_id}/restore`,

PERMANENT_DELETE_CLIENT_LICENSE: (license_id) =>
  `${BASE}/Clientlicenses/${license_id}/permanent`,
// ─────────────────────────────
// LICENSE FILES - RECYCLE BIN
// ─────────────────────────────

GET_DELETED_LICENSE_FILES:
  `${BASE}/license-files/deleted`,

RESTORE_LICENSE_FILE: (fileId) =>
  `${BASE}/license-files/${fileId}/restore`,

PERMANENT_DELETE_LICENSE_FILE: (fileId) =>
  `${BASE}/license-files/${fileId}/permanent`,

  // ==============================
// LICENSE FILES
// ==============================

// Upload one or more files for a license
UPLOAD_LICENSE_FILES: (licenseId) =>
  `${BASE}/license-files/upload/${licenseId}`,

// Get all files of a license
GET_LICENSE_FILES: (licenseId) =>
  `${BASE}/license-files/license/${licenseId}`,

// Get single file details
GET_LICENSE_FILE: (fileId) =>
  `${BASE}/license-files/${fileId}`,

GET_LICENSE_FILE_STATUS: `${BASE}/license-files/status`,

// Delete a file
DELETE_LICENSE_FILE: (fileId) =>
  `${BASE}/license-files/${fileId}`,

// Download a file
DOWNLOAD_LICENSE_FILE: (fileId) =>
  `${BASE}/license-files/download/${fileId}`,

  // ─────────────────────────────
  // ACCESSORIES
  // ─────────────────────────────
  GET_ACCESSORIES: `${BASE}/accessories`,
  GET_DELETED_ACCESSORIES: `${BASE}/accessories/deleted`,
  CREATE_ACCESSORY: `${BASE}/accessories`,
  UPDATE_ACCESSORY: (id) => `${BASE}/accessories/${id}`,
  DELETE_ACCESSORY: (id) => `${BASE}/accessories/${id}`,
  ACCESSORY_TRANSACTIONS: (id) =>`${BASE}/accessories/${id}/transactions`,
  ACCESSORY_CHECKOUT: `${BASE}/accessories/checkout`,
  ACCESSORY_CHECKIN: `${BASE}/accessories/checkin`,

  // ─────────────────────────────
  // CONSUMABLES
  // ─────────────────────────────
  GET_CONSUMABLES: `${BASE}/consumables`,
  GET_DELETED_CONSUMABLES: `${BASE}/consumables/deleted`,
  CREATE_CONSUMABLE: `${BASE}/consumables`,
  UPDATE_CONSUMABLE: (id) => `${BASE}/consumables/${id}`,
  DELETE_CONSUMABLE: (id) => `${BASE}/consumables/${id}`,
  CONSUMABLE_CONSUME: `${BASE}/consumables/consume`,
  CONSUMABLE_ADD_STOCK: `${BASE}/consumables/add-stock`,
  CONSUMABLE_TRANSACTIONS: (id) =>`${BASE}/consumables/${id}/transactions`,

  // ─────────────────────────────
  // COMPONENTS
  // ─────────────────────────────
  GET_COMPONENTS: `${BASE}/components/`,
  CREATE_COMPONENT: `${BASE}/components/`,
  GET_COMPONENT: (id) => `${BASE}/components/${id}`,
  UPDATE_COMPONENT: (id) => `${BASE}/components/${id}`,
  DELETE_COMPONENT: (id) => `${BASE}/components/${id}`,
  CHECKOUT_COMPONENT: (id) =>`${BASE}/components/${id}/checkout`,
  CHECKIN_COMPONENT: (id) =>`${BASE}/components/${id}/checkin`,
  GET_COMPONENT_TRANSACTIONS: (id) =>`${BASE}/components/${id}/transactions`,

  // ─────────────────────────────
  // KITS
  // ─────────────────────────────
  GET_KITS: `${BASE}/kits/`,
  CREATE_KIT: `${BASE}/kits/`,
  GET_KIT: (id) => `${BASE}/kits/${id}`,
  UPDATE_KIT: (id) => `${BASE}/kits/${id}`,
  DELETE_KIT: (id) => `${BASE}/kits/${id}`,

  // KIT ITEMS
  ADD_KIT_ITEM: (id) => `${BASE}/kits/${id}/items`,
  UPDATE_KIT_ITEM: (itemId) => `${BASE}/kits/items/${itemId}`,
  REMOVE_KIT_ITEM: (itemId) => `${BASE}/kits/items/${itemId}`,

  // KIT ACTIONS
  CHECKOUT_KIT: (id) => `${BASE}/kits/${id}/checkout`,
  CHECKIN_KIT: (transactionId) =>`${BASE}/kits/transactions/${transactionId}/checkin`,
  GET_ACTIVE_KIT_TRANSACTIONS:`${BASE}/kits/transactions/active`,

  // ─────────────────────────────
  // MASTER
  // ─────────────────────────────
  GET_MODELS: `${BASE}/master/models`,
  CREATE_MODEL: `${BASE}/master/models`,

  GET_CATEGORIES: `${BASE}/master/categories`,
  CREATE_CATEGORY: `${BASE}/master/categories`,

  GET_STATUS: `${BASE}/master/status`,
  CREATE_STATUS: `${BASE}/master/status`,

  GET_USERS: `${BASE}/master/users`,

  GET_LOCATIONS: `${BASE}/master/locations`,
  CREATE_LOCATION: `${BASE}/master/locations`,

  GET_COMPANIES: `${BASE}/master/companies`,
  CREATE_COMPANY: `${BASE}/master/companies`,

  GET_MANUFACTURERS: `${BASE}/master/manufacturers`,
  CREATE_MANUFACTURER: `${BASE}/master/manufacturers`,

  GET_SUPPLIERS: `${BASE}/master/suppliers`,
  CREATE_SUPPLIER: `${BASE}/master/suppliers`,

  // ─────────────────────────────
  // EMPLOYEES
  // ─────────────────────────────
  GET_EMPLOYEES: `${BASE}/employees/`,
  CREATE_EMPLOYEE: `${BASE}/employees/`,
  UPDATE_EMPLOYEE: (id) => `${BASE}/employees/${id}`,
  DELETE_EMPLOYEE: (id) => `${BASE}/employees/${id}`,
  GET_DELETED_EMPLOYEES: `${BASE}/employees/deleted/list`,

  // ─────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────
  GET_PERMISSIONS: `${BASE}/permissions/`,
  GET_MY_PERMISSIONS: `${BASE}/permissions/me`,
  GET_ALL_USERS_PERMISSIONS:`${BASE}/permissions/all_users`,
  CREATE_PERMISSION: `${BASE}/permissions/create`,
  // USER DIRECT PERMISSIONS
  ASSIGN_USER_PERMISSION:
    `${BASE}/permissions/assign-user-permission`,

  REMOVE_USER_PERMISSION:
    `${BASE}/permissions/remove-user-permission`,

  // ─────────────────────────────
  // ROLES
  // ─────────────────────────────
  GET_ROLES: `${BASE}/roles/`,
  CREATE_ROLE: `${BASE}/roles/create`,
  ASSIGN_ROLE: `${BASE}/roles/assign`,
  ASSIGN_ROLE_PERMISSION:
    `${BASE}/roles/assign-role-permission`,

  REMOVE_ROLE_PERMISSION:
    `${BASE}/roles/remove-permission`,
    
  GET_USER_ROLE_BY_ID: (userId) => `${BASE}/roles/user/${userId}`,  

  REMOVE_USER_ROLE:`${BASE}/roles/remove-user-role`,
  GET_USER_ROLE:`${BASE}/roles/user`,
  UPDATE_USER_ROLE:`${BASE}/roles/update-user-role`,
  // ROLE PERMISSIONS
  GET_ROLE_PERMISSIONS: (roleId) =>
    `${BASE}/roles/${roleId}/permissions`,

  UPDATE_ROLE_PERMISSIONS: (roleId) =>
    `${BASE}/roles/${roleId}/permissions`,

  // ─────────────────────────────
  // GROUPS
  // ─────────────────────────────
  GET_GROUPS: `${BASE}/groups/`,
  CREATE_GROUP: `${BASE}/groups/create`,

  ASSIGN_USER_GROUP: `${BASE}/groups/assign-user`,
  REMOVE_USER_GROUP: `${BASE}/groups/remove-user`,

  ASSIGN_GROUP_PERMISSION: `${BASE}/groups/assign-permission`,
  REMOVE_GROUP_PERMISSION: `${BASE}/groups/remove-permission`,

  GET_GROUP_PERMISSIONS: (group_id) =>
    `${BASE}/groups/${group_id}/permissions`,
  GET_GROUP_USERS: (group_id) =>
  `${BASE}/groups/${group_id}/users`,
  DELETE_GROUP: (group_id) =>
  `${BASE}/groups/${group_id}`,

  //─────────────────────────────
  //Import
  //─────────────────────────────
  //Common
  IMPORT_HISTORY: `${BASE}/import/`,
  IMPORT_ERRORS: (id) => `${BASE}/import/${id}/errors`,

  //Assets
  IMPORT_ASSETS: `${BASE}/import/assets`,
  IMPORT_ASSETS_TEMPLATE: `${BASE}/import/assets/template`,

  //Licenses
  IMPORT_LICENSES: `${BASE}/import/licenses`,
  IMPORT_LICENSES_TEMPLATE: `${BASE}/import/licenses/template`,

  //Accessories
  IMPORT_ACCESSORIES: `${BASE}/import/accessories`,
  IMPORT_ACCESSORIES_TEMPLATE: `${BASE}/import/accessories/template`,

  //Consumables
  IMPORT_CONSUMABLES: `${BASE}/import/consumables`,
  IMPORT_CONSUMABLES_TEMPLATE:`${BASE}/import/consumables/template`,

  //Components
  IMPORT_COMPONENTS: `${BASE}/import/components`,
  IMPORT_COMPONENTS_TEMPLATE: `${BASE}/import/components/template`,


  // Import
IMPORT_COMPUTER_ASSETS: `${BASE}/computer-assets/import`,

// Import History
GET_COMPUTER_ASSET_IMPORT_HISTORY: `${BASE}/computer-assets/import/history`,

// Import Errors
GET_COMPUTER_ASSET_IMPORT_ERRORS: (importId) =>
  `${BASE}/computer-assets/import/errors/${importId}`,

// Download Template
DOWNLOAD_COMPUTER_ASSET_TEMPLATE:
  `${BASE}/computer-assets/computer_assets/template`,

  // Client License Import
IMPORT_CLIENT_LICENSES: `${BASE}/client-licenses/import`,

// Client License Import History
GET_CLIENT_LICENSE_IMPORT_HISTORY:
  `${BASE}/client-licenses/import/history`,

// Client License Import Errors
GET_CLIENT_LICENSE_IMPORT_ERRORS: (importId) =>
  `${BASE}/client-licenses/import/errors/${importId}`,

// Client License Template
DOWNLOAD_CLIENT_LICENSE_TEMPLATE:
  `${BASE}/client-licenses/template`,

  // ─────────────────────────────
  // REPORTS
  // ─────────────────────────────
  GET_ACTIVITY_REPORT: `${BASE}/reports/activity`,
  CUSTOM_ASSET_REPORT: `${BASE}/reports/assets/custom`,
  EXPORT_ASSET_REPORT: `${BASE}/reports/assets/export`,
  // Depreciation Report
  GET_ASSET_DEPRECIATION_REPORT: `${BASE}/reports/assets/depreciation`,
  GET_LICENSE_DEPRECIATION_REPORT: `${BASE}/reports/licenses/depreciation`,

  // ASSET MAINTENANCE
  GET_ASSET_MAINTENANCE: `${BASE}/assets-maintenance/`,
  CREATE_ASSET_MAINTENANCE: (assetId) =>`${BASE}/assets-maintenance/${assetId}`,
  UPDATE_ASSET_MAINTENANCE: (id) =>`${BASE}/assets-maintenance/${id}`,
  DELETE_ASSET_MAINTENANCE: (id) =>`${BASE}/assets-maintenance/${id}`,

// ─────────────────────────────
// PROFILE / SETTINGS
// ─────────────────────────────

GET_MY_PROFILE: (userId) =>
  `${BASE}/profile/me?auth_user_id=${userId}`,

GET_PROFILE_IMAGE: (filename) =>
  `${BASE}/profile/image/${filename}`,

UPDATE_MY_PROFILE: (userId) =>
  `${BASE}/profile/me?auth_user_id=${userId}`,

CHANGE_PASSWORD: `${BASE}/profile/change-password`,

GET_MY_ASSIGNED_ITEMS: (userId) => `${BASE}/my-assigned-items/?user_id=${userId}`,

// ===============================
// JOBS — OLD FLAT STRUCTURE (superseded by JOBS-NEW below)
// ===============================
// Kept only as reference / rollback. Every job-facing component should now
// point at the JOBS-NEW block further down. GET_JOB_STATUS is the one
// exception — the Job/Sub-Job split didn't touch job statuses, so it's left
// active and reused by the new forms too.

// GET_JOBS: `${BASE}/jobs/`,
// CREATE_JOB: `${BASE}/jobs/`,
// SEARCH_JOBS: `${BASE}/jobs/search`,
// GET_JOB: (jobId) => `${BASE}/jobs/${jobId}`,
// UPDATE_JOB: (jobId) => `${BASE}/jobs/${jobId}`,
// DELETE_JOB: (jobId) => `${BASE}/jobs/${jobId}`,
// RESTORE_JOB: (jobId) => `${BASE}/jobs/restore/${jobId}`,

GET_JOB_STATUS: `${BASE}/jobs/job-status`,

// ===============================
// JOB FILES — OLD (superseded by JOB FILES-NEW below; old files were keyed
// by job_id, new ones are keyed by sub_job_id)
// ===============================

// UPLOAD_JOB_FILE: (jobId) => `${BASE}/job-files/upload/${jobId}`,
// GET_JOB_FILES: (jobId) => `${BASE}/job-files/job/${jobId}`,
// GET_JOB_FILE: (fileId) => `${BASE}/job-files/${fileId}`,
// DELETE_JOB_FILE: (fileId) => `${BASE}/job-files/${fileId}`,
// DOWNLOAD_JOB_FILE: (fileId) => `${BASE}/job-files/download/${fileId}`,

// ===============================
// JOB PERMISSIONS — unchanged. Still keyed by job_id, and job_id still
// exists (as the parent Job) under the new structure, so JobPermissionsDialog
// keeps working as-is against the new Job's job_id.
// ===============================
CREATE_JOB_PERMISSION: `${BASE}/job-permissions/`,
GET_JOB_PERMISSIONS: (jobId) => `${BASE}/job-permissions/job/${jobId}`,
GET_JOB_PERMISSION: (permissionId) => `${BASE}/job-permissions/${permissionId}`,
UPDATE_JOB_PERMISSION: (permissionId) => `${BASE}/job-permissions/${permissionId}`,
DELETE_JOB_PERMISSION: (permissionId) => `${BASE}/job-permissions/${permissionId}`,

// ======================= JOBS IMPORT — OLD (superseded below) =======================

// IMPORT_JOBS: `${BASE}/jobs/import`,
// DOWNLOAD_JOB_TEMPLATE: `${BASE}/jobs/import/template`,
// GET_JOB_IMPORT_HISTORY: `${BASE}/jobs/import/history`,
// GET_JOB_IMPORT_ERRORS: (id) => `${BASE}/jobs/import/errors/${id}`,

// ===============================
// JOBS-NEW — Job / Sub-Job (panel) structure
// ===============================
// POST/GET/PUT/DELETE all operate on the parent Job. POST doubles as
// "create job if it doesn't exist yet, then always create a new Sub-Job
// (panel)" — see JobCreateForm for how job-level and panel-level fields
// are combined into one payload.

GET_JOBS_NEW: `${BASE}/jobs-new/`,

CREATE_JOB_NEW: `${BASE}/jobs-new/`,

GET_JOB_NEW: (jobId) =>
  `${BASE}/jobs-new/${jobId}`,

UPDATE_JOB_NEW: (jobId) =>
  `${BASE}/jobs-new/${jobId}`,

DELETE_JOB_NEW: (jobId) =>
  `${BASE}/jobs-new/${jobId}`,

// ===============================
// SUB JOBS — panel-level CRUD. Separate from the job-level PUT on
// jobs-new, and separate from job-files-new (which only handles files
// under a panel, not the panel's own fields like description/qty/flags).
// ===============================

GET_SUB_JOB: (subJobId) =>
  `${BASE}/sub-jobs/${subJobId}`,

UPDATE_SUB_JOB: (subJobId) =>
  `${BASE}/sub-jobs/${subJobId}`,

DELETE_SUB_JOB: (subJobId) =>
  `${BASE}/sub-jobs/${subJobId}`,
// ===============================
// JOB FILES-NEW — keyed by sub_job_id (panel), not job_id
// ===============================

UPLOAD_JOB_FILE_NEW: (subJobId) =>
  `${BASE}/job-files-new/upload/${subJobId}`,

GET_JOB_FILES_NEW: (subJobId) =>
  `${BASE}/job-files-new/sub-job/${subJobId}`,

GET_JOB_FILE_NEW: (fileId) =>
  `${BASE}/job-files-new/${fileId}`,

DELETE_JOB_FILE_NEW: (fileId) =>
  `${BASE}/job-files-new/${fileId}`,

DOWNLOAD_JOB_FILE_NEW: (fileId) =>
  `${BASE}/job-files-new/download/${fileId}`,

// ===============================
// JOBS NEW - RECYCLE BIN
// ===============================

GET_DELETED_JOBS_NEW:
  `${BASE}/jobs-new/deleted`,

RESTORE_JOB_NEW: (jobId) =>
  `${BASE}/jobs-new/${jobId}/restore`,

PERMANENT_DELETE_JOB_NEW: (jobId) =>
  `${BASE}/jobs-new/${jobId}/permanent`,

// ===============================
// SUB JOBS - RECYCLE BIN
// ===============================

GET_DELETED_SUB_JOBS:
  `${BASE}/sub-jobs/deleted`,

RESTORE_SUB_JOB: (subJobId) =>
  `${BASE}/sub-jobs/${subJobId}/restore`,

PERMANENT_DELETE_SUB_JOB: (subJobId) =>
  `${BASE}/sub-jobs/${subJobId}/permanent`,
// ===============================
// JOB FILES-NEW - RECYCLE BIN
// ===============================

GET_DELETED_JOB_FILES_NEW:
  `${BASE}/job-files-new/deleted`,

RESTORE_JOB_FILE_NEW: (fileId) =>
  `${BASE}/job-files-new/${fileId}/restore`,

PERMANENT_DELETE_JOB_FILE_NEW: (fileId) =>
  `${BASE}/job-files-new/${fileId}/permanent`,

// ===============================
// JOBS-NEW IMPORT
// ===============================

IMPORT_JOBS_NEW: `${BASE}/jobs-new/import`,

GET_JOB_NEW_IMPORT_HISTORY: `${BASE}/jobs-new/import/history`,

GET_JOB_NEW_IMPORT_ERRORS: (importId) =>
  `${BASE}/jobs-new/import/errors/${importId}`,

DOWNLOAD_JOB_NEW_TEMPLATE: `${BASE}/jobs-new/import/template`,

// ===============================
// TICKETS
// ===============================

GET_TICKETS: `${BASE}/tickets`,

UPDATE_TICKET: (id) =>
  `${BASE}/tickets/${id}`,

DELETE_TICKET: (id) =>
  `${BASE}/tickets/${id}`,

ASSIGN_TICKET: (id) =>
  `${BASE}/tickets/${id}/assign`,

// note: this one is on /ticket-statuses, not /tickets — matches the spec
UPDATE_TICKET_STATUS: (id) =>
  `${BASE}/ticket-statuses/${id}/status`,

GET_TICKET: (id) =>
  `${BASE}/tickets/${id}`,

CREATE_TICKET: `${BASE}/tickets`,

CREATE_TICKET_REPLY: (id) =>
  `${BASE}/tickets/${id}/reply`,
// ===============================
// TICKETS - RECYCLE BIN
// ===============================

GET_DELETED_TICKETS:
  `${BASE}/tickets/deleted`,

RESTORE_TICKET: (ticketId) =>
  `${BASE}/tickets/${ticketId}/restore`,

PERMANENT_DELETE_TICKET: (ticketId) =>
  `${BASE}/tickets/${ticketId}/permanent`,

// ─────────────────────────────
// TICKET ATTACHMENTS
// ─────────────────────────────
DOWNLOAD_TICKET_ATTACHMENT: (attachmentId) =>
  `${BASE}/ticket-attachments/${attachmentId}/download`, // GET (blob)

DELETE_TICKET_ATTACHMENT: (attachmentId) =>
  `${BASE}/ticket-attachments/${attachmentId}`, // DELETE

GET_TICKET_PRIORITIES:
  `${BASE}/ticket-priorities`,

GET_TICKET_STATUSES:
  `${BASE}/ticket-statuses`,

UPDATE_TICKET_STATUS: (ticketId) =>
  `${BASE}/ticket-statuses/${ticketId}/status`, // PATCH { status_id }
    // ─────────────────────────────
  // DAILY TASKS (Ticket-specific daily update tasks)
  // ─────────────────────────────
  CREATE_DAILY_TASKS: (ticketId) => `${BASE}/tickets/${ticketId}/daily-tasks`, // POST (bulk)
  GET_DAILY_TASKS: (ticketId) => `${BASE}/tickets/${ticketId}/daily-tasks`, // GET
  UPDATE_DAILY_TASK: (taskId) => `${BASE}/daily-tasks/${taskId}`, // PUT
  DELETE_DAILY_TASK: (taskId) => `${BASE}/daily-tasks/${taskId}`, // DELETE
  CHECK_DAILY_TASK: (taskId) => `${BASE}/daily-tasks/${taskId}/check`, // PATCH

// ─────────────────────────────
// VISIT REPORT
// ─────────────────────────────
CREATE_VISIT_REPORT: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report`, // POST  { members: [] }

GET_VISIT_REPORT: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report`, // GET

UPDATE_VISIT_REPORT: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report`, // PUT   { members: [] }

DELETE_VISIT_REPORT: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report`, // DELETE

GET_VISIT_REPORT_PDF_DATA: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report/pdf-data`, // GET — everything needed to render the PDF

SUBMIT_VISIT_REPORT: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report/submit`, // PATCH

APPROVE_VISIT_REPORT: (ticketId) =>
  `${BASE}/tickets/${ticketId}/visit-report/approve`, // PATCH
  
// ─────────────────────────────
// TICKET NOTIFICATIONS
// ─────────────────────────────
GET_TICKET_NOTIFICATIONS:
  `${BASE}/ticket-notifications`, // GET

GET_UNREAD_TICKET_NOTIFICATIONS:
  `${BASE}/ticket-notifications/unread`, // GET

MARK_TICKET_NOTIFICATION_READ: (notificationId) =>
  `${BASE}/ticket-notifications/${notificationId}/read`, // PATCH

MARK_ALL_TICKET_NOTIFICATIONS_READ:
  `${BASE}/ticket-notifications/read-all`, // PATCH
// ─────────────────────────────
  // TASKS
  // ─────────────────────────────
  GET_TASKS: `${BASE}/tasks/`,
  CREATE_TASK: `${BASE}/tasks/`,
  GET_TASK: (taskId) => `${BASE}/tasks/${taskId}`,
  UPDATE_TASK: (taskId) => `${BASE}/tasks/${taskId}`,
  DELETE_TASK: (taskId) => `${BASE}/tasks/${taskId}`,
  UPDATE_CHECKLIST: (checklistId) => `${BASE}/tasks/checklists/${checklistId}`,

  // ─────────────────────────────
// TASKS - RECYCLE BIN
// ─────────────────────────────
GET_DELETED_TASKS:
  `${BASE}/tasks/deleted`,

RESTORE_TASK: (taskId) =>
  `${BASE}/tasks/${taskId}/restore`,

PERMANENT_DELETE_TASK: (taskId) =>
  `${BASE}/tasks/${taskId}/permanent`,


  // Assign / Reassign both hit this same PATCH endpoint —
  // there's no separate "reassign" route, it's just assign again with a new user
  ASSIGN_TASK: (taskId) => `${BASE}/tasks/${taskId}/assign`,

  // TASK ATTACHMENTS
  UPLOAD_TASK_ATTACHMENTS: (taskId) => `${BASE}/tasks/${taskId}/attachments`,
  GET_TASK_ATTACHMENTS: (taskId) => `${BASE}/tasks/${taskId}/attachments`,
  DELETE_TASK_ATTACHMENT: (attachmentId) => `${BASE}/tasks/attachments/${attachmentId}`,

  // ─────────────────────────────
  // TASK PROGRESS
  // ─────────────────────────────
  CREATE_TASK_PROGRESS: (taskId) => `${BASE}/tasks/${taskId}/progress`,
  GET_TASK_PROGRESS_HISTORY: (taskId) => `${BASE}/tasks/${taskId}/progress`,
  GET_TASK_PROGRESS: (progressId) => `${BASE}/tasks/progress/${progressId}`,

  UPLOAD_PROGRESS_ATTACHMENTS: (progressId) => `${BASE}/tasks/progress/${progressId}/attachments`,
  GET_PROGRESS_ATTACHMENTS: (progressId) => `${BASE}/tasks/progress/${progressId}/attachments`,
  DELETE_PROGRESS_ATTACHMENT: (attachmentId) => `${BASE}/tasks/progress/attachments/${attachmentId}`,
  DOWNLOAD_PROGRESS_ATTACHMENT: (attachmentId) =>`${BASE}/tasks/progress/attachments/${attachmentId}/download`,

  // ─────────────────────────────
  // TASK STATUS
  // ─────────────────────────────
  CHANGE_TASK_STATUS: (taskId) => `${BASE}/tasks/${taskId}/status`,
  GET_TASK_STATUS_HISTORY: (taskId) => `${BASE}/tasks/${taskId}/status-history`,
  CLOSE_TASK: (taskId) => `${BASE}/tasks/${taskId}/close`,

 // ─────────────────────────────
// TASK NOTIFICATIONS
// ─────────────────────────────
GET_TASK_NOTIFICATIONS: `${BASE}/tasks/notifications/`,
GET_TASK_NOTIFICATION_COUNT: `${BASE}/tasks/notifications/unread-count`,
MARK_TASK_NOTIFICATION_READ: (notificationId) =>
  `${BASE}/tasks/notifications/${notificationId}/read`,
MARK_ALL_TASK_NOTIFICATIONS_READ: `${BASE}/tasks/notifications/read-all`,
// ─────────────────────────────
// Feedback
// ─────────────────────────────
CREATE_FEEDBACK: `${BASE}/feedback/`,
GET_ALL_FEEDBACK: `${BASE}/feedback/`,
GET_MY_FEEDBACKS: `${BASE}/feedback/my`,
GET_FEEDBACK: (id) => `${BASE}/feedback/${id}`,
UPDATE_FEEDBACK: (id) => `${BASE}/feedback/${id}`, 
};