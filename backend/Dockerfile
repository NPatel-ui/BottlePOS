FROM python:3.12-slim as builder

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

FROM python:3.12-slim

RUN groupadd -g 999 appuser && \
    useradd -m -u 999 -g appuser -d /home/appuser -s /bin/bash appuser && \
    mkdir -p /home/appuser /app && \
    chown -R appuser:appuser /home/appuser /app

WORKDIR /app

COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY --chown=appuser:appuser . .
COPY --chown=appuser:appuser .env.example .env

ENV HOME=/home/appuser
USER appuser

EXPOSE 8000 10000

ENV PYTHONPATH=/app
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app.main:app"]
