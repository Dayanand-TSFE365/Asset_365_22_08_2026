import bcrypt

# Plain password
password = "EAHWPRyb6"

# Convert to bytes
password_bytes = password.encode("utf-8")

# Generate salt and hash password
hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt())

# Print hashed password
print(hashed_password.decode("utf-8"))