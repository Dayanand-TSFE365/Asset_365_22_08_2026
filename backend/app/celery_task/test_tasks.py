from app.celery_app import celery_app


@celery_app.task
def test_task(name: str):

    print(
        f"Processing test task for {name}"
    )

    return f"Hello {name}, Celery is working!"