FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
COPY src/ ./src/
COPY trained-models/ ./trained-models/

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "src/app.py"]