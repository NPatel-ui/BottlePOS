import logging
import sys
from app.core.config import settings

from pythonjsonlogger import jsonlogger

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(settings.log_level)
    root_logger.addHandler(handler)
    
    # Optional: adjust third-party loggers if needed
    logging.getLogger("uvicorn.access").handlers = [handler]


logger = logging.getLogger(settings.app_name)
