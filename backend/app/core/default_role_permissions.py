# ------------------------------------------------
    # GET DEFAULT PERMISSIONS
    # ---------------------------------
    
# DEFAULT ROLE TEMPLATES
# ------------------------------------------------

DEFAULT_ROLE_PERMISSIONS = {


    "HR": [

        "view_dashboard",

        "view_people",

        "manage_people",

        "view_reports"
    ],


    "Sales": [

        "view_dashboard",

        "view_assets",

        "view_requestable_items"
    ],
     "IT Department": [

        "view_dashboard",

        "view_assets",

        "create_assets",

        "update_assets",

        "delete_assets",

        "checkout_assets",

        "checkin_assets",

        "view_licenses",

        "manage_licenses",

        "view_accessories",

        "manage_accessories",

        "view_consumables",
        "manage_consumables",

        "view_components",

        "manage_components",

        "view_people",

        "view_reports"
    ],


    "Electrician": [

        "view_dashboard",

        "view_assets",
         "view_components",

        "checkout_components",

        "view_consumables",

        "checkout_consumables"
    ],


    "Automation Engineers": [

        "view_dashboard",

        "view_assets",

        "view_components",

        "manage_components",

        "view_kits",

        "manage_kits",

        "view_licenses"
    ],
    "Service Engineers": [

        "view_dashboard",

        "view_assets",

        "checkout_assets",

        "view_accessories",

        "checkout_accessories",

        "view_consumables",

        "checkout_consumables",

        "view_requestable_items"
    ],
    "Accounts": [

        "view_dashboard",

        "view_assets",

        "view_licenses",

        "view_reports"
    ],


    "Logistic Department": [

        "view_dashboard",

        "view_assets",

        "checkin_assets",

        "checkout_assets",

        "view_components",

        "manage_components",

        "view_consumables",
        
        "manage_consumables",

        "view_accessories",

        "manage_accessories",

        "import_assets"
    ]


}
