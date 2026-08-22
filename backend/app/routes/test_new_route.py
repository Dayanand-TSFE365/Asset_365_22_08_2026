import os
from fastapi import (
    APIRouter
)
router=APIRouter(

    prefix="/test-route",

    tags=["Test"]
)

@router.get("/test-network")
def test_network():

    path = r"\\TSFE0-041\New folder"

    return {
        "exists": os.path.exists(path),
        "path": path
    }


@router.get("/test-job-folder")
def test_job_folder():

    path = r"\\TSFE0-041\New folder"

    return {
        "exists": os.path.exists(path),
        "folders": os.listdir(path)
        if os.path.exists(path)
        else []
    }


@router.get("/test-scan")
def test_scan():

    root = r"\\tsfe-00\Panel Jobs\J02"

    result = []

    for folder in os.listdir(root):

        folder_path = os.path.join(
            root,
            folder
        )

        if not os.path.isdir(folder_path):
            continue

        for file in os.listdir(folder_path):

            result.append({
                "folder": folder,
                "file": file
            })

    return result