import multiprocessing
import os

port = os.getenv("PORT", "8000")
bind = os.getenv("BIND", f"0.0.0.0:{port}")
worker_class = "uvicorn.workers.UvicornWorker"

cores = multiprocessing.cpu_count()
workers = int(os.getenv("WORKERS", min(cores * 2 + 1, 4)))
timeout = int(os.getenv("TIMEOUT", "120"))
keepalive = int(os.getenv("KEEPALIVE", "5"))

# Use /dev/shm in containers to prevent disk I/O lockups and permission issues
if os.path.exists("/dev/shm"):
    worker_tmp_dir = "/dev/shm"

accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()
