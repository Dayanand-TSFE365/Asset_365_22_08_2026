from app.models.job_file_model import JobFile


def create_job_file(
    db,
    data
):
    file = JobFile(
        **data
    )

    db.add(file)
    db.flush()

    return file