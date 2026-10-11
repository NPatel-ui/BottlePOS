import uuid

def generate_id() -> str:
    """Generate a standard UUID string for entity identification."""
    return str(uuid.uuid4())
