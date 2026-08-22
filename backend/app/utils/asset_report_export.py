import csv
import os
from datetime import datetime


EXPORT_DIR = "exports"

os.makedirs(EXPORT_DIR, exist_ok=True)


def export_csv(columns, rows):

    filename = (
        f"asset_report_"
        f"{datetime.utcnow().timestamp()}.csv"
    )

    filepath = os.path.join(
        EXPORT_DIR,
        filename
    )

    with open(
        filepath,
        mode="w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=columns
        )

        writer.writeheader()

        writer.writerows(rows)

    return filepath