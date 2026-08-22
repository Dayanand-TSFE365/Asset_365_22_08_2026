import pandas as pd


# 🔹 REQUIRED FIELD VALIDATOR
def validate_required_field(
    value,
    field_name,
    errors
):

    if pd.isna(value) or str(value).strip() == "":

        errors.append(f"{field_name} is required")


# 🔹 INTEGER VALIDATOR
def validate_integer_field(
    value,
    field_name,
    errors
):

    try:

        number = int(value)

        return number

    except:

        errors.append(f"{field_name} must be numeric")

        return None


# 🔹 NEGATIVE NUMBER VALIDATOR
def validate_non_negative(
    value,
    field_name,
    errors
):

    if value is not None and value < 0:

        errors.append(f"{field_name} cannot be negative")


# 🔹 AVAILABLE <= TOTAL VALIDATOR
def validate_available_less_than_total(
    available,
    total,
    errors
):

    if (
        available is not None
        and total is not None
        and available > total
    ):

        errors.append(
            "Available cannot exceed total"
        )