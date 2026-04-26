FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY demo/api/requirements.txt /app/demo/api/requirements.txt
RUN pip install -r /app/demo/api/requirements.txt

COPY demo/api/ /app/demo/api/
COPY results/ /app/results/

WORKDIR /app/demo/api

ENV PORT=8080
EXPOSE 8080

CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
