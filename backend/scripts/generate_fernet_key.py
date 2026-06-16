#!/usr/bin/env python3
"""Generate a Fernet encryption key for token storage"""

from cryptography.fernet import Fernet

key = Fernet.generate_key().decode()
print(f"FERNET_KEY={key}")
print("\nAdd this to your .env file")
