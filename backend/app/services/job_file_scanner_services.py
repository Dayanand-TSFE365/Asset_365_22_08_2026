import os
from app.core.config import settings
from app.repository.job_file_scanner_repo import (
    create_job_file
)

UPLOAD_DIR = settings.UPLOAD_DIR

def scan_job_folder(
    db,
    job_id,
    job_no
):
    job_path = os.path.join(
        settings.UPLOAD_DIR,
        job_no
    )

    if not os.path.exists(job_path):
        return
    

    for folder in os.listdir(job_path):

        folder_path = os.path.join(
            job_path,
            folder
        )
        
        if not os.path.isdir(folder_path):
            continue
        
        for file_name in os.listdir(folder_path):
        
            file_path = os.path.join(
                folder_path,
                file_name
            )

            if not os.path.isfile(file_path):
                continue
        
            create_job_file(
                db,
                {
                    "job_id": job_id,
                    "file_type": folder.upper(),
                    "original_file_name":
                        file_name,
                    "stored_file_name":
                        file_name,
                    "file_path":
                        file_path,
                    "file_size":
                        os.path.getsize(
                            file_path
                        )
                }
            )